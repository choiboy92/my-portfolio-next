import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { makeCatalogueHelpers } from '@/lib/catalogue/helpers'
import { CATALOGUE_NOTICE, parseCatalogue, type Category } from '@/lib/catalogue/schema'
import { MissingDataError } from '@/scripts/catalogue/extract'
import { FetchFailedError, type Fetcher } from '@/scripts/catalogue/http'
import { mapWatch } from '@/scripts/catalogue/map-watch'
import type { MappedModel, Page } from '@/scripts/catalogue/types'

type Saved = { requestFor: string; response: { body: Record<string, unknown> } }

const fx = (name: string) => readFileSync(`tests/fixtures/apple/${name}`, 'utf8')
const saved = (name: string) => JSON.parse(fx(name)) as Saved
const page: Page = { url: 'https://www.apple.com/uk/shop/buy-watch/apple-watch', html: fx('watch-apple-watch.html') }

const alu42 = saved('watch-apple-watch-bands-aluminum-42mm-gps.json')
const ti46 = saved('watch-apple-watch-bands-titanium-46mm-gpscell.json')
const magneticLink42 = saved('watch-apple-watch-band-sizes-aluminum-42mm-gps-magneticlink.json')
const link46 = saved('watch-apple-watch-band-sizes-titanium-46mm-gpscell-link.json')

const ALU_46_GPS = 419
const TI_46_CELL = 699

function shifted(file: Saved, delta: number): unknown {
  const response = structuredClone(file.response) as { body: { itemPrices: Record<string, { amount: number }> } }
  for (const price of Object.values(response.body.itemPrices)) price.amount += delta
  return response
}

const sizeLists: Record<string, { '42mm': string[]; '46mm': string[] }> = {
  sololoop: { '42mm': range(0, 9), '46mm': range(0, 12) },
  braidedsololoop: { '42mm': range(0, 9), '46mm': range(0, 12) },
  modbuckle: { '42mm': ['Small', 'Medium', 'Large'], '46mm': [] },
  milanese: { '42mm': ['onesize'], '46mm': ['onesize'] },
  link: { '42mm': ['onesize'], '46mm': ['onesize'] },
}

function range(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
}

function sizesBody(style: string, caseSize: '42mm' | '46mm'): unknown {
  const list = sizeLists[style]?.[caseSize] ?? ['S/M', 'M/L']
  const options = list.map(text => (text === 'onesize' ? { key: 'onesize', text: 'One Size (Fits Most)' } : { key: text.toLowerCase(), text }))
  return { head: { status: '200' }, body: { options, prices: {} } }
}

type Tweak = { selection46?: (body: unknown) => unknown; fail?: RegExp; emptySelection?: boolean }

function fakeFetcher(tweak: Tweak = {}): Fetcher & { requested: string[] } {
  const requested: string[] = []
  return {
    requested,
    async text(url: string): Promise<string> {
      throw new FetchFailedError(url, 'text not served')
    },
    async json<T = unknown>(url: string): Promise<T> {
      requested.push(url)
      if (tweak.fail?.test(url)) throw new FetchFailedError(url, 'HTTP 500 after 5 attempts')
      const q = new URL(url).searchParams
      const caseSize = q.get('dm.watch_cases-dimensionCaseSize') as '42mm' | '46mm'
      const style = q.get('dm.watch_bands-dimensionBandStyle')
      if (url.includes('/api/band-selection')) {
        if (tweak.emptySelection) return { head: { status: '200' }, body: {} } as T
        if (caseSize === '42mm') {
          expect(q.get('option.watch_cases')).toBe('MJFN4MP/A')
          return alu42.response as T
        }
        expect(q.get('option.watch_cases')).toBe('MJFT4MP/A')
        const body = shifted(ti46, ALU_46_GPS - TI_46_CELL)
        return (tweak.selection46 ? tweak.selection46(body) : body) as T
      }
      if (url.includes('/api/band_sizes')) {
        if (style === 'magneticlink' && caseSize === '42mm') return magneticLink42.response as T
        if (style === 'link' && caseSize === '46mm') return link46.response as T
        return sizesBody(style ?? '', caseSize) as T
      }
      throw new FetchFailedError(url, 'no fixture for this request')
    },
    get requestCount() {
      return requested.length
    },
  }
}

async function run(tweak: Tweak = {}, p: Page = page) {
  const fetcher = fakeFetcher(tweak)
  const result = await mapWatch(p, fetcher)
  return { ...result, fetcher }
}

function catalogueOf(models: MappedModel[]) {
  const category: Category = { category: 'Apple Watch', models: Object.fromEntries(models.map(m => [m.key, m.model])) }
  const empty = { category: 'x', models: {} }
  return parseCatalogue({ notice: CATALOGUE_NOTICE, categories: { iPhone: empty, iPad: empty, MacBook: empty, 'Apple Watch': category } })
}

const styleOf = (m: MappedModel, spec: string, group: string, style: string) =>
  m.model.specs.find(s => s.name === spec)?.bandOptions?.find(g => g.material === group)?.style.find(s => s.styleName === style)

describe('mapWatch', () => {
  it('maps the Series page to one model with a spec per case material', async () => {
    const { models, warnings, unmapped } = await run()
    expect(warnings).toEqual([])
    expect(unmapped).toEqual([])
    expect(models.map(m => m.key)).toEqual(['Apple Watch Series 12'])
    const model = models[0].model
    expect(models[0].category).toBe('Apple Watch')
    expect(model.specs.map(s => [s.name, s.price])).toEqual([
      ['Aluminium Case', 369],
      ['Titanium Case', 649],
      ['Ceramic Case', 849],
    ])
    expect(model.specs.every(s => s.appleCare.length === 0)).toBe(true)
  })

  it('derives size and connectivity deltas and case colours', async () => {
    const { models } = await run()
    const [alu, ti, ceramic] = models[0].model.specs
    expect(alu.sizeOptions).toEqual({ '42mm': 0, '46mm': 50 })
    expect(alu.connectivityOptions).toEqual({ GPS: 0, 'GPS + Cellular': 100 })
    expect(alu.colors).toEqual(['Dark Bronze', 'Light Gold', 'Black', 'Space Grey'])
    expect(ti.sizeOptions).toEqual({ '42mm': 0, '46mm': 50 })
    expect(ti.connectivityOptions).toEqual({ 'GPS + Cellular': 0 })
    expect(ti.colors).toEqual(['Radiant Gold', 'Natural'])
    expect(ceramic.connectivityOptions).toEqual({ 'GPS + Cellular': 0 })
    expect(models[0].model.colors).toContain('Night Blue')
  })

  it('lists every band group and style with surcharge, colours and sizes', async () => {
    const { models } = await run()
    const m = models[0]
    const groups = m.model.specs[0].bandOptions?.map(g => [g.material, g.style.map(s => s.styleName)])
    expect(groups).toEqual([
      ['Rubber', ['Solo Loop', 'Sport Band', 'Nike Sport Band']],
      ['Textile', ['Sport Loop', 'Magnetic Link', 'Modern Buckle', 'Braided Solo Loop', 'Nike Sport Loop']],
      ['Stainless Steel', ['Milanese Loop', 'Link Bracelet']],
    ])
    const surcharges = Object.fromEntries(m.model.specs[0].bandOptions!.flatMap(g => g.style.map(s => [s.styleName, s.price])))
    expect(surcharges).toEqual({
      'Solo Loop': 0,
      'Sport Band': 0,
      'Nike Sport Band': 0,
      'Sport Loop': 0,
      'Magnetic Link': 50,
      'Modern Buckle': 150,
      'Braided Solo Loop': 50,
      'Nike Sport Loop': 0,
      'Milanese Loop': 50,
      'Link Bracelet': 250,
    })
    expect(styleOf(m, 'Aluminium Case', 'Textile', 'Magnetic Link')).toEqual({
      styleName: 'Magnetic Link',
      price: 50,
      bandColor: ['Burgundy', 'Midnight', 'Wildflower Blue', 'Camel'],
      bandSizeOptions: ['S/M', 'M/L'],
    })
    expect(styleOf(m, 'Titanium Case', 'Stainless Steel', 'Link Bracelet')).toEqual({
      styleName: 'Link Bracelet',
      price: 250,
      bandColor: ['Radiant Gold', 'Natural'],
    })
  })

  it('restricts Modern Buckle to 42mm and splits Solo Loop sizes by case size', async () => {
    const { models } = await run()
    const buckle = styleOf(models[0], 'Aluminium Case', 'Textile', 'Modern Buckle')
    expect(buckle?.caseSizes).toEqual(['42mm'])
    expect(buckle?.bandSizeOptions).toEqual(['Small', 'Medium', 'Large'])
    expect(buckle?.bandSizesByCase).toBeUndefined()
    const solo = styleOf(models[0], 'Titanium Case', 'Rubber', 'Solo Loop')
    expect(solo?.caseSizes).toBeUndefined()
    expect(solo?.bandSizesByCase).toEqual({ '42mm': range(0, 9), '46mm': range(0, 12) })
    expect(solo?.bandSizeOptions).toEqual(range(0, 12))
    const sport = styleOf(models[0], 'Titanium Case', 'Rubber', 'Sport Band')
    expect(sport?.bandSizesByCase).toBeUndefined()
  })

  it('fetches band data once per case size and sizes once per style and case size', async () => {
    const { fetcher } = await run()
    const selections = fetcher.requested.filter(u => u.includes('/api/band-selection'))
    const sizes = fetcher.requested.filter(u => u.includes('/api/band_sizes'))
    expect(selections).toHaveLength(2)
    expect(sizes).toHaveLength(10 + 9)
    const q = new URL(selections[0]).searchParams
    expect(q.get('dm.watch_cases-dimensionCaseMaterial')).toBe('aluminum')
    expect(q.get('dm.watch_cases-dimensionConnection')).toBe('gps')
    expect(q.get('dm.watch_cases-dimensionColor')).toBe('space_gray')
    expect(new URL(sizes[0]).searchParams.get('dm.watch_bands-dimensionColor')).toBe('burgundy')
  })

  it('reproduces every published case price and the Apple case + band totals', async () => {
    const { models } = await run()
    const published = models[0].published
    expect(published).toHaveLength(8)
    const helpers = makeCatalogueHelpers(catalogueOf(models))
    for (const p of published) {
      expect(helpers.calculatePrice('Apple Watch', models[0].key, p.spec, p.options), p.label).toBe(p.price)
    }
    const total = (spec: string, size: string, connectivity: string, style: string, material: string) =>
      helpers.calculatePrice('Apple Watch', models[0].key, spec, { size, connectivity, band: { material, style, color: '' } })
    expect(total('Aluminium Case', '42mm', 'GPS', 'Magnetic Link', 'Textile')).toBe(419)
    expect(total('Aluminium Case', '42mm', 'GPS', 'Milanese Loop', 'Stainless Steel')).toBe(419)
    expect(total('Aluminium Case', '42mm', 'GPS', 'Sport Band', 'Rubber')).toBe(369)
    expect(total('Titanium Case', '46mm', 'GPS + Cellular', 'Link Bracelet', 'Stainless Steel')).toBe(949)
  })

  it('produces a catalogue the offering rules accept for 42mm only styles', async () => {
    const { models } = await run()
    const { isOffered } = makeCatalogueHelpers(catalogueOf(models))
    const item = (size: string, bandSize: string, style = 'Braided Solo Loop', color = 'Burgundy') => ({
      category: 'Apple Watch',
      model: models[0].key,
      specs: 'Aluminium Case',
      color: 'Black',
      size,
      connectivity: 'GPS',
      band: { material: 'Textile', style, color, size: bandSize },
    })
    expect(isOffered(item('46mm', '12') as never)).toBe(true)
    expect(isOffered(item('42mm', '12') as never)).toBe(false)
    expect(isOffered(item('46mm', 'Small', 'Modern Buckle', 'Camel') as never)).toBe(false)
    expect(isOffered(item('42mm', 'Small', 'Modern Buckle', 'Camel') as never)).toBe(true)
  })

  it('holds back the specs and warns when a surcharge differs between case sizes', async () => {
    const { models, warnings } = await run({
      selection46: body => {
        const b = body as { body: { itemPrices: Record<string, { amount: number }> } }
        b.body.itemPrices.magneticlink.amount += 100
        return b
      },
    })
    expect(models[0].model.specs).toEqual([])
    expect(models[0].published).toHaveLength(8)
    expect(warnings.some(w => w.includes('Magnetic Link surcharge differs by case size'))).toBe(true)
  })

  it('rethrows fetch failures and rejects empty band-selection bodies', async () => {
    await expect(run({ fail: /band_sizes/ })).rejects.toBeInstanceOf(FetchFailedError)
    await expect(run({ fail: /band-selection/ })).rejects.toBeInstanceOf(FetchFailedError)
    await expect(run({ emptySelection: true })).rejects.toBeInstanceOf(MissingDataError)
  })

  it('reports unknown case dimensions as unmapped', async () => {
    const html = page.html.replace(
      '"watch_cases-dimensionCaseSize":"42mm","watch_cases-dimensionCaseMaterial":"ceramic"',
      '"watch_cases-dimensionCaseSize":"42mm","watch_cases-dimensionStrap":"nylon","watch_cases-dimensionCaseMaterial":"ceramic"',
    )
    expect(html).not.toBe(page.html)
    const { unmapped } = await run({}, { url: page.url, html })
    expect(unmapped).toEqual(['Apple Watch Series 12: watch_cases-dimensionStrap — nylon'])
  })

  it('keeps the case prices and warns when the page has no band selection data', async () => {
    const html = page.html.replace('window.pageLevelData.bandSelectionBootstrap =', 'window.pageLevelData.somethingElse =')
    const { models, warnings, fetcher } = await run({}, { url: page.url, html })
    expect(fetcher.requested).toEqual([])
    expect(models[0].model.specs).toEqual([])
    expect(models[0].published).toHaveLength(8)
    expect(warnings.some(w => w.includes('bandSelectionBootstrap'))).toBe(true)
  })
})

describe('mapWatch on live Apple UK pages', () => {
  const ultraUrl = 'https://www.apple.com/uk/shop/buy-watch/apple-watch-ultra/apple-watch-ultra-4-gps-cellular-49mm-titanium-case'
  const ultraBands = JSON.parse(fx('watch-apple-watch-ultra-bands.json')) as Record<string, unknown>

  function servedByPath(responses: Record<string, unknown>): Fetcher & { requested: string[] } {
    const requested: string[] = []
    return {
      requested,
      async text(url: string): Promise<string> {
        throw new FetchFailedError(url, 'text not served')
      },
      async json<T = unknown>(url: string): Promise<T> {
        requested.push(url)
        const hit = responses[url.replace('https://www.apple.com', '')]
        if (hit === undefined) throw new FetchFailedError(url, 'no fixture for this request')
        return hit as T
      },
      get requestCount() {
        return requested.length
      },
    }
  }

  it('maps Ultra, whose cases have no material or connection dimension and whose straps are ungrouped', async () => {
    const result = await mapWatch({ url: ultraUrl, html: fx('watch-apple-watch-ultra.html') }, servedByPath(ultraBands))
    expect(result.warnings).toEqual([])
    expect(result.models.map(m => m.key)).toEqual(['Apple Watch Ultra 4'])
    const [spec] = result.models[0].model.specs
    expect(spec).toMatchObject({ name: 'Titanium Case', price: 749, sizeOptions: { '49mm': 0 } })
    expect(result.models[0].published.every(p => p.spec === 'Titanium Case')).toBe(true)
    expect(spec.connectivityOptions).toBeUndefined()
    expect(spec.bandOptions?.map(g => g.material)).toEqual(['Strap'])
    expect(spec.bandOptions?.[0].style.map(s => s.styleName)).toEqual(['Alpine Loop', 'Trail Loop', 'Ocean Band', 'Titanium Milanese Loop'])
    expect(spec.bandOptions?.[0].style.some(s => s.price > 0)).toBe(true)
  })

  it('names the SE aluminium case with the British spelling', async () => {
    const se: Page = { url: 'https://www.apple.com/uk/shop/buy-watch/apple-watch-se', html: fx('watch-apple-watch-se.html').replace('window.pageLevelData.bandSelectionBootstrap =', 'window.pageLevelData.somethingElse =') }
    const result = await mapWatch(se, servedByPath({}))
    expect(new Set(result.models[0].published.map(p => p.spec))).toEqual(new Set(['Aluminium Case']))
  })

  it('skips Hermès pages with a warning', async () => {
    const url = 'https://www.apple.com/uk/shop/buy-watch/apple-watch-hermes'
    const result = await mapWatch({ url, html: '' }, servedByPath({}))
    expect(result.models).toEqual([])
    expect(result.warnings).toEqual([`${url}: Apple Watch Hermès is not mapped (its product name and case dimensions do not identify it apart from the standard models); skipped`])
  })
})
