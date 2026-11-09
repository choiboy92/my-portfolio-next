import type { Category, Model, Pencil, Spec } from '@/lib/catalogue/schema'
import { skuKey, type SelectedOptions } from '@/lib/catalogue/helpers'
import { extractAnalyticsProducts, normaliseLabel } from './extract'
import type { MappedModel, MapResult, Page, PublishedPrice } from './types'

export type IPadAccessories = {
  pencils: Record<string, Pencil[]>
  magicKeyboard: Record<string, number>
  warnings: string[]
}

type Sku = {
  name: string
  part: string
  price: number
  spec: string
  family: string
  storage: string
  connectivity?: string
  nano: boolean
  color: string
  size?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

function storageGb(storage: string): number {
  const m = storage.match(/^(\d+)(GB|TB)$/)
  if (!m) return 0
  return Number(m[1]) * (m[2] === 'TB' ? 1024 : 1)
}

function byStorage(a: string, b: string): number {
  return storageGb(a) - storageGb(b)
}

function parseIPhoneSku(name: string, part: string, price: number): Sku | null {
  const m = name.match(/^(iPhone .+?) (\d+(?:GB|TB)) (.+)$/)
  if (!m) return null
  return { name, part, price, spec: m[1], family: m[1], storage: m[2], nano: false, color: m[3] }
}

function parseIPadSku(name: string, part: string, price: number): Sku | null {
  const m = name.match(/^(.+?) (Wi-Fi(?: \+ Cellular)?) (\d+(?:GB|TB))(?: with (standard|nano-texture) glass)? - (.+)$/)
  if (!m) return null
  const [, head, connectivity, storage, glass, color] = m
  const size = head.match(/(\d+)-inch/)?.[1]
  const family = head
    .replace(/\(.*?\)/g, ' ')
    .replace(/\d+-inch/, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!/^iPad\b/.test(family)) return null
  return {
    name,
    part,
    price,
    spec: size ? `${size}-inch ${family}` : family,
    family,
    storage,
    connectivity,
    nano: glass === 'nano-texture',
    color,
    size,
  }
}

function buildSpec(skus: Sku[], warnings: string[]): { spec: Spec; size?: string } {
  const sorted = [...skus].sort((a, b) => a.price - b.price || byStorage(a.storage, b.storage))
  const base = sorted[0]
  const standard = skus.filter(s => !s.nano)
  const minStorage = [...skus].map(s => s.storage).sort(byStorage)[0]

  const cheapest = (list: Sku[]) => list.reduce<Sku | undefined>((best, s) => (!best || s.price < best.price ? s : best), undefined)

  const storages = [...new Set(skus.map(s => s.storage))].sort(byStorage)
  const storageOptions: Record<string, number> = {}
  for (const s of storages) {
    const hit = cheapest(standard.filter(k => k.storage === s && k.connectivity === base.connectivity))
    if (hit) storageOptions[s] = round2(hit.price - base.price)
  }

  let connectivityOptions: Record<string, number> | undefined
  if (base.connectivity) {
    connectivityOptions = {}
    const conns = [...new Set(skus.map(s => s.connectivity as string))].sort((a, b) => (a === base.connectivity ? -1 : b === base.connectivity ? 1 : a.length - b.length))
    for (const c of conns) {
      const hit = standard.filter(k => k.connectivity === c).sort((a, b) => byStorage(a.storage, b.storage))[0]
      if (hit) connectivityOptions[c] = round2(hit.price - base.price - (storageOptions[hit.storage] ?? 0))
    }
  }

  const nanoSkus = skus.filter(s => s.nano).sort((a, b) => byStorage(a.storage, b.storage))
  let nanoTexture: number | undefined
  let minNano: string | undefined
  if (nanoSkus.length > 0) {
    minNano = nanoSkus[0].storage
    for (const n of nanoSkus) {
      const twin = standard.find(k => k.storage === n.storage && k.connectivity === n.connectivity)
      if (twin) {
        nanoTexture = round2(n.price - twin.price)
        break
      }
    }
  }

  for (const s of skus) {
    const expected = round2(base.price + (storageOptions[s.storage] ?? NaN) + (s.connectivity ? (connectivityOptions?.[s.connectivity] ?? NaN) : 0) + (s.nano ? (nanoTexture ?? NaN) : 0))
    if (expected !== s.price) warnings.push(`Non-additive price for ${s.name}: model gives ${expected}, Apple lists ${s.price}`)
  }

  const constraints: NonNullable<Spec['constraints']> = { minStorage }
  if (minNano) constraints.minStorageForNanotexture = minNano

  const partNumbers: Record<string, string> = {}
  for (const s of [...skus].sort((a, b) => (a.part < b.part ? -1 : a.part > b.part ? 1 : 0))) {
    const key = skuKey({ color: s.color, storage: s.storage, connectivity: s.connectivity, nanoTexture: s.nano })
    if (Object.hasOwn(partNumbers, key)) warnings.push(`${base.spec}: Apple lists more than one part number for ${key}; kept ${partNumbers[key]}`)
    else partNumbers[key] = s.part
  }

  const spec: Spec = {
    name: base.spec,
    price: base.price,
    partNumber: base.part,
    partNumbers,
    colors: [...new Set(skus.map(s => s.color))].sort(),
    constraints,
    storageOptions,
    appleCare: [],
  }
  if (connectivityOptions) spec.connectivityOptions = connectivityOptions
  if (nanoTexture !== undefined) spec.nanoTexture = nanoTexture
  return { spec, size: base.size }
}

function published(sku: Sku): PublishedPrice {
  const options: SelectedOptions = { storage: sku.storage }
  if (sku.connectivity) options.connectivity = sku.connectivity
  if (sku.nano) options.nanoTexture = true
  return { spec: sku.spec, label: sku.name, options, price: sku.price }
}

function readSkus(page: Page, parse: (name: string, part: string, price: number) => Sku | null, unmapped: string[]): Sku[] {
  const out: Sku[] = []
  for (const p of extractAnalyticsProducts(page.html, page.url)) {
    const name = normaliseLabel(p.name)
    const sku = parse(name, p.partNumber, p.price)
    if (sku) out.push(sku)
    else unmapped.push(name)
  }
  return out.sort((a, b) => (a.part < b.part ? -1 : a.part > b.part ? 1 : 0))
}

function groupBySpec(skus: Sku[]): Sku[][] {
  const groups = new Map<string, Sku[]>()
  for (const s of skus) groups.set(s.spec, [...(groups.get(s.spec) ?? []), s])
  return [...groups.values()]
}

function iPhoneFamilyName(specNames: string[]): string {
  const [first, ...rest] = [...specNames].sort((a, b) => a.length - b.length)
  if (rest.length === 0) return first
  const prefix = first.split(' ').slice(0, -1).join(' ')
  const tails = rest.map(n => (n.startsWith(`${prefix} `) ? n.slice(prefix.length + 1) : n))
  return [first, ...tails].join(' & ')
}

export function mapIPhone(pages: Page[]): MapResult {
  const models: MappedModel[] = []
  const unmapped: string[] = []
  const warnings: string[] = []
  for (const page of pages) {
    const skus = readSkus(page, parseIPhoneSku, unmapped)
    if (skus.length === 0) {
      warnings.push(`No iPhone SKUs mapped from ${page.url}`)
      continue
    }
    const specs = groupBySpec(skus)
      .map(group => buildSpec(group, warnings).spec)
      .sort((a, b) => a.price - b.price)
    const displayName = iPhoneFamilyName(specs.map(s => s.name))
    const model: Model = {
      displayName,
      colors: [...new Set(skus.map(s => s.color))].sort(),
      specs,
    }
    models.push({ category: 'iPhone', key: displayName, model, published: skus.map(published) })
  }
  return { models, unmapped, warnings }
}

function slugToModelKey(slug: string): string {
  return slug
    .split('-')
    .map(w => (w === 'ipad' ? 'iPad' : w === 'mini' ? 'mini' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

function pageSlug(page: Page): string | undefined {
  const re = /\/buy-ipad\/([^/?#"]+)/
  return page.url.match(re)?.[1] ?? page.html.match(/rel="canonical"[^>]*href="[^"]*\/buy-ipad\/([^/?#"]+)/)?.[1]
}

type AccessoryItem = { name: string; price: number; language?: string }

function accessoryItems(block: string, label: string, warnings: string[]): AccessoryItem[] {
  const out: AccessoryItem[] = []
  const starts = [...block.matchAll(/"value":\{"name":"([^"]*)"/g)]
  starts.forEach((m, i) => {
    const chunk = block.slice(m.index, starts[i + 1]?.index ?? block.length)
    const amount = chunk.match(/"raw_amount":"([\d.]+)"/)?.[1]
    if (amount === undefined) {
      warnings.push(`${label}: accessory "${normaliseLabel(m[1].replace(/&nbsp;/g, ' '))}" has no price and was skipped`)
      return
    }
    out.push({
      name: normaliseLabel(m[1].replace(/&nbsp;/g, ' ')),
      price: Number(amount),
      language: chunk.match(/"dimensionLanguage":\{[^}]*"key":"([^"]*)"/)?.[1],
    })
  })
  return out
}

function accessoryBlocks(html: string): { key: string; block: string }[] {
  const out: { key: string; block: string }[] = []
  for (const m of html.matchAll(/window\.pageLevelData\["(acc_[^"]+)"\]\s*=/g)) {
    const end = html.indexOf('</script>', m.index)
    const block = html.slice(m.index, end < 0 ? undefined : end)
    if (block.includes('"configData"')) out.push({ key: m[1], block })
  }
  return out
}

export function parseIPadAccessories(pages: Page[]): IPadAccessories {
  const pencils: Record<string, Pencil[]> = {}
  const magicKeyboard: Record<string, number> = {}
  const warnings: string[] = []
  for (const page of pages) {
    const slug = pageSlug(page)
    if (!slug) continue
    const modelKey = slugToModelKey(slug)
    for (const { key, block } of accessoryBlocks(page.html)) {
      const items = accessoryItems(block, `${modelKey} ${key}`, warnings)
      if (/pencil/i.test(key)) {
        for (const item of items) {
          const list = (pencils[modelKey] ??= [])
          if (!list.some(p => p.pencilType === item.name)) list.push({ pencilType: item.name, price: item.price })
        }
      } else if (/keyboard/i.test(key)) {
        const uk = items.filter(i => i.language === 'enuk')
        if (uk.length === 0) {
          warnings.push(`${modelKey} ${key}: no British English (enuk) keyboard entry`)
          continue
        }
        const size = key.match(/_(\d+)inch$/)?.[1]
        magicKeyboard[size ? `${modelKey}:${size}inch` : modelKey] = Math.min(...uk.map(i => i.price))
      }
    }
  }
  return { pencils, magicKeyboard, warnings }
}

const NO_PENCIL: Pencil = { pencilType: 'None', price: 0 }

export function mapIPad(pages: Page[], accessories: IPadAccessories, previous: Category): MapResult {
  const models: MappedModel[] = []
  const unmapped: string[] = []
  const warnings: string[] = [...accessories.warnings]
  const knownPencilPrices = new Map<string, number>()
  for (const list of Object.values(accessories.pencils)) for (const p of list) knownPencilPrices.set(p.pencilType, p.price)

  for (const page of pages) {
    const skus = readSkus(page, parseIPadSku, unmapped)
    if (skus.length === 0) {
      warnings.push(`No iPad SKUs mapped from ${page.url}`)
      continue
    }
    const family = skus[0].family
    const previousModel = previous.models[family]
    const fresh = accessories.pencils[family]
    if (!fresh) warnings.push(`No accessory data for ${family}; keeping previous Apple Pencil types`)

    const specs = groupBySpec(skus)
      .map(group => {
        const { spec, size } = buildSpec(group, warnings)
        const previousSpec = previousModel?.specs.find(s => s.name === spec.name)
        let pencilList: Pencil[]
        if (fresh) {
          pencilList = fresh
        } else {
          pencilList = (previousSpec?.applePencil ?? [])
            .filter(p => p.pencilType !== NO_PENCIL.pencilType)
            .map(p => ({ pencilType: p.pencilType, price: knownPencilPrices.get(p.pencilType) ?? p.price }))
          if (!previousSpec) warnings.push(`New iPad model ${spec.name} has no Apple Pencil data`)
        }
        if (pencilList.length > 0) spec.applePencil = [NO_PENCIL, ...pencilList]
        const keyboard = accessories.magicKeyboard[size ? `${family}:${size}inch` : family] ?? (fresh ? undefined : previousSpec?.magicKeyboard)
        if (keyboard !== undefined) spec.magicKeyboard = keyboard
        else if (fresh && size) warnings.push(`No Magic Keyboard found for ${spec.name}`)
        return spec
      })
      .sort((a, b) => a.price - b.price)

    const model: Model = {
      displayName: family,
      colors: [...new Set(skus.map(s => s.color))].sort(),
      specs,
    }
    models.push({ category: 'iPad', key: family, model, published: skus.map(published) })
  }
  return { models, unmapped, warnings }
}
