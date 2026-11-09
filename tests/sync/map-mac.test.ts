import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { makeCatalogueHelpers } from '@/lib/catalogue/helpers'
import { CATALOGUE_NOTICE, parseCatalogue, type Category } from '@/lib/catalogue/schema'
import { extractKeyedJson, MissingDataError } from '@/scripts/catalogue/extract'
import { FetchFailedError, type Fetcher } from '@/scripts/catalogue/http'
import { buildMacModels, macDeltaRequests, macOptionLabel, mapMac, productLineName, readUpdateConfig, type MacDeltas } from '@/scripts/catalogue/map-mac'
import type { MappedModel, MapResult, Page } from '@/scripts/catalogue/types'

type Saved = { requestUrl: string; response: unknown }
type Product = { priceKey: string; type: string; productConfiguration: Record<string, string>; dimensions: Record<string, string> }
type Bootstrap = { products: Product[]; mainDisplayValues: { prices: Record<string, { amount: number }> } }
type UpdateBody = {
  body: {
    options: Record<string, { compatibleOptions: Record<string, { priceDelta?: string; isSelected?: boolean }> }>
    prices: Record<string, { amount: number }>
  }
}

const fx = (name: string) => readFileSync(`tests/fixtures/apple/${name}`, 'utf8')
const saved = (name: string) => JSON.parse(fx(name)) as Saved
const page = (file: string, slug: string): Page => ({ url: `https://www.apple.com/uk/shop/buy-mac/${slug}`, html: fx(file) })
const bootstrapOf = (p: Page) => extractKeyedJson(p.html, p.url, 'productSelectionData')
const updateConfigUrlOf = (p: Page) => p.html.match(/updateConfigUrl\s*:\s*'([^']+)'/)?.[1] ?? ''

const pages = {
  mbp: page('mac-macbook-pro.html', 'macbook-pro'),
  mba: page('mac-macbook-air.html', 'macbook-air'),
  imac: page('mac-imac.html', 'imac'),
  mini: page('mac-mac-mini.html', 'mac-mini'),
  studio: page('mac-mac-studio.html', 'mac-studio'),
}

const chipFixtures = [
  'mac-macbook-pro-14-update-m5pro-15-16.json',
  'mac-macbook-pro-14-update-m5pro-18-20.json',
  'mac-macbook-pro-14-update-m5max-18-40.json',
  'mac-macbook-air-15-update-10-10.json',
  'mac-imac-update-12-12.json',
  'mac-mac-mini-update-m5pro-15-16.json',
  'mac-mac-studio-update-m5ultra-30-64.json',
]

function requestKey(url: string): string {
  const q = new URL(url, 'https://www.apple.com').searchParams
  const uv = [...q].filter(([k]) => k.startsWith('uv.')).map(([k, v]) => `${k}=${v}`)
  return [q.get('collection'), q.get('sv.chassis-dimensionScreensize') ?? '', ...uv].join('|')
}

function served(files: Saved[]): Map<string, unknown> {
  return new Map(files.map(f => [requestKey(f.requestUrl), f.response]))
}

function fakeFetcher(responses: Map<string, unknown> | ((url: string) => unknown)): Fetcher & { requested: string[] } {
  const requested: string[] = []
  return {
    requested,
    async text(url: string): Promise<string> {
      throw new FetchFailedError(url, 'text not served')
    },
    async json<T = unknown>(url: string): Promise<T> {
      requested.push(url)
      const hit = typeof responses === 'function' ? responses(url) : responses.get(requestKey(url))
      if (hit === undefined) throw new FetchFailedError(url, 'no fixture for this request')
      return hit as T
    },
    get requestCount() {
      return requested.length
    },
  }
}

function subsetPage(p: Page, keep: (product: Product) => boolean): Page {
  const bootstrap = structuredClone(bootstrapOf(p)) as Bootstrap
  bootstrap.products = bootstrap.products.filter(keep)
  const html = `<script>window.PRODUCT_SELECTION_BOOTSTRAP = { productSelectionData: ${JSON.stringify(bootstrap)} }</script><script>window.pageLevelData.productSelectionUrl = { updateConfigUrl: '${updateConfigUrlOf(p)}' }</script>`
  return { url: p.url, html }
}

function availableDeltas(p: Page): MacDeltas {
  const fixtures = served(chipFixtures.map(saved))
  const deltas: MacDeltas = {}
  for (const r of macDeltaRequests(bootstrapOf(p), { updateConfigUrl: updateConfigUrlOf(p) })) {
    const response = fixtures.get(requestKey(r.url))
    if (response !== undefined) deltas[r.key] = readUpdateConfig(response, r.url)
  }
  return deltas
}

const built = (p: Page) => buildMacModels(bootstrapOf(p), availableDeltas(p), p.url)

function catalogueOf(models: MappedModel[]) {
  const empty = (name: string): Category => ({ category: name, appleCareAvailable: true, models: {} })
  const priced = models.filter(m => m.model.specs.length > 0)
  return parseCatalogue({
    notice: CATALOGUE_NOTICE,
    categories: {
      iPhone: empty('iPhone'),
      iPad: empty('iPad'),
      MacBook: { category: 'MacBook', appleCareAvailable: true, models: Object.fromEntries(priced.map(m => [m.key, m.model])) },
      'Apple Watch': empty('Apple Watch'),
    },
  })
}

function reproduce(result: MapResult): { checked: number; failures: string[] } {
  const helpers = makeCatalogueHelpers(catalogueOf(result.models))
  let checked = 0
  const failures: string[] = []
  for (const m of result.models) {
    for (const p of m.published) {
      if (!m.model.specs.some(s => s.name === p.spec)) continue
      checked++
      const got = helpers.calculatePrice('MacBook', m.key, p.spec, p.options)
      if (got !== p.price) failures.push(`${p.label}: ${got} vs ${p.price}`)
    }
  }
  return { checked, failures }
}

const specOf = (result: MapResult, model: string, spec: string) =>
  result.models.find(m => m.key === model)?.model.specs.find(s => s.name === spec)

const mba15 = subsetPage(pages.mba, p => p.dimensions['chassis-dimensionScreensize'] === '15inch')
const mbaChip = saved('mac-macbook-air-15-update-10-10.json')
const mbaMemory = saved('mac-macbook-air-15-update-memory-24gb.json')

function editedFollowUp(edit: (body: UpdateBody['body']) => void): Saved {
  const copy = structuredClone(mbaMemory)
  edit((copy.response as UpdateBody).body)
  return copy
}

describe('productLineName', () => {
  it('uses the product name Apple gives the page', () => {
    expect(productLineName(fx('mac-macbook-pro-proled-xdr-trimmed.html'), 'https://www.apple.com/uk/shop/buy-mac/macbook-pro-proled-xdr')).toBe(
      'MacBook Pro with PROLED XDR Display',
    )
    expect(productLineName(fx('mac-mac-mini.html'), 'https://www.apple.com/uk/shop/buy-mac/mac-mini')).toBe('Mac mini')
    expect(productLineName(fx('mac-macbook-pro.html'), 'https://www.apple.com/uk/shop/buy-mac/macbook-pro')).toBe('MacBook Pro')
  })

  it('falls back to the URL when the page names no product', () => {
    expect(productLineName('<html></html>', 'https://www.apple.com/uk/shop/buy-mac/macbook-pro-proled-xdr')).toBe('MacBook Pro PROLED XDR')
  })

  it('keys a mapped model by that name and its size', () => {
    const url = 'https://www.apple.com/uk/shop/buy-mac/macbook-pro'
    const result = buildMacModels(extractKeyedJson(fx('mac-macbook-pro.html'), url, 'productSelectionData'), {}, url, {}, new Set(), 'MacBook Pro with PROLED XDR Display')
    expect(result.models.map(m => m.key).sort()).toEqual(['MacBook Pro with PROLED XDR Display 14"', 'MacBook Pro with PROLED XDR Display 16"'])
  })
})

describe('macOptionLabel', () => {
  it('normalises Apple option headers to catalogue labels', () => {
    expect(macOptionLabel('memory-dimensionMemory', '36gb', '36GB unified memory')).toBe('36GB')
    expect(macOptionLabel('storage-dimensionCapacity', '1tb', '1TB SSD storage')).toBe('1TB')
    expect(macOptionLabel('storage-dimensionCapacity', '512gb', '512GB')).toBe('512GB')
    expect(macOptionLabel('power_adapter-wattage', '96w', '96W USB-C Power Adapter')).toBe('96W')
    expect(macOptionLabel('power_adapter-wattage', '0w', 'No Power Adapter')).toBe('No Power Adapter')
    expect(macOptionLabel('power_adapter-wattage', '0w')).toBe('No Power Adapter')
    expect(macOptionLabel('memory-dimensionMemory', '24gb')).toBe('24GB')
  })
})

describe('macDeltaRequests', () => {
  const bootstrap = bootstrapOf(pages.mbp)
  const requests = macDeltaRequests(bootstrap, { updateConfigUrl: updateConfigUrlOf(pages.mbp) })
  const products = (bootstrap as Bootstrap).products

  it('sends one request per size and chip, each with exactly one uv. parameter', () => {
    expect(requests).toHaveLength(8)
    for (const r of requests) {
      expect(r.url.match(/[?&]uv\./g)).toHaveLength(1)
      expect(r.dimension).toBe('processor-dimensionChip-cpuCoreCount-gpuCoreCount')
    }
  })

  it('starts each chip from its own standard config', () => {
    for (const r of requests) {
      const q = new URL(r.url, 'https://www.apple.com').searchParams
      const chip = q.get('uv.processor-dimensionChip-cpuCoreCount-gpuCoreCount')
      const product = products.find(p => p.priceKey === r.key)
      expect(product?.dimensions['processor-dimensionChip-cpuCoreCount-gpuCoreCount']).toBe(chip)
      expect(product?.dimensions['display-dimensionFinish']).toBe('standard')
      for (const [dim, value] of Object.entries(product?.dimensions ?? {})) {
        if (dim === 'processor-dimensionChip-cpuCoreCount-gpuCoreCount') continue
        expect(q.get(`sv.${dim}`)).toBe(value)
      }
      expect(q.get('sv.keyboard-localizationCode')).toBe('gbr')
    }
  })

  it('omits the keyboard selection for Macs without a keyboard', () => {
    const reqs = macDeltaRequests(bootstrapOf(pages.mini), { updateConfigUrl: updateConfigUrlOf(pages.mini) })
    expect(reqs).toHaveLength(3)
    for (const r of reqs) expect(r.url).not.toContain('keyboard')
  })
})

describe('buildMacModels: MacBook Pro from the available update-config fixtures', () => {
  const result = built(pages.mbp)
  const mbp14 = result.models.find(m => m.key === 'MacBook Pro 14"')

  it('maps one model per size under the MacBook category', () => {
    expect(result.models.map(m => [m.category, m.key])).toEqual([
      ['MacBook', 'MacBook Pro 14"'],
      ['MacBook', 'MacBook Pro 16"'],
    ])
    expect(result.models[1].model.specs).toEqual([])
    expect(result.models[1].published).toHaveLength(12)
  })

  it('names specs from the chip and core counts', () => {
    expect(mbp14?.model.specs.map(s => s.name)).toEqual([
      'M5 Pro 15-Core CPU 16-Core GPU',
      'M5 Pro 18-Core CPU 20-Core GPU',
      'M5 Max 18-Core CPU 40-Core GPU',
    ])
    expect(mbp14?.model.colors).toEqual(['Space Black', 'Silver'])
  })

  it('takes the base price from the standard config and the deltas from its own update-config call', () => {
    expect(specOf(result, 'MacBook Pro 14"', 'M5 Pro 15-Core CPU 16-Core GPU')).toEqual({
      name: 'M5 Pro 15-Core CPU 16-Core GPU',
      price: 2499,
      partNumber: 'MGDN4B/A',
      colors: ['Space Black', 'Silver'],
      constraints: { minMemory: '24GB', minStorage: '1TB' },
      memoryOptions: { '24GB': 0, '48GB': 600 },
      storageOptions: { '1TB': 0, '2TB': 500, '4TB': 1500 },
      chargerOptions: { 'No Power Adapter': 0 },
      nanoTexture: 150,
      appleCare: [],
    })
    expect(specOf(result, 'MacBook Pro 14"', 'M5 Pro 18-Core CPU 20-Core GPU')).toMatchObject({
      price: 2699,
      memoryOptions: { '24GB': 0, '48GB': 600, '64GB': 1000 },
      storageOptions: { '1TB': 0, '2TB': 500, '4TB': 1500 },
      chargerOptions: { 'No Power Adapter': 0, '96W': 79 },
      nanoTexture: 150,
    })
    expect(specOf(result, 'MacBook Pro 14"', 'M5 Max 18-Core CPU 40-Core GPU')).toMatchObject({
      price: 4699,
      constraints: { minMemory: '48GB', minStorage: '2TB' },
      memoryOptions: { '48GB': 0, '64GB': 400, '128GB': 2000 },
      storageOptions: { '2TB': 0, '4TB': 1000, '8TB': 3000 },
      chargerOptions: { 'No Power Adapter': 0, '96W': 79 },
      nanoTexture: 150,
    })
  })

  it('reproduces the nano-texture standard configs from apple-sources.md', () => {
    const helpers = makeCatalogueHelpers(catalogueOf(result.models))
    expect(helpers.calculatePrice('MacBook', 'MacBook Pro 14"', 'M5 Max 18-Core CPU 40-Core GPU', { nanoTexture: true })).toBe(4849)
    expect(helpers.calculatePrice('MacBook', 'MacBook Pro 14"', 'M5 Pro 15-Core CPU 16-Core GPU', { nanoTexture: true })).toBe(2649)
  })

  it('reproduces every standard-config price with the catalogue helpers', () => {
    const { checked, failures } = reproduce(result)
    expect(failures).toEqual([])
    expect(checked).toBe(12)
  })

  it('publishes every standard config, including chips it could not price', () => {
    expect(mbp14?.published).toHaveLength(20)
    expect(mbp14?.published.filter(p => p.options.nanoTexture)).toHaveLength(10)
    expect(result.warnings.some(w => w.includes('MacBook Pro 14"') && w.includes('M6 12-Core CPU 12-Core GPU'))).toBe(true)
  })

  it('sends software and keyboard-language groups with no form field to unmapped', () => {
    expect(result.unmapped).toContain('MacBook Pro 14": software_logic-preInstalledSoftware — logic_pro (+£199.99)')
    expect(result.unmapped).toContain('MacBook Pro 14": software_final-preInstalledSoftware — final_cut_pro (+£299.99)')
    const keyboard = result.unmapped.filter(u => u.startsWith('MacBook Pro 14": keyboard-localizationCode — '))
    expect(keyboard).toHaveLength(1)
    expect(keyboard[0]).toMatch(/— gbr, none, int, .* \(no price\)$/)
    expect(new Set(result.unmapped).size).toBe(result.unmapped.length)
  })
})

describe('buildMacModels: other families from the available update-config fixtures', () => {
  it('iMac maps nano-texture glass and sends accessories and unpriced groups to unmapped', () => {
    const result = built(pages.imac)
    expect(result.models.map(m => m.key)).toEqual(['iMac'])
    const spec = specOf(result, 'iMac', 'M6 12-Core CPU 12-Core GPU')
    expect(spec).toMatchObject({
      price: 1699,
      memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400 },
      storageOptions: { '256GB': 0, '512GB': 200, '1TB': 500, '2TB': 1000 },
      nanoTexture: 200,
      colors: ['Blue', 'Purple', 'Pink', 'Orange', 'Yellow', 'Green', 'Silver'],
    })
    expect(spec?.chargerOptions).toBeUndefined()
    expect(result.unmapped).toContain('iMac: mouse_and_track_pad-pointingDeviceType — magic_trackpad (+£50)')
    expect(result.unmapped).toContain('iMac: keyboard-keyboardFormFactor — keyboard_with_touch_id_and_numeric_keypad (+£30)')
    expect(result.unmapped).toContain('iMac: chassis-dimensionStandType — desktop, vesa (no price)')
    const { checked, failures } = reproduce(result)
    expect(failures).toEqual([])
    expect(checked).toBe(7)
  })

  it('Mac mini maps without colours or sizes', () => {
    const result = built(pages.mini)
    expect(result.models.map(m => m.key)).toEqual(['Mac mini'])
    const spec = specOf(result, 'Mac mini', 'M5 Pro 15-Core CPU 16-Core GPU')
    expect(spec).toMatchObject({
      price: 1699,
      partNumber: 'MHQN4B/A',
      memoryOptions: { '24GB': 0, '48GB': 600, '64GB': 1000 },
      storageOptions: { '512GB': 0, '1TB': 300, '2TB': 800, '4TB': 1800, '8TB': 3800 },
    })
    expect(spec?.colors).toBeUndefined()
    expect(result.unmapped).toContain('Mac mini: ethernet_adapter-ethernetBandwidth — 10gb_per_second (+£100)')
    const { checked, failures } = reproduce(result)
    expect(failures).toEqual([])
    expect(checked).toBe(1)
  })

  it('Mac Studio maps the M5 Ultra', () => {
    const result = built(pages.studio)
    expect(result.models.map(m => m.key)).toEqual(['Mac Studio'])
    expect(specOf(result, 'Mac Studio', 'M5 Ultra 30-Core CPU 64-Core GPU')).toMatchObject({
      price: 5499,
      constraints: { minMemory: '96GB', minStorage: '1TB' },
      memoryOptions: { '96GB': 0, '256GB': 4000 },
      storageOptions: { '1TB': 0, '2TB': 500, '4TB': 1500, '8TB': 3500, '16TB': 7500 },
    })
    const { checked, failures } = reproduce(result)
    expect(failures).toEqual([])
    expect(checked).toBe(1)
  })

  it('splits standard configs of one chip that differ in a field-less extra', () => {
    const bootstrap = structuredClone(bootstrapOf(pages.imac)) as Bootstrap
    const original = bootstrap.products.find(p => p.priceKey === 'blue-12-12')
    if (!original) throw new Error('fixture changed')
    bootstrap.products.push({
      ...original,
      priceKey: 'blue-12-12-ethernet',
      productConfiguration: { ...original.productConfiguration, ethernet_adapter: '065-TEST' },
    })
    bootstrap.mainDisplayValues.prices['blue-12-12-ethernet'] = { amount: 1749 }
    const base: Record<string, Record<string, number>> = {
      'memory-dimensionMemory': { '16gb': 0, '24gb': 200 },
      'storage-dimensionCapacity': { '256gb': 0, '512gb': 200 },
      'display-dimensionFinish': { glossy: 0, matte: 200 },
    }
    const keys = macDeltaRequests(bootstrap, { updateConfigUrl: updateConfigUrlOf(pages.imac) }).map(r => r.key)
    const standardKey = keys.find(k => k.endsWith('-12-12') && k !== 'blue-12-12-ethernet')
    if (!standardKey) throw new Error('fixture changed')
    const deltas: MacDeltas = {
      [standardKey]: base,
      'blue-12-12-ethernet': { ...base, 'ethernet_adapter-ethernetPortCount': { '1': 0 } },
    }
    const specs = buildMacModels(bootstrap, deltas, pages.imac.url).models[0].model.specs
    expect(specs.find(s => s.name === 'M6 12-Core CPU 12-Core GPU with 2.5 Gigabit Ethernet port')).toMatchObject({
      price: 1749,
      includes: ['2.5 Gigabit Ethernet port'],
      colors: ['Blue'],
    })
    expect(specs.find(s => s.name === 'M6 12-Core CPU 12-Core GPU')?.price).toBe(1699)
  })

  it('keeps published prices for a model with no priced chip and says so', () => {
    const result = buildMacModels(bootstrapOf(pages.studio), {}, pages.studio.url)
    expect(result.models).toHaveLength(1)
    expect(result.models[0].model.specs).toEqual([])
    expect(result.models[0].published).toHaveLength(4)
    expect(result.warnings.length).toBeGreaterThanOrEqual(5)
  })
})

describe('mapMac', () => {
  it('MacBook Air 15" leaves the BTR config to reveal power adapters and cross-checks storage', async () => {
    const fetcher = fakeFetcher(served([mbaChip, mbaMemory]))
    const result = await mapMac(mba15, fetcher)
    expect(fetcher.requested).toHaveLength(2)
    for (const url of fetcher.requested) expect(url.match(/[?&]uv\./g)).toHaveLength(1)
    expect(fetcher.requested[1]).toContain('sv.processor-cpuCoreCount-gpuCoreCount=10-10&uv.memory-dimensionMemory=24gb')
    const spec = specOf(result, 'MacBook Air 15"', 'M5 10-Core CPU 10-Core GPU')
    expect(spec).toMatchObject({
      price: 1499,
      partNumber: 'MDV94B/A',
      constraints: { minMemory: '16GB', minStorage: '512GB' },
      memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400 },
      storageOptions: { '512GB': 0, '1TB': 300, '2TB': 800, '4TB': 1800 },
      chargerOptions: { 'No Power Adapter': 0, '40W': 39, '35W': 59, '70W': 59 },
      colors: ['Sky Blue', 'Silver', 'Starlight', 'Midnight'],
    })
    expect(spec?.nanoTexture).toBeUndefined()
    expect(result.warnings).toEqual([])
    const helpers = makeCatalogueHelpers(catalogueOf(result.models))
    expect(helpers.calculatePrice('MacBook', 'MacBook Air 15"', 'M5 10-Core CPU 10-Core GPU', { memory: '32GB', storage: '4TB', charger: '70W' })).toBe(3758)
    const { checked, failures } = reproduce(result)
    expect(failures).toEqual([])
    expect(checked).toBe(4)
  })

  it('cross-checks storage for a configurable chip with memory and storage upgrades', async () => {
    const imac = saved('mac-imac-update-12-12.json')
    const shifted = structuredClone(imac)
    const body = (shifted.response as UpdateBody).body
    body.options['memory-dimensionMemory'].compatibleOptions = {
      '16gb': { priceDelta: 'm200' },
      '24gb': { priceDelta: '0_0' },
      '32gb': { priceDelta: '200_00' },
    }
    body.prices.m200 = { amount: -200 }
    body.prices['200_00'] = { amount: 200 }
    shifted.requestUrl = '/uk/shop/api/cto/update-config?collection=IMAC_2026_COLLECTION&uv.memory-dimensionMemory=24gb'
    const fetcher = fakeFetcher(served([imac, shifted]))
    const result = await mapMac(subsetPage(pages.imac, p => p.dimensions['processor-cpuCoreCount-gpuCoreCount'] === '12-12'), fetcher)
    expect(fetcher.requested).toHaveLength(2)
    expect(fetcher.requested[1]).toContain('sv.processor-cpuCoreCount-gpuCoreCount=12-12&uv.memory-dimensionMemory=24gb')
    expect(specOf(result, 'iMac', 'M6 12-Core CPU 12-Core GPU')?.memoryOptions).toEqual({ '16GB': 0, '24GB': 200, '32GB': 400 })
    expect(result.warnings).toEqual([])
  })

  it('holds back a spec whose storage delta changes once memory is upgraded', async () => {
    const coupled = editedFollowUp(body => {
      body.options['storage-dimensionCapacity'].compatibleOptions['1tb'].priceDelta = '200_00'
      body.prices['200_00'] = { amount: 200 }
    })
    const result = await mapMac(mba15, fakeFetcher(served([mbaChip, coupled])))
    const model = result.models.find(m => m.key === 'MacBook Air 15"')
    expect(model?.model.specs).toEqual([])
    expect(model?.published).toHaveLength(4)
    expect(result.warnings).toContain('MacBook Air 15" / M5 10-Core CPU 10-Core GPU: non-additive memory×storage pricing — spec held back')
  })

  it('holds back a spec when update-config selects a different chip', async () => {
    const upgraded = editedFollowUp(body => {
      const chips = body.options['processor-cpuCoreCount-gpuCoreCount'].compatibleOptions
      chips['10-10'].isSelected = false
      chips['10-8'] = { isSelected: true }
    })
    const result = await mapMac(mba15, fakeFetcher(served([mbaChip, upgraded])))
    expect(result.models[0].model.specs).toEqual([])
    expect(result.warnings).toContain('MacBook Air 15" / M5 10-Core CPU 10-Core GPU: update-config selected chip 10-8 instead of 10-10 — spec held back')
  })

  it('emits a spec whose chargers stay hidden after leaving the BTR config and warns', async () => {
    const hidden = editedFollowUp(body => {
      body.options['power_adapter-wattage'].compatibleOptions = { '0w': { priceDelta: '0_0' } }
    })
    const result = await mapMac(mba15, fakeFetcher(served([mbaChip, hidden])))
    expect(specOf(result, 'MacBook Air 15"', 'M5 10-Core CPU 10-Core GPU')?.chargerOptions).toEqual({ 'No Power Adapter': 0 })
    expect(result.warnings).toContain('MacBook Air 15" / M5 10-Core CPU 10-Core GPU: charger options limited to No Power Adapter — check Apple')
    expect(result.warnings.some(w => w.includes('held back'))).toBe(false)
  })

  it('still holds back a hidden-charger spec whose follow-up is not additive', async () => {
    const coupled = editedFollowUp(body => {
      body.options['power_adapter-wattage'].compatibleOptions = { '0w': { priceDelta: '0_0' } }
      body.options['storage-dimensionCapacity'].compatibleOptions['1tb'].priceDelta = '200_00'
      body.prices['200_00'] = { amount: 200 }
    })
    const result = await mapMac(mba15, fakeFetcher(served([mbaChip, coupled])))
    expect(result.models[0].model.specs).toEqual([])
    expect(result.warnings).toContain('MacBook Air 15" / M5 10-Core CPU 10-Core GPU: non-additive memory×storage pricing — spec held back')
  })

  it('fails when a chip request still fails after retries', async () => {
    await expect(mapMac(pages.mbp, fakeFetcher(served(chipFixtures.map(saved))))).rejects.toBeInstanceOf(FetchFailedError)
  })

  it('fails when the follow-up request fails', async () => {
    await expect(mapMac(mba15, fakeFetcher(served([mbaChip])))).rejects.toBeInstanceOf(FetchFailedError)
  })

  it('throws MissingDataError when update-config returns an empty body', async () => {
    const empty = fakeFetcher(() => ({ head: { status: '200', data: {} }, body: {} }))
    await expect(mapMac(pages.studio, empty)).rejects.toBeInstanceOf(MissingDataError)
  })
})

describe('mapMac on live Apple UK responses', () => {
  const mbp14Max40 = subsetPage(
    pages.mbp,
    p => p.dimensions['chassis-dimensionScreensize'] === '14inch' && p.dimensions['processor-dimensionChip-cpuCoreCount-gpuCoreCount'] === 'm5max-18-40',
  )
  const mba13Base = subsetPage(pages.mba, p => p.dimensions['chassis-dimensionScreensize'] === '13inch' && p.dimensions['processor-cpuCoreCount-gpuCoreCount'] === '10-8')
  const colourOf = (url: string) => new URL(url, 'https://www.apple.com').searchParams.get('sv.chassis-dimensionColor')
  const mbpLive = () => fakeFetcher(served([saved('mac-live-mbp-14-m5max-18-40.json'), saved('mac-live-mbp-14-m5max-18-40-memory-64gb.json')]))

  it('ignores the chip group when cross-checking memory against storage', async () => {
    const result = await mapMac(mbp14Max40, mbpLive())
    expect(result.warnings.filter(w => w.includes('held back'))).toEqual([])
    expect(specOf(result, 'MacBook Pro 14"', 'M5 Max 18-Core CPU 40-Core GPU')).toMatchObject({
      memoryOptions: { '48GB': 0, '64GB': 400, '128GB': 2000 },
      storageOptions: { '2TB': 0, '4TB': 1000, '8TB': 3000 },
    })
  })

  it('tries the next colour when a follow-up lands on another preconfigured model', async () => {
    const first = saved('mac-live-mba-15-10-10.json').response
    const hidden = saved('mac-live-mba-15-starlight-memory-24gb.json').response
    const revealed = saved('mac-live-mba-15-silver-memory-24gb.json').response
    let followUps = 0
    const fetcher = fakeFetcher(url => {
      if (!url.includes('uv.memory-dimensionMemory')) return first
      followUps++
      return followUps === 1 ? hidden : revealed
    })
    const result = await mapMac(mba15, fetcher)
    const colours = fetcher.requested.filter(u => u.includes('uv.memory')).map(colourOf)
    expect(colours).toHaveLength(2)
    expect(new Set(colours).size).toBe(2)
    expect(result.warnings.filter(w => w.includes('held back'))).toEqual([])
    expect(specOf(result, 'MacBook Air 15"', 'M5 10-Core CPU 10-Core GPU')?.chargerOptions).toEqual({ 'No Power Adapter': 0, '40W': 39, '35W': 59, '70W': 59 })
  })

  it('emits with a warning when every colour keeps the chargers hidden', async () => {
    const first = saved('mac-live-mba-15-10-10.json').response
    const hidden = saved('mac-live-mba-15-starlight-memory-24gb.json').response
    const fetcher = fakeFetcher(url => (url.includes('uv.memory-dimensionMemory') ? hidden : first))
    const result = await mapMac(mba15, fetcher)
    expect(specOf(result, 'MacBook Air 15"', 'M5 10-Core CPU 10-Core GPU')).toMatchObject({
      memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400 },
      chargerOptions: { 'No Power Adapter': 0 },
    })
    expect(result.warnings).toContain('MacBook Air 15" / M5 10-Core CPU 10-Core GPU: charger options limited to No Power Adapter — check Apple')
  })

  it('emits MacBook Pro 14" M6, whose chargers stay single in every colour, with a warning', async () => {
    const mbp14M6 = subsetPage(
      pages.mbp,
      p => p.dimensions['chassis-dimensionScreensize'] === '14inch' && p.dimensions['processor-dimensionChip-cpuCoreCount-gpuCoreCount'] === 'm6-12-12',
    )
    const fetcher = fakeFetcher(served([saved('mac-live-mbp-14-m6-12-12.json'), saved('mac-live-mbp-14-m6-12-12-memory-24gb.json')]))
    const result = await mapMac(mbp14M6, fetcher)
    expect(result.warnings.some(w => w.includes('held back'))).toBe(false)
    expect(result.warnings).toContain('MacBook Pro 14" / M6 12-Core CPU 12-Core GPU: charger options limited to No Power Adapter — check Apple')
    expect(specOf(result, 'MacBook Pro 14"', 'M6 12-Core CPU 12-Core GPU')).toMatchObject({
      memoryOptions: { '16GB': 0, '24GB': 200, '32GB': 400 },
      storageOptions: { '1TB': 0, '2TB': 500, '4TB': 1500 },
      chargerOptions: { 'No Power Adapter': 0 },
    })
  })

  it('emits a fixed preconfigured model that offers no same-chip upgrade', async () => {
    const fetcher = fakeFetcher(served([saved('mac-live-mba-13-10-8.json')]))
    const result = await mapMac(mba13Base, fetcher)
    expect(fetcher.requested).toHaveLength(1)
    expect(result.warnings.filter(w => w.includes('held back'))).toEqual([])
    expect(result.warnings).toContain('MacBook Air 13" / M5 10-Core CPU 8-Core GPU: charger options limited to No Power Adapter — check Apple')
    expect(specOf(result, 'MacBook Air 13"', 'M5 10-Core CPU 8-Core GPU')).toMatchObject({
      price: 1299,
      memoryOptions: { '16GB': 0 },
      storageOptions: { '512GB': 0 },
      chargerOptions: { 'No Power Adapter': 0 },
    })
  })

  it('is independent of the order Apple lists products in', async () => {
    const bootstrap = structuredClone(bootstrapOf(mbp14Max40)) as Bootstrap
    bootstrap.products.reverse()
    const reversed: Page = {
      url: mbp14Max40.url,
      html: `<script>window.PRODUCT_SELECTION_BOOTSTRAP = { productSelectionData: ${JSON.stringify(bootstrap)} }</script><script>window.pageLevelData.productSelectionUrl = { updateConfigUrl: '${updateConfigUrlOf(mbp14Max40)}' }</script>`,
    }
    const a = mbpLive()
    const b = mbpLive()
    const resultA = await mapMac(mbp14Max40, a)
    const resultB = await mapMac(reversed, b)
    expect(b.requested).toEqual(a.requested)
    expect(resultB.models.map(m => m.model)).toEqual(resultA.models.map(m => m.model))
  })
})
