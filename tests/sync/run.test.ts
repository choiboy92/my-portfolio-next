import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCatalogue, type Category, type CategoryKey } from '@/lib/catalogue/schema'
import { LANDING_PAGES } from '@/scripts/catalogue/discover'
import { extractKeyedJson, MissingDataError } from '@/scripts/catalogue/extract'
import { FetchFailedError, type Fetcher } from '@/scripts/catalogue/http'
import { buildMacModels } from '@/scripts/catalogue/map-mac'
import { carryOverColours, runSync } from '@/scripts/catalogue/run'
import { testCatalogue } from '../fixtures/test-catalogue'

const fx = (name: string) => readFileSync(`tests/fixtures/apple/${name}`, 'utf8')
const SHOP = 'https://www.apple.com/uk/shop'

type Product = { dimensions: Record<string, string> }
type Bootstrap = { products: Product[] }
type SavedRequest = { requestUrl: string; response: unknown }
type SavedWatch = { response: { body: { itemPrices: Record<string, { amount: number }> } } }

function macBookAir15(): string {
  const url = `${SHOP}/buy-mac/macbook-air`
  const html = fx('mac-macbook-air.html')
  const bootstrap = structuredClone(extractKeyedJson(html, url, 'productSelectionData')) as Bootstrap
  bootstrap.products = bootstrap.products.filter(p => p.dimensions['chassis-dimensionScreensize'] === '15inch')
  return `<script>window.SUBSET = { productSelectionData: ${JSON.stringify(bootstrap)} }</script>${html}`
}

const LANDING_FILES: Record<CategoryKey, string> = {
  iPhone: 'landing-buy-iphone.html',
  iPad: 'landing-buy-ipad.html',
  MacBook: 'landing-buy-mac.html',
  'Apple Watch': 'landing-buy-watch.html',
}

const titlePage = (size: number, family: string, chips: string) =>
  `<html><head><title>AppleCare+ for ${size}‑inch ${family} (${chips}) - Apple (UK)</title></head></html>`

function basePages(): Map<string, string> {
  const pages = new Map<string, string>()
  for (const [category, file] of Object.entries(LANDING_FILES)) pages.set(LANDING_PAGES[category as CategoryKey], fx(file))
  pages.set(`${SHOP}/buy-iphone/iphone-18-pro`, fx('iphone-iphone-18-pro.html'))
  pages.set(`${SHOP}/buy-ipad/ipad-pro`, fx('ipad-ipad-pro.html'))
  pages.set(`${SHOP}/buy-mac/macbook-air`, macBookAir15())
  pages.set(`${SHOP}/buy-watch/apple-watch`, fx('watch-apple-watch.html'))
  pages.set(`${SHOP}/product/SD313ZM/A`, titlePage(15, 'MacBook Air', 'M5'))
  pages.set(`${SHOP}/product/SD2W3ZM/A`, titlePage(15, 'MacBook Air', 'M5'))
  return pages
}

function macKey(url: string): string {
  const q = new URL(url, 'https://www.apple.com').searchParams
  const uv = [...q].filter(([k]) => k.startsWith('uv.')).map(([k, v]) => `${k}=${v}`)
  return [q.get('collection'), q.get('sv.chassis-dimensionScreensize') ?? '', ...uv].join('|')
}

const macUpdates = new Map(
  ['mac-macbook-air-15-update-10-10.json', 'mac-macbook-air-15-update-memory-24gb.json'].map(file => {
    const saved = JSON.parse(fx(file)) as SavedRequest
    return [macKey(saved.requestUrl), saved.response]
  }),
)

const watchSaved = (file: string) => JSON.parse(fx(file)) as SavedWatch
const alu42 = watchSaved('watch-apple-watch-bands-aluminum-42mm-gps.json')
const ti46 = watchSaved('watch-apple-watch-bands-titanium-46mm-gpscell.json')
const magneticLink42 = watchSaved('watch-apple-watch-band-sizes-aluminum-42mm-gps-magneticlink.json')
const link46 = watchSaved('watch-apple-watch-band-sizes-titanium-46mm-gpscell-link.json')

function shifted(file: SavedWatch, delta: number): unknown {
  const response = structuredClone(file.response)
  for (const price of Object.values(response.body.itemPrices)) price.amount += delta
  return response
}

function bandSizes(): unknown {
  return { head: { status: '200' }, body: { options: [{ key: 'onesize', text: 'One Size (Fits Most)' }], prices: {} } }
}

function watchJson(url: string): unknown {
  const q = new URL(url).searchParams
  const caseSize = q.get('dm.watch_cases-dimensionCaseSize')
  const style = q.get('dm.watch_bands-dimensionBandStyle')
  if (url.includes('/api/band-selection')) return caseSize === '42mm' ? alu42.response : shifted(ti46, 419 - 699)
  if (url.includes('/api/band_sizes')) {
    if (style === 'magneticlink' && caseSize === '42mm') return magneticLink42.response
    if (style === 'link' && caseSize === '46mm') return link46.response
    return bandSizes()
  }
  return undefined
}

function landingFor(url: string): string | undefined {
  for (const [category, landing] of Object.entries(LANDING_PAGES)) {
    if (url.startsWith(`${landing}/`)) return fx(LANDING_FILES[category as CategoryKey])
  }
  return undefined
}

function fakeFetcher(pages: Map<string, string> = basePages()): Fetcher & { requested: string[] } {
  const requested: string[] = []
  return {
    requested,
    async text(url: string): Promise<string> {
      requested.push(url)
      const html = pages.get(url)
      if (html !== undefined) return html
      if (url.startsWith(`${SHOP}/product/`)) throw new FetchFailedError(url, 'HTTP 404', 404)
      const redirected = landingFor(url)
      if (redirected !== undefined) return redirected
      throw new FetchFailedError(url, 'no fixture for this request')
    },
    async json<T = unknown>(url: string): Promise<T> {
      requested.push(url)
      const hit = url.includes('/api/cto/update-config') ? macUpdates.get(macKey(url)) : watchJson(url)
      if (hit === undefined) throw new FetchFailedError(url, 'no fixture for this request')
      return hit as T
    },
    get requestCount() {
      return requested.length
    },
  }
}

const DATE = '2026-11-03'

describe('runSync', () => {
  it('builds a valid catalogue from the Apple fixtures', async () => {
    const fetcher = fakeFetcher()
    const result = await runSync({ fetcher, previous: testCatalogue, bootstrap: true, date: DATE })
    expect(() => parseCatalogue(result.catalogue)).not.toThrow()
    expect(result.changed).toBe(true)
    expect(Object.keys(result.catalogue.categories.iPhone.models)).toEqual(['iPhone 18 Pro & Pro Max'])
    expect(Object.keys(result.catalogue.categories.iPad.models)).toContain('iPad Pro')
    expect(Object.keys(result.catalogue.categories.MacBook.models)).toEqual(['MacBook Air 15"'])
    expect(Object.keys(result.catalogue.categories['Apple Watch'].models)).toEqual(['Apple Watch Series 12'])
    expect(result.summary).toContain(`${SHOP}/buy-iphone/iphone-air: Apple did not serve a buy page (redirected away); skipped`)
    expect(result.summary).toContain(`- Requests: ${fetcher.requested.length}`)
    expect(result.summary).toContain(`- Date: ${DATE}`)
  })

  it('reports no change when run again on its own output', async () => {
    const first = await runSync({ fetcher: fakeFetcher(), previous: testCatalogue, bootstrap: true, date: DATE })
    const second = await runSync({ fetcher: fakeFetcher(), previous: first.catalogue, bootstrap: false, date: DATE })
    expect(second.changed).toBe(false)
    expect(second.catalogue).toEqual(first.catalogue)
  })

  it('rejects with MissingDataError when the iPhone page lacks its data blob', async () => {
    const pages = basePages()
    const url = `${SHOP}/buy-iphone/iphone-18-pro`
    const html = pages.get(url)!
    const head = html.slice(0, html.indexOf('</head>'))
    pages.set(url, `${head}</head><body></body></html>`)
    await expect(runSync({ fetcher: fakeFetcher(pages), previous: testCatalogue, bootstrap: true, date: DATE })).rejects.toBeInstanceOf(MissingDataError)
  })
})

describe('carryOverColours', () => {
  const url = `${SHOP}/buy-mac/mac-mini`
  const mini = () => buildMacModels(extractKeyedJson(fx('mac-mac-mini.html'), url, 'productSelectionData'), {}, url)
  const previousWith = (colors: string[]): Category => ({
    category: 'MacBook',
    appleCareAvailable: true,
    models: { 'Mac mini': { displayName: 'Mac mini', colors, specs: [] } },
  })

  it('keeps the last-merged colours when Apple publishes none for a model', () => {
    const result = mini()
    expect(result.models[0].model.colors).toEqual([])
    const out = carryOverColours(result, previousWith(['Silver']))
    expect(out.models[0].model.colors).toEqual(['Silver'])
    expect(out.warnings).toContain('Mac mini: Apple publishes no colour; kept the last-merged colours (Silver)')
  })

  it('warns when there are no colours to carry over', () => {
    const out = carryOverColours(mini(), previousWith([]))
    expect(out.models[0].model.colors).toEqual([])
    expect(out.warnings).toContain('Mac mini: Apple publishes no colour and there are no last-merged colours to keep')
  })
})
