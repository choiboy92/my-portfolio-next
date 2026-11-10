import { formatPounds } from '@/lib/catalogue/format'
import type { BandGroup, BandStyle, Model, Spec } from '@/lib/catalogue/schema'
import {
  amountOf,
  displayHeader,
  extractKeyedJson,
  extractWindowJson,
  MissingDataError,
  normaliseLabel,
  parsePounds,
  productName,
  readProductSelection,
  stripHtml,
  type DisplayGroup,
  type PriceTable,
} from './extract'
import type { Fetcher } from './http'
import type { MappedModel, MapResult, Page, PublishedPrice } from './types'
import { compareStrings, isRecord, rankIn, unique, uniqueBy } from './util'

type Product = {
  part: string
  dimensions: Record<string, string>
  priceKey: string
}

type Bootstrap = {
  products: Product[]
  displayValues: Record<string, DisplayGroup> & { prices: PriceTable }
}

type Row = { product: Product; size: string; material: string; connection: string; price: number }

type Selection = {
  groups: { name: string; items: string[] }[]
  items: Record<string, { name: string; colours: string[]; colourValues: string[] }>
  prices: Record<string, number>
}

type BandCall = { casePrice: number; selection: Selection; sizes: Record<string, string[]> }

type MaterialBands = Map<string, BandCall>

type StyleRead = {
  name: string
  group: string
  surcharge: number
  colours: string[]
  sizes: string[]
}

type StyleReads = Map<string, { read: StyleRead[]; present: string[] }>

const SIZE = 'watch_cases-dimensionCaseSize'
const MATERIAL = 'watch_cases-dimensionCaseMaterial'
const COLOR = 'watch_cases-dimensionColor'
const CONNECTION = 'watch_cases-dimensionConnection'
const KNOWN = new Set([SIZE, MATERIAL, COLOR, CONNECTION])

const LABEL_NOISE = [/<span[^>]*badge[^>]*>[\s\S]*?<\/span>/g, /<as-footnote[\s\S]*?<\/as-footnote>/g]

const plain = (html: string) => stripHtml(html, LABEL_NOISE)

function readBootstrap(bootstrap: unknown, url: string): Bootstrap {
  const { products, display } = readProductSelection<Product>(bootstrap, url, 'displayValues')
  return { products, displayValues: display }
}

function header(b: Bootstrap, group: string, value: string): string | undefined {
  return displayHeader(b.displayValues[group], value)
}

function sizeLabel(b: Bootstrap, value: string): string {
  const h = header(b, SIZE, value)
  return (h && plain(h)) || value
}

function connectionLabel(b: Bootstrap, value: string): string {
  const h = header(b, CONNECTION, value)
  const lead = h ? plain(h.split('<')[0]) : ''
  return lead || value
}

const MATERIAL_NAMES: Record<string, string> = { aluminum: 'Aluminium', aluminium: 'Aluminium', titanium: 'Titanium', ceramic: 'Ceramic' }

function materialLabel(b: Bootstrap, value: string): string {
  const h = header(b, MATERIAL, value)
  const div = h?.match(/<div[^>]*>([\s\S]*?)<\/div>/)
  const text = div ? plain(div[1]) : h ? plain(h) : ''
  return text || MATERIAL_NAMES[value] || value.charAt(0).toUpperCase() + value.slice(1)
}

function specNameOf(b: Bootstrap, material: string, name: string, url: string): string {
  if (material) return `${materialLabel(b, material)} Case`
  const fromUrl = /-([a-z]+)-case(?:[/?#]|$)/.exec(new URL(url).pathname)?.[1]
  return fromUrl ? `${materialLabel(b, fromUrl)} Case` : name
}

function colourLabel(b: Bootstrap, value: string): string {
  const entry = b.displayValues[COLOR]?.[value]
  return isRecord(entry) && typeof entry.text === 'string' ? normaliseLabel(entry.text) : value
}

function sortByOrder(b: Bootstrap, group: string, values: Iterable<string>): string[] {
  const order = b.displayValues[group]?.variantOrder
  return unique(values).sort((x, y) => rankIn(order, x) - rankIn(order, y))
}

function readRows(b: Bootstrap, name: string, unmapped: string[], warnings: string[]): Row[] {
  const rows: Row[] = []
  const used = (key: string) => b.products.some(p => p.dimensions?.[key] !== undefined)
  const required = [SIZE, ...[MATERIAL, CONNECTION].filter(used)]
  for (const product of b.products) {
    const d = product.dimensions ?? {}
    const missing = required.filter(k => !d[k])
    if (missing.length > 0) {
      unmapped.push(`${name}: product ${product.part} has no ${missing.join(', ')}`)
      continue
    }
    const price = amountOf(b.displayValues.prices, product.priceKey)
    if (price === undefined) {
      warnings.push(`${name}: no price for ${product.priceKey}`)
      continue
    }
    rows.push({ product, size: d[SIZE], material: d[MATERIAL] ?? '', connection: d[CONNECTION] ?? '', price })
  }
  const extra = new Map<string, Set<string>>()
  for (const p of b.products) {
    for (const [k, v] of Object.entries(p.dimensions ?? {})) {
      if (!KNOWN.has(k)) extra.set(k, (extra.get(k) ?? new Set()).add(v))
    }
  }
  for (const [k, v] of extra) unmapped.push(`${name}: ${k} — ${[...v].join(', ')}`)
  return rows
}

function bodyOf(response: unknown, url: string, what: string): Record<string, unknown> {
  const body = isRecord(response) ? response.body : undefined
  if (!isRecord(body)) throw new MissingDataError(url, what)
  return body
}

function readBandSizes(response: unknown, url: string): string[] {
  const body = bodyOf(response, url, 'band_sizes body')
  if (!Array.isArray(body.options)) throw new MissingDataError(url, 'band_sizes options')
  const options = body.options.filter(isRecord)
  if (options.length === 1 && options[0].key === 'onesize') return []
  return options.map(o => normaliseLabel(String(o.text ?? ''))).filter(t => t.length > 0)
}

function ungroupedName(sectionHeader: unknown): string {
  const lead = typeof sectionHeader === 'string' ? /<span[^>]*>([\s\S]*?)<\/span>/.exec(sectionHeader)?.[1] : undefined
  return (lead && plain(lead).replace(/[.:]+$/, '')) || 'Strap'
}

function bySortOrder(items: Record<string, unknown>): string[] {
  const order = (key: string) => {
    const item = items[key]
    return isRecord(item) && typeof item.sortOrder === 'number' ? item.sortOrder : Infinity
  }
  return Object.keys(items).sort((x, y) => order(x) - order(y) || compareStrings(x, y))
}

function readSelection(response: unknown, url: string): Selection {
  const body = bodyOf(response, url, 'band-selection body')
  if (!isRecord(body.items) || !isRecord(body.itemPrices) || Object.keys(body.items).length === 0) {
    throw new MissingDataError(url, 'band-selection items and itemPrices')
  }
  const grouped = Array.isArray(body.groups) && body.groups.length > 0
  const groups = grouped
    ? (body.groups as unknown[]).filter(isRecord).map(g => {
        const data = isRecord(g.additionalData) ? g.additionalData : {}
        const name = normaliseLabel(String(data.sectionHeader ?? g.id ?? ''))
        return { name, items: Array.isArray(g.items) ? g.items.map(String) : [] }
      })
    : [{ name: ungroupedName(body.sectionHeader), items: bySortOrder(body.items) }]
  const items: Selection['items'] = {}
  for (const [style, raw] of Object.entries(body.items)) {
    if (!isRecord(raw)) continue
    const subs = Array.isArray(raw.subDimensionValue) ? raw.subDimensionValue.filter(isRecord) : []
    items[style] = {
      name: stripHtml(String(raw.sectionHeader ?? ''), [/<div[\s\S]*?<\/div>/g, ...LABEL_NOISE]) || style,
      colours: subs.map(s => normaliseLabel(String(s.text ?? s.dimensionValue ?? ''))).filter(t => t.length > 0),
      colourValues: subs.map(s => s.dimensionValue).filter((v): v is string => typeof v === 'string'),
    }
  }
  const prices: Record<string, number> = {}
  for (const style of Object.keys(body.itemPrices)) {
    const amount = amountOf(body.itemPrices, style)
    if (amount !== undefined) prices[style] = amount
  }
  return { groups, items, prices }
}

function bandBase(html: string, url: string): { bandSelection: string; bandSize: string } {
  const data = extractWindowJson(html, url, 'pageLevelData.bandSelectionBootstrap')
  const urls = isRecord(data) && isRecord(data.selectionUrls) ? data.selectionUrls : {}
  if (typeof urls.bandSelection !== 'string' || typeof urls.bandSize !== 'string') throw new MissingDataError(url, 'bandSelectionBootstrap.selectionUrls')
  return { bandSelection: new URL(urls.bandSelection, url).toString(), bandSize: new URL(urls.bandSize, url).toString() }
}

function caseParams(product: Product): string {
  let out = `&option.watch_cases=${encodeURIComponent(product.part)}`
  for (const [dim, value] of Object.entries(product.dimensions)) out += `&dm.${dim}=${encodeURIComponent(value)}`
  return out
}

function representativeCases(b: Bootstrap, rows: Row[]): Map<string, Row> {
  const out = new Map<string, Row>()
  for (const size of sortByOrder(b, SIZE, rows.map(r => r.size))) {
    const candidates = rows.filter(r => r.size === size)
    out.set(size, candidates.reduce((best, r) => (r.price < best.price || (r.price === best.price && r.product.part < best.product.part) ? r : best)))
  }
  return out
}

function pageName(html: string, url: string): string {
  const name = productName(html)
  if (!name) throw new MissingDataError(url, 'product name')
  return name
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function unionSizes(lists: string[][]): string[] {
  const longest = [...lists].sort((x, y) => y.length - x.length)[0] ?? []
  const out = [...longest]
  for (const list of lists) for (const s of list) if (!out.includes(s)) out.push(s)
  return out
}

type Pricing = { price: number; sizeOptions: Record<string, number>; connectivityOptions: Record<string, number> }

function specPricing(b: Bootstrap, rows: Row[]): Pricing | undefined {
  const base = Math.min(...rows.map(r => r.price))
  const minBy = (key: (r: Row) => string) => {
    const out = new Map<string, number>()
    for (const r of rows) out.set(key(r), Math.min(out.get(key(r)) ?? Infinity, r.price))
    return out
  }
  const bySize = minBy(r => r.size)
  const byConn = minBy(r => r.connection)
  for (const r of rows) {
    if (r.price !== (bySize.get(r.size) as number) + (byConn.get(r.connection) as number) - base) return undefined
  }
  const sizeOptions: Record<string, number> = {}
  for (const s of sortByOrder(b, SIZE, bySize.keys())) sizeOptions[sizeLabel(b, s)] = (bySize.get(s) as number) - base
  const connectivityOptions: Record<string, number> = {}
  for (const c of sortByOrder(b, CONNECTION, byConn.keys())) if (c) connectivityOptions[connectionLabel(b, c)] = (byConn.get(c) as number) - base
  return { price: base, sizeOptions, connectivityOptions }
}

function readStyles(
  b: Bootstrap,
  calls: MaterialBands,
  caseSizes: string[],
  name: string,
  unmapped: string[],
): { styles: StyleReads; groupOrder: string[]; held: string[] } {
  const held: string[] = []
  const styles: StyleReads = new Map()
  const groupOrder: string[] = []
  for (const size of caseSizes) {
    const label = sizeLabel(b, size)
    const call = calls.get(size)
    if (!call) {
      held.push(`no band data for ${label}`)
      continue
    }
    const { selection } = call
    const grouped = new Set(selection.groups.flatMap(g => g.items))
    for (const group of selection.groups) {
      if (!groupOrder.includes(group.name)) groupOrder.push(group.name)
      for (const style of group.items) {
        const item = selection.items[style]
        const total = selection.prices[style]
        if (!item || total === undefined) {
          held.push(`${label}: band style ${style} has no ${item ? 'price' : 'details'}`)
          continue
        }
        const surcharge = parsePounds(total - call.casePrice)
        if (surcharge < 0) {
          held.push(`${label}: ${item.name} costs less than its case`)
          continue
        }
        const sizes = call.sizes[style]
        if (sizes === undefined) held.push(`${label}: no band sizes for ${item.name}`)
        const entry = styles.get(style) ?? { read: [], present: [] }
        entry.read.push({ name: item.name, group: group.name, surcharge, colours: item.colours, sizes: sizes ?? [] })
        entry.present.push(label)
        styles.set(style, entry)
      }
    }
    for (const [style, item] of Object.entries(selection.items)) {
      const text = `${name}: band style ${item.name} is in no group`
      if (!grouped.has(style) && !unmapped.includes(text)) unmapped.push(text)
    }
  }
  return { styles, groupOrder, held }
}

function buildBandGroups(styles: StyleReads, groupOrder: string[], caseCount: number, held: string[]): BandGroup[] {
  const groups = new Map<string, BandStyle[]>()
  for (const { read, present } of styles.values()) {
    const first = read[0]
    if (read.some(r => r.surcharge !== first.surcharge)) {
      held.push(`${first.name} surcharge differs by case size (${read.map(r => formatPounds(r.surcharge)).join(', ')})`)
      continue
    }
    const colours = unique(read.flatMap(r => r.colours))
    const style: BandStyle = { styleName: first.name, price: first.surcharge, bandColor: colours }
    const lists = read.map(r => r.sizes)
    if (lists.every(l => sameList(l, lists[0]))) {
      if (lists[0].length > 0) style.bandSizeOptions = lists[0]
    } else {
      style.bandSizeOptions = unionSizes(lists)
      style.bandSizesByCase = Object.fromEntries(read.map((r, i) => [present[i], r.sizes]))
    }
    if (present.length < caseCount) style.caseSizes = present
    groups.set(first.group, [...(groups.get(first.group) ?? []), style])
  }
  return groupOrder.filter(g => groups.has(g)).map(g => ({ material: g, style: groups.get(g) as BandStyle[] }))
}

function buildWatchModels(b: Bootstrap, name: string, rows: Row[], bands: Map<string, MaterialBands>, url: string, unmapped: string[], warnings: string[]): MapResult {
  const published: PublishedPrice[] = []
  const specs: Spec[] = []
  for (const material of sortByOrder(b, MATERIAL, rows.map(r => r.material))) {
    const specName = specNameOf(b, material, name, url)
    const mine = rows.filter(r => r.material === material)
    for (const r of uniqueBy(mine, r => `${r.size}|${r.connection}`)) {
      const size = sizeLabel(b, r.size)
      const connectivity = r.connection ? connectionLabel(b, r.connection) : undefined
      published.push({
        spec: specName,
        label: `${name} ${specName} ${size}${connectivity ? ` ${connectivity}` : ''} (${r.product.priceKey})`,
        options: connectivity ? { size, connectivity } : { size },
        price: r.price,
      })
    }
    const caseSizes = sortByOrder(b, SIZE, mine.map(r => r.size))
    const { styles, groupOrder, held } = readStyles(b, bands.get(material) ?? new Map(), caseSizes, name, unmapped)
    const bandOptions = buildBandGroups(styles, groupOrder, caseSizes.length, held)
    if (held.length > 0) {
      for (const reason of held) warnings.push(`${name} / ${specName}: ${reason}; spec held back`)
      continue
    }
    const pricing = specPricing(b, mine)
    if (!pricing) {
      warnings.push(`${name} / ${specName}: case prices are not additive over size and connectivity; spec held back`)
      continue
    }
    const colours = sortByOrder(b, COLOR, mine.map(r => r.product.dimensions[COLOR]).filter(Boolean)).map(c => colourLabel(b, c))
    const spec: Spec = {
      name: specName,
      price: pricing.price,
      appleCare: [],
      sizeOptions: pricing.sizeOptions,
    }
    if (Object.keys(pricing.connectivityOptions).length > 0) spec.connectivityOptions = pricing.connectivityOptions
    if (colours.length > 0) spec.colors = colours
    if (bandOptions.length > 0) spec.bandOptions = bandOptions
    specs.push(spec)
  }
  if (specs.length === 0 && published.length === 0) {
    warnings.push(`${name}: nothing could be read; model skipped`)
    return { models: [], unmapped, warnings }
  }
  if (specs.length === 0) warnings.push(`${name}: no spec could be priced; published prices kept so the model is held back`)

  const allColours = sortByOrder(b, COLOR, rows.map(r => r.product.dimensions[COLOR]).filter(Boolean)).map(c => colourLabel(b, c))
  const model: Model = {
    displayName: name,
    colors: allColours,
    specs: specs.sort((x, y) => x.price - y.price || x.name.localeCompare(y.name)),
  }
  const mapped: MappedModel = { category: 'Apple Watch', key: name, model, published }
  return { models: [mapped], unmapped, warnings }
}

async function fetchBandCall(fetcher: Fetcher, urls: { bandSelection: string; bandSize: string }, row: Row): Promise<BandCall> {
  const params = caseParams(row.product)
  const selectionUrl = urls.bandSelection + params
  const selection = readSelection(await fetcher.json(selectionUrl), selectionUrl)
  const sizes: Record<string, string[]> = {}
  for (const [style, item] of Object.entries(selection.items)) {
    const colour = item.colourValues[0]
    if (colour === undefined) continue
    const sizeUrl = `${urls.bandSize}${params}&dm.watch_bands-dimensionBandStyle=${encodeURIComponent(style)}&dm.watch_bands-dimensionColor=${encodeURIComponent(colour)}`
    sizes[style] = readBandSizes(await fetcher.json(sizeUrl), sizeUrl)
  }
  return { casePrice: row.price, selection, sizes }
}

export async function mapWatch(page: Page, fetcher: Fetcher): Promise<MapResult> {
  if (/\/buy-watch\/apple-watch-hermes/.test(page.url)) {
    return { models: [], unmapped: [], warnings: [`${page.url}: Apple Watch Hermès is not mapped (its product name and case dimensions do not identify it apart from the standard models); skipped`] }
  }
  const b = readBootstrap(extractKeyedJson(page.html, page.url, 'productSelectionData'), page.url)
  const name = pageName(page.html, page.url)
  const unmapped: string[] = []
  const warnings: string[] = []
  const rows = readRows(b, name, unmapped, warnings)
  const bands = new Map<string, MaterialBands>()
  let urls: { bandSelection: string; bandSize: string }
  try {
    urls = bandBase(page.html, page.url)
  } catch (err) {
    if (!(err instanceof MissingDataError)) throw err
    const result = buildWatchModels(b, name, rows, bands, page.url, unmapped, warnings)
    return { ...result, warnings: [...result.warnings, `${name}: ${err.message}`] }
  }

  for (const material of sortByOrder(b, MATERIAL, rows.map(r => r.material))) {
    const calls: MaterialBands = new Map()
    for (const [size, row] of representativeCases(b, rows.filter(r => r.material === material))) {
      calls.set(size, await fetchBandCall(fetcher, urls, row))
    }
    bands.set(material, calls)
  }
  return buildWatchModels(b, name, rows, bands, page.url, unmapped, warnings)
}
