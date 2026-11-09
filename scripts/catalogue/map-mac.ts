import type { Model, Spec } from '@/lib/catalogue/schema'
import type { SelectedOptions } from '@/lib/catalogue/helpers'
import { extractKeyedJson, MissingDataError, normaliseLabel, parsePounds } from './extract'
import type { Fetcher } from './http'
import type { MappedModel, MapResult, Page, PublishedPrice } from './types'

export type MacDeltas = Record<string, Record<string, Record<string, number>>>

export type MacDeltaRequest = { key: string; dimension: string; url: string }

type OptionDeltas = Record<string, Record<string, number>>

type Product = {
  type: string
  btrOrFdPartNumber: string | null
  productConfiguration: Record<string, string>
  priceKey: string
  dimensions: Record<string, string>
}

type DisplayGroup = Record<string, unknown> & { variantOrder?: string[] }

type Bootstrap = {
  mainSections: { formFieldName?: string; header?: string | null }[]
  products: Product[]
  mainDisplayValues: Record<string, DisplayGroup> & { prices: Record<string, { amount?: unknown }> }
  configDisplayValues: Record<string, DisplayGroup>
}

type StandardConfig = {
  key: string
  size?: string
  chip: string
  extras: string[]
  rep: Product
  products: Product[]
}

const SIZE = 'chassis-dimensionScreensize'
const COLOR = 'chassis-dimensionColor'
const FINISH = 'display-dimensionFinish'
const CHIP = 'processor-dimensionChip'
const KEYBOARD = 'keyboard-localizationCode'
const MEMORY = 'memory-dimensionMemory'
const STORAGE = 'storage-dimensionCapacity'

const LINE_WORDS: Record<string, string> = { macbook: 'MacBook', imac: 'iMac', mac: 'Mac', mini: 'mini', xdr: 'XDR' }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function plainText(html: string): string {
  return normaliseLabel(
    html
      .replace(/<div[\s\S]*?<\/div>/g, ' ')
      .replace(/<as-footnote[\s\S]*?<\/as-footnote>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&'),
  )
}

function header(group: DisplayGroup | undefined, value: string): string | undefined {
  const entry = group?.[value]
  if (isRecord(entry) && typeof entry.header === 'string') return plainText(entry.header)
  return undefined
}

function readBootstrap(bootstrap: unknown, url: string): Bootstrap {
  if (!isRecord(bootstrap) || !Array.isArray(bootstrap.products) || bootstrap.products.length === 0) {
    throw new MissingDataError(url, 'productSelectionData.products')
  }
  const mdv = bootstrap.mainDisplayValues
  if (!isRecord(mdv) || !isRecord(mdv.prices)) throw new MissingDataError(url, 'productSelectionData.mainDisplayValues.prices')
  return {
    mainSections: Array.isArray(bootstrap.mainSections) ? (bootstrap.mainSections as Bootstrap['mainSections']) : [],
    products: bootstrap.products as Product[],
    mainDisplayValues: mdv as Bootstrap['mainDisplayValues'],
    configDisplayValues: isRecord(bootstrap.configDisplayValues) ? (bootstrap.configDisplayValues as Bootstrap['configDisplayValues']) : {},
  }
}

function chipKeyOf(b: Bootstrap, url: string): string {
  const key = Object.keys(b.products[0].dimensions ?? {}).find(k => /^processor-.*cpuCoreCount-gpuCoreCount$/.test(k))
  if (!key) throw new MissingDataError(url, 'chip dimension')
  return key
}

function standardFinish(b: Bootstrap): string | undefined {
  return b.mainDisplayValues[FINISH]?.variantOrder?.[0]
}

function rankIn(order: string[] | undefined, value: string | undefined): number {
  const i = value === undefined ? -1 : (order ?? []).indexOf(value)
  return i < 0 ? Infinity : i
}

function byRank(x: number, y: number): number {
  return x === y ? 0 : x < y ? -1 : 1
}

function sortedProducts(b: Bootstrap, chipKey: string): Product[] {
  const orderOf = (group: string) => b.mainDisplayValues[group]?.variantOrder
  return [...b.products].sort(
    (x, y) =>
      byRank(rankIn(orderOf(SIZE), x.dimensions[SIZE]), rankIn(orderOf(SIZE), y.dimensions[SIZE])) ||
      byRank(rankIn(orderOf(chipKey), x.dimensions[chipKey]), rankIn(orderOf(chipKey), y.dimensions[chipKey])) ||
      byRank(rankIn(orderOf(COLOR), x.dimensions[COLOR]), rankIn(orderOf(COLOR), y.dimensions[COLOR])) ||
      (x.priceKey < y.priceKey ? -1 : x.priceKey > y.priceKey ? 1 : 0),
  )
}

function standardConfigs(b: Bootstrap, chipKey: string): StandardConfig[] {
  const finish = standardFinish(b)
  const groups = new Map<string, Product[]>()
  for (const p of sortedProducts(b, chipKey)) {
    const id = `${p.dimensions[SIZE] ?? ''}|${p.dimensions[chipKey]}`
    groups.set(id, [...(groups.get(id) ?? []), p])
  }
  const out: StandardConfig[] = []
  for (const products of groups.values()) {
    const partitions = new Map<string, Product[]>()
    for (const p of products) {
      const sig = Object.keys(p.productConfiguration ?? {}).sort().join(',')
      partitions.set(sig, [...(partitions.get(sig) ?? []), p])
    }
    const signatures = [...partitions.keys()].map(s => new Set(s.split(',')))
    const common = signatures.reduce((acc, s) => new Set([...acc].filter(k => s.has(k))))
    for (const [sig, members] of partitions) {
      const standard = members.filter(p => !finish || p.dimensions[FINISH] === undefined || p.dimensions[FINISH] === finish)
      const rep = standard.find(p => p.type === 'CONFIGURABLE') ?? standard[0]
      if (!rep) continue
      out.push({
        key: rep.priceKey,
        size: rep.dimensions[SIZE],
        chip: rep.dimensions[chipKey],
        extras: partitions.size > 1 ? sig.split(',').filter(k => k && !common.has(k)) : [],
        rep,
        products: members,
      })
    }
  }
  return out
}

function updateConfigBase(pageLevelData: unknown): string {
  if (isRecord(pageLevelData)) {
    if (typeof pageLevelData.updateConfigUrl === 'string') return pageLevelData.updateConfigUrl
    const nested = pageLevelData.productSelectionUrl
    if (isRecord(nested) && typeof nested.updateConfigUrl === 'string') return nested.updateConfigUrl
  }
  throw new MissingDataError('pageLevelData', 'updateConfigUrl')
}

const param = (prefix: 'sv' | 'uv', key: string, value: string) => `&${prefix}.${key}=${encodeURIComponent(value)}`

function chipRequest(base: string, key: string, product: Product, chipKey: string): MacDeltaRequest {
  let url = base
  for (const [dim, value] of Object.entries(product.dimensions)) if (dim !== chipKey) url += param('sv', dim, value)
  if ('keyboard' in (product.productConfiguration ?? {})) url += param('sv', KEYBOARD, 'gbr')
  url += param('uv', chipKey, product.dimensions[chipKey])
  return { key, dimension: chipKey, url }
}

export function macDeltaRequests(bootstrap: unknown, pageLevelData: unknown): MacDeltaRequest[] {
  const base = updateConfigBase(pageLevelData)
  const b = readBootstrap(bootstrap, base)
  const chipKey = chipKeyOf(b, base)
  return standardConfigs(b, chipKey).map(cfg => chipRequest(base, cfg.key, cfg.rep, chipKey))
}

export function readUpdateConfig(response: unknown, url: string): OptionDeltas {
  const body = isRecord(response) ? response.body : undefined
  const options = isRecord(body) ? body.options : undefined
  if (!isRecord(body) || !isRecord(options) || Object.keys(options).length === 0) throw new MissingDataError(url, 'update-config body')
  const prices = isRecord(body.prices) ? body.prices : {}
  const out: OptionDeltas = {}
  for (const [group, data] of Object.entries(options)) {
    const compatible = isRecord(data) ? data.compatibleOptions : undefined
    if (!isRecord(compatible)) continue
    const values: Record<string, number> = {}
    for (const [value, option] of Object.entries(compatible)) {
      if (!isRecord(option) || typeof option.priceDelta !== 'string') continue
      const price = prices[option.priceDelta]
      if (!isRecord(price) || price.amount === undefined) throw new MissingDataError(url, `update-config price ${option.priceDelta}`)
      values[value] = parsePounds(price.amount as number | string)
    }
    if (Object.keys(values).length > 0) out[group] = values
  }
  return out
}

export function macFollowUpRequest(request: MacDeltaRequest, groups: OptionDeltas): MacDeltaRequest | undefined {
  for (const group of [MEMORY, STORAGE]) {
    const next = Object.entries(groups[group] ?? {})
      .filter(([, d]) => d > 0)
      .sort((a, b) => a[1] - b[1])[0]
    if (!next) continue
    const uv = `&uv.${request.dimension}=`
    const url = request.url.replace(uv, `&sv.${request.dimension}=`) + param('uv', group, next[0])
    return { key: request.key, dimension: group, url }
  }
  return undefined
}

function mergeFollowUp(target: OptionDeltas, extra: OptionDeltas, changed: string, dimensions: Set<string>): boolean {
  let additive = true
  for (const [group, values] of Object.entries(extra)) {
    if (dimensions.has(group) && group !== FINISH) continue
    const into = (target[group] ??= {})
    let shift = 0
    if (group === changed) {
      const base = Object.keys(into).find(v => into[v] === 0 && v in values)
      if (base === undefined) continue
      shift = values[base]
    }
    for (const [value, raw] of Object.entries(values)) {
      const delta = parsePounds(raw - shift)
      if (!(value in into)) into[value] = delta
      else if (into[value] !== delta) additive = false
    }
  }
  return additive
}

export function readSelected(response: unknown): Record<string, string[]> {
  const body = isRecord(response) ? response.body : undefined
  const options = isRecord(body) && isRecord(body.options) ? body.options : {}
  const out: Record<string, string[]> = {}
  for (const [group, data] of Object.entries(options)) {
    const compatible = isRecord(data) && isRecord(data.compatibleOptions) ? data.compatibleOptions : {}
    const selected = Object.entries(compatible)
      .filter(([, o]) => isRecord(o) && o.isSelected === true)
      .map(([v]) => v)
    if (selected.length > 0) out[group] = selected
  }
  return out
}

export function macOptionLabel(group: string, value: string, raw?: string): string {
  const sources = raw ? [raw, value] : [value]
  if (group.startsWith('memory-')) {
    for (const s of sources) {
      const m = s.match(/(\d+)\s*GB/i)
      if (m) return `${m[1]}GB`
    }
  }
  if (group.startsWith('storage-')) {
    for (const s of sources) {
      const m = s.match(/(\d+)\s*(GB|TB)/i)
      if (m) return `${m[1]}${m[2].toUpperCase()}`
    }
  }
  if (group.startsWith('power_adapter-')) {
    for (const s of sources) {
      if (/no power adapter/i.test(s) || /^0\s*w$/i.test(s)) return 'No Power Adapter'
      const m = s.match(/(\d+)\s*W\b/i)
      if (m) return Number(m[1]) === 0 ? 'No Power Adapter' : `${m[1]}W`
    }
  }
  return normaliseLabel(raw ?? value)
}

function productLine(url: string): string {
  const slug = url.match(/\/buy-mac\/([^/?#]+)/)?.[1] ?? 'mac'
  return slug
    .split('-')
    .map(w => LINE_WORDS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function sizeLabel(b: Bootstrap, size: string | undefined): string | undefined {
  if (!size) return undefined
  const m = size.match(/^(\d+(?:\.\d+)?)inch$/)
  if (m) return `${m[1]}"`
  return header(b.mainDisplayValues[SIZE], size) ?? size
}

function chipFamily(b: Bootstrap, product: Product, chipKey: string): string | undefined {
  const chip = product.dimensions[CHIP]
  const candidates = [
    chip ? header(b.mainDisplayValues[CHIP], chip) : undefined,
    header(b.mainDisplayValues[chipKey], product.dimensions[chipKey]),
    b.mainSections.find(s => s.formFieldName === chipKey)?.header ?? undefined,
  ]
  for (const c of candidates) {
    const m = c && plainText(c).match(/^(.+?)\s+chip\b/i)
    if (m) return m[1]
  }
  return undefined
}

function chipName(b: Bootstrap, product: Product, chipKey: string, warnings: string[], label: string): string {
  const value = product.dimensions[chipKey]
  const entry = b.mainDisplayValues[chipKey]?.[value]
  const comps = isRecord(entry) && isRecord(entry.dimensionComponents) ? entry.dimensionComponents : {}
  const tail = value.match(/(\d+)-(\d+)$/)
  const cpu = typeof comps.cpuCoreCount === 'string' ? comps.cpuCoreCount : tail?.[1]
  const gpu = typeof comps.gpuCoreCount === 'string' ? comps.gpuCoreCount : tail?.[2]
  const family = chipFamily(b, product, chipKey)
  if (!family) warnings.push(`${label}: no chip name found for ${value}`)
  const cores = cpu && gpu ? `${cpu}-Core CPU ${gpu}-Core GPU` : value
  return family ? `${family} ${cores}` : cores
}

function ordered(b: Bootstrap, group: string, values: Record<string, number>): [string, number][] {
  const order = b.configDisplayValues[group]?.variantOrder ?? b.mainDisplayValues[group]?.variantOrder ?? []
  const rank = (v: string) => (order.includes(v) ? order.indexOf(v) : order.length)
  return Object.entries(values).sort((x, y) => x[1] - y[1] || rank(x[0]) - rank(y[0]))
}

function baseValue(b: Bootstrap, group: string, values: Record<string, number>): string | undefined {
  return ordered(b, group, values).find(([, d]) => d === 0)?.[0]
}

function displayLabel(b: Bootstrap, group: string, value: string): string {
  return macOptionLabel(group, value, header(b.configDisplayValues[group], value) ?? header(b.mainDisplayValues[group], value))
}

function optionMap(b: Bootstrap, group: string, values: Record<string, number>, warnings: string[], label: string) {
  const options: Record<string, number> = {}
  for (const [value, delta] of ordered(b, group, values)) {
    const name = displayLabel(b, group, value)
    if (name in options) warnings.push(`${label}: ${group} has two options labelled ${name}`)
    else options[name] = delta
  }
  const base = baseValue(b, group, values)
  return { options, base: base === undefined ? undefined : displayLabel(b, group, base) }
}

function findGroup(groups: OptionDeltas, prefix: string): string | undefined {
  return Object.keys(groups).find(g => g.startsWith(prefix))
}

function colourLabels(b: Bootstrap, products: Product[]): string[] {
  const values = new Set(products.map(p => p.dimensions[COLOR]).filter((c): c is string => !!c))
  const order = b.mainDisplayValues[COLOR]?.variantOrder ?? []
  return [...values]
    .sort((x, y) => (order.indexOf(x) + 1 || Infinity) - (order.indexOf(y) + 1 || Infinity))
    .map(c => header(b.mainDisplayValues[COLOR], c) ?? c)
}

function extraLabel(b: Bootstrap, extra: string, groups: OptionDeltas | undefined): string | undefined {
  const group = Object.keys(b.configDisplayValues).find(g => g.startsWith(`${extra}-`))
  if (!group || !groups?.[group]) return undefined
  const base = baseValue(b, group, groups[group])
  return base === undefined ? undefined : header(b.configDisplayValues[group], base)
}

const money = (n: number) => (n < 0 ? `-£${-n}` : `+£${n}`)

function amountOf(b: Bootstrap, product: Product): number | undefined {
  const amount = b.mainDisplayValues.prices[product.priceKey]?.amount
  return typeof amount === 'number' || typeof amount === 'string' ? parsePounds(amount) : undefined
}

function representativePart(b: Bootstrap, cfg: StandardConfig): string | undefined {
  const candidates = cfg.products
    .filter(p => p.btrOrFdPartNumber && p.dimensions[FINISH] === cfg.rep.dimensions[FINISH])
    .map(p => ({ part: p.btrOrFdPartNumber as string, price: amountOf(b, p) ?? Infinity }))
    .sort((x, y) => byRank(x.price, y.price) || (x.part < y.part ? -1 : x.part > y.part ? 1 : 0))
  return candidates[0]?.part
}

export function buildMacModels(bootstrap: unknown, deltas: MacDeltas, url: string, held: Record<string, string> = {}): MapResult {
  const b = readBootstrap(bootstrap, url)
  const chipKey = chipKeyOf(b, url)
  const line = productLine(url)
  const finish = standardFinish(b)
  const dimensions = new Set(b.products.flatMap(p => Object.keys(p.dimensions)))
  const unmapped: string[] = []
  const warnings: string[] = []
  const models = new Map<string, { specs: Spec[]; products: Product[]; published: PublishedPrice[]; priced: Set<string> }>()

  for (const cfg of standardConfigs(b, chipKey)) {
    const size = sizeLabel(b, cfg.size)
    const modelKey = size ? `${line} ${size}` : line
    const entry = models.get(modelKey) ?? { specs: [], products: [], published: [], priced: new Set<string>() }
    models.set(modelKey, entry)
    entry.products.push(...cfg.products)

    const label = `${modelKey} ${cfg.key}`
    const groups = deltas[cfg.key]
    let name = chipName(b, cfg.rep, chipKey, warnings, label)
    const includes: string[] = []
    for (const extra of cfg.extras) {
      const text = extraLabel(b, extra, groups)
      if (!text) warnings.push(`${label}: no label for the ${extra} this standard configuration includes`)
      includes.push(text ?? extra.replace(/_/g, ' '))
    }
    if (includes.length > 0) name = `${name} with ${includes.join(' and ')}`

    const memoryGroup = groups && findGroup(groups, 'memory-')
    const storageGroup = groups && findGroup(groups, 'storage-')
    const powerGroup = groups && findGroup(groups, 'power_adapter-')
    const memory = groups && memoryGroup ? optionMap(b, memoryGroup, groups[memoryGroup], warnings, label) : undefined
    const storage = groups && storageGroup ? optionMap(b, storageGroup, groups[storageGroup], warnings, label) : undefined
    const charger = groups && powerGroup ? optionMap(b, powerGroup, groups[powerGroup], warnings, label) : undefined

    let nanoTexture: number | undefined
    const finishValues = groups?.[FINISH]
    if (finishValues) {
      const upgrades = Object.entries(finishValues).filter(([, d]) => d !== 0)
      if (upgrades.length === 1 && upgrades[0][1] > 0 && Object.keys(finishValues).length === 2) nanoTexture = upgrades[0][1]
      else warnings.push(`${label}: cannot read a single display-finish upgrade from ${JSON.stringify(finishValues)}`)
    }

    const price = amountOf(b, cfg.rep)
    const publishedOptions = (p: Product): SelectedOptions => {
      const options: SelectedOptions = {}
      if (memory?.base) options.memory = memory.base
      if (storage?.base) options.storage = storage.base
      if (charger?.base) options.charger = charger.base
      if (finish && p.dimensions[FINISH] !== undefined && p.dimensions[FINISH] !== finish) options.nanoTexture = true
      return options
    }
    for (const p of cfg.products) {
      const amount = amountOf(b, p)
      if (amount === undefined) {
        warnings.push(`${label}: no price for standard configuration ${p.priceKey}`)
        continue
      }
      const colour = p.dimensions[COLOR] ? ` ${header(b.mainDisplayValues[COLOR], p.dimensions[COLOR]) ?? p.dimensions[COLOR]}` : ''
      const options = publishedOptions(p)
      entry.published.push({
        spec: name,
        label: `${modelKey} ${name}${colour}${options.nanoTexture ? ' nano-texture' : ''} (${p.priceKey})`,
        options,
        price: amount,
      })
    }

    if (!groups) {
      warnings.push(`${label}: no upgrade prices for ${name}; spec skipped`)
      continue
    }
    for (const group of Object.keys(groups)) entry.priced.add(group)
    if (held[cfg.key]) {
      warnings.push(`${modelKey} / ${name}: ${held[cfg.key]} — spec held back`)
      continue
    }
    if (price === undefined) {
      warnings.push(`${label}: no base price for ${name}; spec skipped`)
      continue
    }
    if ((memory && !memory.base) || (storage && !storage.base) || (charger && !charger.base)) {
      warnings.push(`${label}: an option group has no zero-priced standard choice; spec skipped`)
      continue
    }
    if (finish && cfg.products.some(p => p.dimensions[FINISH] !== undefined && p.dimensions[FINISH] !== finish) && nanoTexture === undefined) {
      warnings.push(`${label}: nano-texture configurations exist but no display-finish price was found`)
    }

    for (const [group, values] of Object.entries(groups)) {
      if (dimensions.has(group) && group !== FINISH) continue
      if (group === memoryGroup || group === storageGroup || group === powerGroup || group === FINISH) continue
      for (const [value, delta] of ordered(b, group, values)) {
        if (delta === 0) continue
        const text = `${modelKey}: ${group} — ${value} (${money(delta)})`
        if (!unmapped.includes(text)) unmapped.push(text)
      }
    }

    const spec: Spec = { name, price, appleCare: [] }
    const partNumber = representativePart(b, cfg)
    if (partNumber) spec.partNumber = partNumber
    if (includes.length > 0) spec.includes = includes
    const colors = colourLabels(b, cfg.products)
    if (colors.length > 0) spec.colors = colors
    const constraints: NonNullable<Spec['constraints']> = {}
    if (memory?.base) constraints.minMemory = memory.base
    if (storage?.base) constraints.minStorage = storage.base
    if (Object.keys(constraints).length > 0) spec.constraints = constraints
    if (memory) spec.memoryOptions = memory.options
    if (storage) spec.storageOptions = storage.options
    if (charger) spec.chargerOptions = charger.options
    if (nanoTexture !== undefined) spec.nanoTexture = nanoTexture
    entry.specs.push(spec)
  }

  const out: MappedModel[] = []
  for (const [key, entry] of models) {
    if (entry.specs.length === 0 && entry.published.length === 0) {
      warnings.push(`${key}: nothing could be read; model skipped`)
      continue
    }
    if (entry.specs.length === 0) warnings.push(`${key}: no spec could be priced; published prices kept so the model is held back`)
    if (entry.priced.size > 0) {
      for (const [group, display] of Object.entries(b.configDisplayValues)) {
        if (dimensions.has(group) || entry.priced.has(group)) continue
        const values = Array.isArray(display?.variantOrder) ? display.variantOrder : []
        if (values.length > 0) unmapped.push(`${key}: ${group} — ${values.join(', ')} (no price)`)
      }
    }
    const model: Model = {
      displayName: key,
      colors: colourLabels(b, entry.products),
      specs: [...entry.specs].sort((x, y) => x.price - y.price || x.name.localeCompare(y.name)),
    }
    out.push({ category: 'MacBook', key, model, published: entry.published })
  }
  return { models: out, unmapped, warnings }
}

export function extractUpdateConfigUrl(html: string, url: string): string {
  const m = html.match(/updateConfigUrl\s*:\s*['"]([^'"]+)['"]/)
  if (!m) throw new MissingDataError(url, 'updateConfigUrl')
  return new URL(m[1], url).toString()
}

function chargersHidden(rep: Product | undefined, groups: OptionDeltas): boolean {
  if (!rep || rep.type === 'CONFIGURABLE') return false
  const power = findGroup(groups, 'power_adapter-')
  return power !== undefined && Object.keys(groups[power]).length === 1
}

async function fetchUpdate(fetcher: Fetcher, request: MacDeltaRequest): Promise<{ deltas: OptionDeltas; selected: Record<string, string[]> }> {
  const response = await fetcher.json(request.url)
  return { deltas: readUpdateConfig(response, request.url), selected: readSelected(response) }
}

function chipMismatch(rep: Product | undefined, chipKey: string, selected: Record<string, string[]>): string | undefined {
  if (!rep) return undefined
  for (const group of [chipKey, CHIP]) {
    const expected = rep.dimensions[group]
    const got = selected[group]
    if (expected && got && !got.includes(expected)) return `update-config selected chip ${got.join(', ')} instead of ${expected}`
  }
  return undefined
}

const hasUpgrade = (groups: OptionDeltas, group: string) => Object.values(groups[group] ?? {}).some(d => d > 0)

async function followUp(
  fetcher: Fetcher,
  cfg: StandardConfig,
  groups: OptionDeltas,
  base: string,
  chipKey: string,
  dimensions: Set<string>,
): Promise<string | undefined> {
  const hidden = chargersHidden(cfg.rep, groups)
  const products = hidden ? cfg.products.filter(p => p.dimensions[FINISH] === cfg.rep.dimensions[FINISH]) : [cfg.rep]
  let reason: string | undefined
  for (const product of products) {
    const request = macFollowUpRequest(chipRequest(base, cfg.key, product, chipKey), groups)
    if (!request) return undefined
    const second = await fetchUpdate(fetcher, request)
    reason = chipMismatch(cfg.rep, chipKey, second.selected)
    if (reason) continue
    if (hidden && chargersHidden(cfg.rep, second.deltas)) {
      reason = 'charger options still hidden after leaving the preconfigured configuration'
      continue
    }
    return mergeFollowUp(groups, second.deltas, request.dimension, dimensions) ? undefined : 'non-additive memory×storage pricing'
  }
  return reason
}

export async function mapMac(page: Page, fetcher: Fetcher): Promise<MapResult> {
  const bootstrap = extractKeyedJson(page.html, page.url, 'productSelectionData')
  const updateConfigUrl = extractUpdateConfigUrl(page.html, page.url)
  const b = readBootstrap(bootstrap, page.url)
  const chipKey = chipKeyOf(b, page.url)
  const dimensions = new Set(b.products.flatMap(p => Object.keys(p.dimensions)))
  const deltas: MacDeltas = {}
  const held: Record<string, string> = {}

  for (const cfg of standardConfigs(b, chipKey)) {
    const request = chipRequest(updateConfigUrl, cfg.key, cfg.rep, chipKey)
    const first = await fetchUpdate(fetcher, request)
    const groups = first.deltas
    deltas[cfg.key] = groups
    let reason = chipMismatch(cfg.rep, chipKey, first.selected)
    const crossCheck = hasUpgrade(groups, MEMORY) && hasUpgrade(groups, STORAGE)
    if (!reason && (crossCheck || chargersHidden(cfg.rep, groups))) {
      reason = await followUp(fetcher, cfg, groups, updateConfigUrl, chipKey, dimensions)
    }
    if (reason) held[cfg.key] = reason
  }

  return buildMacModels(bootstrap, deltas, page.url, held)
}
