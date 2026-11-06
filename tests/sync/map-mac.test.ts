import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { makeCatalogueHelpers } from '@/lib/catalogue/helpers'
import { CATALOGUE_NOTICE, parseCatalogue, type Category } from '@/lib/catalogue/schema'
import { extractKeyedJson, MissingDataError } from '@/scripts/catalogue/extract'
import { FetchFailedError, type Fetcher } from '@/scripts/catalogue/http'
import { buildMacModels, macDeltaRequests, macOptionLabel, mapMac, type MacDeltas } from '@/scripts/catalogue/map-mac'
import type { MappedModel, MapResult, Page } from '@/scripts/catalogue/types'

const fx = (name: string) => readFileSync(`tests/fixtures/apple/${name}`, 'utf8')
const page = (file: string, slug: string): Page => ({ url: `https://www.apple.com/uk/shop/buy-mac/${slug}`, html: fx(file) })

const pages = {
  mbp: page('mac-macbook-pro.html', 'macbook-pro'),
  mba: page('mac-macbook-air.html', 'macbook-air'),
  imac: page('mac-imac.html', 'imac'),
  mini: page('mac-mac-mini.html', 'mac-mini'),
  studio: page('mac-mac-studio.html', 'mac-studio'),
}

const updateFixtures = [
  'mac-macbook-pro-14-update-m5pro-15-16.json',
  'mac-macbook-pro-14-update-m5pro-18-20.json',
  'mac-macbook-pro-14-update-m5max-18-40.json',
  'mac-macbook-air-15-update-10-10.json',
  'mac-macbook-air-15-update-memory-24gb.json',
  'mac-imac-update-12-12.json',
  'mac-mac-mini-update-m5pro-15-16.json',
  'mac-mac-studio-update-m5ultra-30-64.json',
]

function requestKey(url: string): string {
  const q = new URL(url, 'https://www.apple.com').searchParams
  const uv = [...q].filter(([k]) => k.startsWith('uv.')).map(([k, v]) => `${k}=${v}`)
  return [q.get('collection'), q.get('sv.chassis-dimensionScreensize') ?? '', ...uv].join('|')
}

function fakeFetcher(responses: Map<string, unknown>): Fetcher & { requested: string[] } {
  const requested: string[] = []
  return {
    requested,
    async text(url: string): Promise<string> {
      throw new FetchFailedError(url, 'text not served')
    },
    async json<T = unknown>(url: string): Promise<T> {
      requested.push(url)
      const key = requestKey(url)
      if (!responses.has(key)) throw new FetchFailedError(url, 'no fixture')
      return responses.get(key) as T
    },
    get requestCount() {
      return requested.length
    },
  }
}

function fixtureResponses(): Map<string, unknown> {
  const map = new Map<string, unknown>()
  for (const file of updateFixtures) {
    const saved = JSON.parse(fx(file)) as { requestUrl: string; response: unknown }
    map.set(requestKey(saved.requestUrl), saved.response)
  }
  return map
}

function catalogueOf(models: MappedModel[]) {
  const empty = (name: string): Category => ({ category: name, appleCareAvailable: true, models: {} })
  return parseCatalogue({
    notice: CATALOGUE_NOTICE,
    categories: {
      iPhone: empty('iPhone'),
      iPad: empty('iPad'),
      MacBook: { category: 'MacBook', appleCareAvailable: true, models: Object.fromEntries(models.map(m => [m.key, m.model])) },
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
  const bootstrap = extractKeyedJson(pages.mbp.html, pages.mbp.url, 'productSelectionData')
  const requests = macDeltaRequests(bootstrap, { updateConfigUrl: '/uk/shop/api/cto/update-config?collection=MBP_2026_COLLECTION&fae=true' })
  const products = (bootstrap as { products: { priceKey: string; type: string; dimensions: Record<string, string> }[] }).products

  it('sends one request per size and chip, each with exactly one uv. parameter', () => {
    expect(requests).toHaveLength(8)
    for (const r of requests) {
      expect(r.url.match(/[?&]uv\./g)).toHaveLength(1)
      expect(r.dimension).toBe('processor-dimensionChip-cpuCoreCount-gpuCoreCount')
    }
  })

  it("starts each chip from its own standard config", () => {
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
    const mini = extractKeyedJson(pages.mini.html, pages.mini.url, 'productSelectionData')
    const reqs = macDeltaRequests(mini, { updateConfigUrl: '/uk/shop/api/cto/update-config?collection=MAC_MINI_2026_COLLECTION&fae=true' })
    expect(reqs).toHaveLength(3)
    for (const r of reqs) expect(r.url).not.toContain('keyboard')
  })
})

describe('mapMac: MacBook Pro', async () => {
  const fetcher = fakeFetcher(fixtureResponses())
  const result = await mapMac(pages.mbp, fetcher)

  it('maps one model per size under the MacBook category, dropping a size with no priced chip', () => {
    expect(result.models.map(m => [m.category, m.key])).toEqual([['MacBook', 'MacBook Pro 14"']])
    expect(result.warnings.some(w => w.includes('MacBook Pro 16"'))).toBe(true)
  })

  it('names specs from the chip and core counts', () => {
    const mbp14 = result.models.find(m => m.key === 'MacBook Pro 14"')?.model
    expect(mbp14?.specs.map(s => s.name)).toEqual([
      'M5 Pro 15-Core CPU 16-Core GPU',
      'M5 Pro 18-Core CPU 20-Core GPU',
      'M5 Max 18-Core CPU 40-Core GPU',
    ])
    expect(mbp14?.colors).toEqual(['Space Black', 'Silver'])
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

  it('publishes every standard config of a mapped model, including chips it could not price', () => {
    const published = result.models.flatMap(m => m.published)
    expect(published).toHaveLength(20)
    expect(published.filter(p => p.options.nanoTexture)).toHaveLength(10)
  })

  it('warns about chips without update-config data and BTR configs whose hidden options could not be fetched', () => {
    expect(result.warnings.some(w => w.includes('MacBook Pro 14"') && w.includes('M6 12-Core CPU 12-Core GPU'))).toBe(true)
    expect(result.warnings.some(w => w.includes('14inch-silver-standard-m5pro-15-16') && /charger/i.test(w))).toBe(true)
  })

  it('sends software options with no form field to unmapped', () => {
    expect(result.unmapped).toContain('MacBook Pro 14": software_logic-preInstalledSoftware — logic_pro (+£199.99)')
    expect(result.unmapped).toContain('MacBook Pro 14": software_final-preInstalledSoftware — final_cut_pro (+£299.99)')
    expect(new Set(result.unmapped).size).toBe(result.unmapped.length)
  })

  it('sends exactly one uv. parameter on every request', () => {
    for (const url of fetcher.requested) expect(url.match(/[?&]uv\./g)).toHaveLength(1)
    expect(fetcher.requested[0]).toMatch(/^https:\/\/www\.apple\.com\/uk\/shop\/api\/cto\/update-config\?collection=MBP_2026_COLLECTION/)
  })
})

describe('mapMac: other families', () => {
  it('MacBook Air leaves the BTR config to reveal power adapters', async () => {
    const fetcher = fakeFetcher(fixtureResponses())
    const result = await mapMac(pages.mba, fetcher)
    expect(fetcher.requested.some(u => u.includes('uv.memory-dimensionMemory=24gb'))).toBe(true)
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
    const helpers = makeCatalogueHelpers(catalogueOf(result.models))
    expect(helpers.calculatePrice('MacBook', 'MacBook Air 15"', 'M5 10-Core CPU 10-Core GPU', { memory: '32GB', storage: '4TB', charger: '70W' })).toBe(3758)
    const { checked, failures } = reproduce(result)
    expect(failures).toEqual([])
    expect(checked).toBe(4)
  })

  it('iMac maps nano-texture glass and sends accessories to unmapped', async () => {
    const result = await mapMac(pages.imac, fakeFetcher(fixtureResponses()))
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
    const { checked, failures } = reproduce(result)
    expect(failures).toEqual([])
    expect(checked).toBe(7)
  })

  it('Mac mini maps without colours or sizes', async () => {
    const result = await mapMac(pages.mini, fakeFetcher(fixtureResponses()))
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

  it('Mac Studio maps the M5 Ultra', async () => {
    const result = await mapMac(pages.studio, fakeFetcher(fixtureResponses()))
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

  it('throws MissingDataError when update-config returns an empty body', async () => {
    const empty = new Map<string, unknown>()
    for (const key of fixtureResponses().keys()) empty.set(key, { head: { status: '200', data: {} }, body: {} })
    await expect(mapMac(pages.studio, fakeFetcher(empty))).rejects.toBeInstanceOf(MissingDataError)
  })
})

describe('buildMacModels', () => {
  it('splits standard configs of one chip that differ in a field-less extra', () => {
    const bootstrap = JSON.parse(JSON.stringify(extractKeyedJson(pages.imac.html, pages.imac.url, 'productSelectionData'))) as {
      products: { priceKey: string; productConfiguration: Record<string, string>; dimensions: Record<string, string> }[]
      mainDisplayValues: { prices: Record<string, { amount: number }> }
    }
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
    const deltas: MacDeltas = {
      'orange-12-12': base,
      'blue-12-12-ethernet': { ...base, 'ethernet_adapter-ethernetPortCount': { '1': 0 } },
    }
    const result = buildMacModels(bootstrap, deltas, pages.imac.url)
    const specs = result.models[0].model.specs
    const extra = specs.find(s => s.name === 'M6 12-Core CPU 12-Core GPU with 2.5 Gigabit Ethernet port')
    expect(extra).toMatchObject({ price: 1749, includes: ['2.5 Gigabit Ethernet port'], colors: ['Blue'] })
    expect(specs.find(s => s.name === 'M6 12-Core CPU 12-Core GPU')?.price).toBe(1699)
  })

  it('skips a chip with no deltas and says so', () => {
    const bootstrap = extractKeyedJson(pages.studio.html, pages.studio.url, 'productSelectionData')
    const result = buildMacModels(bootstrap, {}, pages.studio.url)
    expect(result.models).toEqual([])
    expect(result.warnings.length).toBeGreaterThanOrEqual(4)
  })
})
