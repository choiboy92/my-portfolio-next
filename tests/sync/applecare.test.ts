import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Spec } from '@/lib/catalogue/schema'
import { applyAppleCare, fetchAppleCare, parseProductTitle } from '@/scripts/catalogue/applecare'
import { FetchFailedError, type Fetcher } from '@/scripts/catalogue/http'
import { mapIPad, mapIPhone, parseIPadAccessories } from '@/scripts/catalogue/map-iphone-ipad'
import type { MappedModel, Page } from '@/scripts/catalogue/types'

const fx = (name: string) => readFileSync(`tests/fixtures/apple/${name}`, 'utf8')
const page = (file: string, url: string): Page => ({ url, html: fx(file) })

const iphonePage = page('iphone-iphone-18-pro.html', 'https://www.apple.com/uk/shop/buy-iphone/iphone-18-pro')
const ipadPage = page('ipad-ipad-pro.html', 'https://www.apple.com/uk/shop/buy-ipad/ipad-pro')
const watchPage = page('watch-apple-watch.html', 'https://www.apple.com/uk/shop/buy-watch/apple-watch')
const mbpPage = page('mac-macbook-pro.html', 'https://www.apple.com/uk/shop/buy-mac/macbook-pro')
const mbpConfigPage = page('mac-macbook-pro-14-config-m5max-18-32.html', 'https://www.apple.com/uk/shop/buy-mac/macbook-pro/config')
const mbaPage = page('mac-macbook-air.html', 'https://www.apple.com/uk/shop/buy-mac/macbook-air')
const imacPage = page('mac-imac.html', 'https://www.apple.com/uk/shop/buy-mac/imac')
const miniPage = page('mac-mac-mini.html', 'https://www.apple.com/uk/shop/buy-mac/mac-mini')
const studioPage = page('mac-mac-studio.html', 'https://www.apple.com/uk/shop/buy-mac/mac-studio')
const proledPage = page('mac-macbook-pro-proled-xdr-trimmed.html', 'https://www.apple.com/uk/shop/buy-mac/macbook-pro-proled-xdr')
const neoPage = page('mac-macbook-neo-applecare.html', 'https://www.apple.com/uk/shop/buy-mac/macbook-neo')
const ultraPage = page('watch-apple-watch-ultra-applecare.html', 'https://www.apple.com/uk/shop/buy-watch/apple-watch-ultra')
const sePage = page('watch-apple-watch-se-applecare.html', 'https://www.apple.com/uk/shop/buy-watch/apple-watch-se')

const titlePage = (size: number, family: string, chips?: string) =>
  `<html><head><title>AppleCare+ for ${size}‑inch ${family}${chips ? ` (${chips})` : ''} - Apple (UK)</title></head></html>`

const PLAN_PAGES = ['SD3X3', 'SD433', 'SD3Y3', 'SGLP3', 'SGL83', 'SGNA3', 'SGMV3', 'SGQ03', 'SGPG3', 'SD303', 'SD2V3', 'SD313', 'SD2W3']
const PRODUCT_PAGES: Record<string, string> = {
  'SD423ZM/A': fx('applecare-product-sd3x3zm.html'),
  ...Object.fromEntries(PLAN_PAGES.map(p => [`${p}ZM/A`, fx(`applecare-product-${p.toLowerCase()}zm.html`)])),
}

function fakeFetcher(pages: Record<string, string> = PRODUCT_PAGES, failures: Record<string, number> = {}): Fetcher & { requested: string[] } {
  const requested: string[] = []
  return {
    requested,
    async text(url: string): Promise<string> {
      requested.push(url)
      const part = url.replace('https://www.apple.com/uk/shop/product/', '')
      const html = pages[part]
      if (failures[part] !== undefined) throw new FetchFailedError(url, `HTTP ${failures[part]}`, failures[part])
      if (html === undefined) throw new FetchFailedError(url, 'not served')
      return html
    },
    async json<T = unknown>(url: string): Promise<T> {
      throw new FetchFailedError(url, 'json not served')
    },
    get requestCount() {
      return requested.length
    },
  }
}

const spec = (name: string): Spec => ({ name, price: 1000, appleCare: [] })
const model = (category: MappedModel['category'], key: string, specs: string[], from?: Page): MappedModel => ({
  category,
  key,
  model: { displayName: key, colors: [], specs: specs.map(spec) },
  published: [],
  page: from?.url,
})

const mbp14 = () => model('MacBook', 'MacBook Pro 14"', ['M6 12-Core CPU 12-Core GPU', 'M5 Pro 15-Core CPU 16-Core GPU', 'M5 Max 18-Core CPU 40-Core GPU'], mbpPage)
const mbp16 = () => model('MacBook', 'MacBook Pro 16"', ['M5 Pro 18-Core CPU 20-Core GPU', 'M5 Max 18-Core CPU 40-Core GPU'], mbpPage)
const proled = (size: number) =>
  model('MacBook', `MacBook Pro with PROLED XDR Display ${size}"`, ['M5 Pro 18-Core CPU 20-Core GPU', 'M5 Max 18-Core CPU 40-Core GPU'], proledPage)
const mba13 = () => model('MacBook', 'MacBook Air 13"', ['M5 10-Core CPU 8-Core GPU'], mbaPage)
const mba15 = () => model('MacBook', 'MacBook Air 15"', ['M5 10-Core CPU 10-Core GPU'], mbaPage)
const watch = () => model('Apple Watch', 'Apple Watch Series 12', ['Aluminium Case', 'Titanium Case'], watchPage)

const tiers = (m: MappedModel, specName: string) =>
  m.model.specs.find(s => s.name === specName)?.appleCare.map(t => [t.name, t.price, t.billing, t.partNumber])

const iphoneModels = () => mapIPhone([iphonePage]).models
const ipadModels = () => mapIPad([ipadPage], parseIPadAccessories([ipadPage]), { category: 'iPad', models: {} }).models

describe('fetchAppleCare', () => {
  it('needs no extra requests for iPhone, iPad, Watch and iMac pages', async () => {
    const fetcher = fakeFetcher()
    const source = await fetchAppleCare([iphonePage, ipadPage, watchPage, imacPage, miniPage, studioPage], fetcher)
    expect(fetcher.requested).toEqual([])
    expect(source.rows.map(r => r.wuip)).toEqual([
      'IPHONE18PRO',
      'IPHONE18PROMAX',
      'IPADPRO_11_2025',
      'IPADPRO_13_2025',
      'CS12_APPLEWATCH',
      'IMAC_2026_MAIN',
    ])
  })

  it('reads each MacBook plan product page once to learn its size', async () => {
    const fetcher = fakeFetcher()
    const source = await fetchAppleCare([mbpPage, mbaPage, proledPage], fetcher)
    expect([...fetcher.requested].sort()).toEqual(
      Object.keys(PRODUCT_PAGES)
        .map(p => `https://www.apple.com/uk/shop/product/${p}`)
        .sort(),
    )
    expect(source.products['SD3X3ZM/A']).toEqual({ family: 'MacBook Pro', size: 14, chips: ['M5', 'M5 Pro', 'M5 Max'] })
    expect(source.products['SD433ZM/A']).toEqual({ family: 'MacBook Pro', size: 16, chips: ['M5 Pro', 'M5 Max'] })
    expect(source.products['SGLP3ZM/A']).toEqual({ family: 'MacBook Pro', size: 14, chips: ['M6'] })
    expect(source.products['SGNA3ZM/A']).toEqual({ family: 'MacBook Pro with PROLED XDR', size: 14, chips: [] })
    expect(source.products['SGQ03ZM/A']).toEqual({ family: 'MacBook Pro with PROLED XDR', size: 16, chips: [] })
    expect(source.products['SD303ZM/A']).toEqual({ family: 'MacBook Air', size: 13, chips: ['M5'] })
    expect(source.warnings).toEqual([])
  })

  it('treats a failed product page request as fatal', async () => {
    await expect(fetchAppleCare([mbpPage], fakeFetcher({}))).rejects.toBeInstanceOf(FetchFailedError)
  })

  it('leaves a part unattributed with a warning on a 404 and carries on', async () => {
    const source = await fetchAppleCare([mbpPage], fakeFetcher(PRODUCT_PAGES, { 'SGLP3ZM/A': 404, 'SGL83ZM/A': 410 }))
    expect(source.products['SD3X3ZM/A']).toBeDefined()
    expect(source.warnings).toContain('AppleCare+ plan SGLP3ZM/A: product page not found — tier left unattributed')
    expect(source.warnings).toContain('AppleCare+ plan SGL83ZM/A: product page not found — tier left unattributed')
    const result = applyAppleCare([mbp14()], source)
    expect(tiers(result.models[0], 'M5 Max 18-Core CPU 40-Core GPU')?.length).toBe(2)
  })

  it('leaves the specs empty when the page that would name their size is missing', async () => {
    const source = await fetchAppleCare([mbaPage], fakeFetcher(PRODUCT_PAGES, { 'SD303ZM/A': 404, 'SD2V3ZM/A': 404 }))
    const [a13] = applyAppleCare([mba13()], source).models
    expect(a13.model.specs[0].appleCare).toEqual([])
  })

  it.each([403, 429, 500, 503])('keeps HTTP %i fatal', async status => {
    await expect(fetchAppleCare([mbpPage], fakeFetcher(PRODUCT_PAGES, { 'SD423ZM/A': status }))).rejects.toBeInstanceOf(FetchFailedError)
  })

  it('takes the size from the page title, not a body mention of another size', () => {
    const html = `<html><head><title>AppleCare+ for 16\u2011inch MacBook Pro (M5 Pro/M5 Max)</title></head><body>Also see AppleCare+ for 14-inch MacBook Pro (M5)</body></html>`
    expect(parseProductTitle(html)).toEqual({ family: 'MacBook Pro', size: 16, chips: ['M5 Pro', 'M5 Max'] })
  })

  it('falls back to the first h1 and ignores a body-only mention', () => {
    expect(parseProductTitle('<body><h1>AppleCare+ for 13-inch MacBook Air (M5)</h1></body>')).toEqual({ family: 'MacBook Air', size: 13, chips: ['M5'] })
    expect(parseProductTitle('<title>Apple</title><body><p>AppleCare+ for 14-inch MacBook Pro (M5)</p></body>')).toBeUndefined()
  })

  it('warns instead of silently dropping a malformed plan detail', async () => {
    const html = iphonePage.html
      .replace('"partNumber":"SHNP3ZM/A"', '"partNumber":null')
      .replace('"value":"annually"', '"value":"weekly"')
    const source = await fetchAppleCare([{ url: iphonePage.url, html }], fakeFetcher())
    expect(source.warnings.some(w => w.includes('iPhone 18 Pro') && w.includes('no part number'))).toBe(true)
    expect(source.warnings.some(w => w.includes('unrecognised billing "weekly"'))).toBe(true)
  })

  it('prints AppleCare One prices with two decimals when not whole', async () => {
    const html = iphonePage.html.replaceAll('"rawPrice":16.99', '"rawPrice":16.9')
    const source = await fetchAppleCare([{ url: iphonePage.url, html }], fakeFetcher())
    expect(source.unmapped[0]).toContain('£16.90/mo')
  })

  it('lists AppleCare One once however many pages carry it', async () => {
    const source = await fetchAppleCare([iphonePage, ipadPage, watchPage, imacPage], fakeFetcher())
    expect(source.unmapped).toEqual(['AppleCare One SN7W2ZM/A £16.99/mo (multi-device subscription, not a per-product plan)'])
    expect(source.rows.flatMap(r => r.tiers).some(t => t.partNumber === 'SN7W2ZM/A')).toBe(false)
  })

  it('reads the product title with a non-breaking hyphen', () => {
    expect(parseProductTitle(fx('applecare-product-sd3x3zm.html'))).toEqual({ family: 'MacBook Pro', size: 14, chips: ['M5', 'M5 Pro', 'M5 Max'] })
    expect(parseProductTitle('<title>AppleCare+ for Mac</title>')).toBeUndefined()
  })

  it('reads a product name whose words are joined by non-breaking spaces', () => {
    expect(parseProductTitle(fx('applecare-product-sd433zm.html'))).toEqual({ family: 'MacBook Pro', size: 16, chips: ['M5 Pro', 'M5 Max'] })
    expect(parseProductTitle('<title>AppleCare+ for 16\u2011inch MacBook\u00a0Pro (M5\u00a0Pro/M5\u00a0Max) - Apple (UK)</title>')).toEqual({
      family: 'MacBook Pro',
      size: 16,
      chips: ['M5 Pro', 'M5 Max'],
    })
  })
})

describe('applyAppleCare', () => {
  it('gives each iPhone spec its own monthly then annual tiers', async () => {
    const source = await fetchAppleCare([iphonePage], fakeFetcher())
    const result = applyAppleCare(iphoneModels(), source)
    expect(result.warnings).toEqual([])
    const m = result.models[0]
    expect(tiers(m, 'iPhone 18 Pro')).toEqual([
      ['AppleCare+ with Theft and Loss (Monthly)', 12.99, 'monthly', 'SHNP3ZM/A'],
      ['AppleCare+ with Theft and Loss (Annual)', 129.99, 'annual', 'SHNQ3ZM/A'],
    ])
    expect(tiers(m, 'iPhone 18 Pro Max')).toEqual([
      ['AppleCare+ with Theft and Loss (Monthly)', 12.99, 'monthly', 'SHP43ZM/A'],
      ['AppleCare+ with Theft and Loss (Annual)', 129.99, 'annual', 'SHP53ZM/A'],
    ])
  })

  it('matches iPad Pro specs by size', async () => {
    const source = await fetchAppleCare([ipadPage], fakeFetcher())
    const m = applyAppleCare(ipadModels(), source).models[0]
    expect(tiers(m, '11-inch iPad Pro')).toEqual([
      ['AppleCare+ with Theft and Loss (Monthly)', 9.49, 'monthly', 'SXU72ZM/A'],
      ['AppleCare+ with Theft and Loss (Annual)', 94.99, 'annual', 'SXUG2ZM/A'],
    ])
    expect(tiers(m, '13-inch iPad Pro')).toEqual([
      ['AppleCare+ with Theft and Loss (Monthly)', 10.49, 'monthly', 'SXU82ZM/A'],
      ['AppleCare+ with Theft and Loss (Annual)', 104.99, 'annual', 'SXUJ2ZM/A'],
    ])
  })

  it('gives every Watch spec the Series tiers', async () => {
    const source = await fetchAppleCare([watchPage], fakeFetcher())
    const m = applyAppleCare([watch()], source).models[0]
    const expected = [
      ['AppleCare+ with Theft and Loss (Monthly)', 4.99, 'monthly', 'SH3K3ZM/A'],
      ['AppleCare+ with Theft and Loss (Annual)', 49.99, 'annual', 'SH3F3ZM/A'],
    ]
    expect(tiers(m, 'Aluminium Case')).toEqual(expected)
    expect(tiers(m, 'Titanium Case')).toEqual(expected)
  })

  it('attributes MacBook Pro tiers by the size and chip named on Apple\'s product pages', async () => {
    const source = await fetchAppleCare([mbpPage], fakeFetcher())
    const result = applyAppleCare([mbp14(), mbp16()], source)
    const [m14, m16] = result.models
    expect(tiers(m14, 'M6 12-Core CPU 12-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 9.99, 'monthly', 'SGLP3ZM/A'],
      ['AppleCare+ (Annual)', 99.99, 'annual', 'SGL83ZM/A'],
    ])
    expect(tiers(m14, 'M5 Pro 15-Core CPU 16-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 9.99, 'monthly', 'SD423ZM/A'],
      ['AppleCare+ (Annual)', 99.99, 'annual', 'SD3X3ZM/A'],
    ])
    expect(tiers(m14, 'M5 Max 18-Core CPU 40-Core GPU')).toEqual(tiers(m14, 'M5 Pro 15-Core CPU 16-Core GPU'))
    const sixteen = [
      ['AppleCare+ (Monthly)', 14.99, 'monthly', 'SD433ZM/A'],
      ['AppleCare+ (Annual)', 149.99, 'annual', 'SD3Y3ZM/A'],
    ]
    expect(tiers(m16, 'M5 Pro 18-Core CPU 20-Core GPU')).toEqual(sixteen)
    expect(tiers(m16, 'M5 Max 18-Core CPU 40-Core GPU')).toEqual(sixteen)
    expect(result.warnings).toEqual([])
  })

  it('attributes PROLED XDR tiers by size from their own page, never the standard MacBook Pro plans', async () => {
    const source = await fetchAppleCare([mbpPage, proledPage], fakeFetcher())
    const result = applyAppleCare([proled(14), proled(16), mbp14()], source)
    const [p14, p16, m14] = result.models
    for (const spec of p14.model.specs) {
      expect(tiers(p14, spec.name)).toEqual([
        ['AppleCare+ (Monthly)', 13.99, 'monthly', 'SGNA3ZM/A'],
        ['AppleCare+ (Annual)', 139.99, 'annual', 'SGMV3ZM/A'],
      ])
    }
    for (const spec of p16.model.specs) {
      expect(tiers(p16, spec.name)).toEqual([
        ['AppleCare+ (Monthly)', 15.99, 'monthly', 'SGQ03ZM/A'],
        ['AppleCare+ (Annual)', 159.99, 'annual', 'SGPG3ZM/A'],
      ])
    }
    expect(tiers(m14, 'M5 Pro 15-Core CPU 16-Core GPU')?.map(t => t[3])).toEqual(['SD423ZM/A', 'SD3X3ZM/A'])
    expect(result.warnings).toEqual([])
  })

  it('does not attach a standard MacBook Pro plan to the PROLED XDR Display line', async () => {
    const pages = { ...PRODUCT_PAGES, 'SGNA3ZM/A': titlePage(14, 'MacBook Pro'), 'SGMV3ZM/A': titlePage(14, 'MacBook Pro') }
    const source = await fetchAppleCare([proledPage], fakeFetcher(pages))
    const [p14] = applyAppleCare([proled(14)], source).models
    for (const spec of p14.model.specs) expect(spec.appleCare).toEqual([])
  })

  it('attributes rows to every page that lists the same device', async () => {
    const copy = page('mac-macbook-pro.html', 'https://www.apple.com/uk/shop/buy-mac/macbook-pro-copy')
    const source = await fetchAppleCare([mbpPage, copy], fakeFetcher())
    const fromCopy = model('MacBook', 'MacBook Pro 14"', ['M5 Pro 15-Core CPU 16-Core GPU'], copy)
    const [original, duplicate] = applyAppleCare([mbp14(), fromCopy], source).models
    expect(tiers(duplicate, 'M5 Pro 15-Core CPU 16-Core GPU')).toEqual(tiers(original, 'M5 Pro 15-Core CPU 16-Core GPU'))
    expect(tiers(duplicate, 'M5 Pro 15-Core CPU 16-Core GPU')?.map(t => t[3])).toEqual(['SD423ZM/A', 'SD3X3ZM/A'])
  })

  it('does not attach a plan to a chip its product page does not list', async () => {
    const source = await fetchAppleCare([mbpPage], fakeFetcher())
    const m14 = model('MacBook', 'MacBook Pro 14"', ['M6 Pro 15-Core CPU 16-Core GPU'], mbpPage)
    const result = applyAppleCare([m14], source)
    expect(result.models[0].model.specs[0].appleCare).toEqual([])
    expect(result.warnings).toContain(
      'MacBook Pro 14" / M6 Pro 15-Core CPU 16-Core GPU: no AppleCare+ plan could be attributed to this size and chip; AppleCare+ left empty',
    )
  })

  it('does not attribute a model to rows from another page', async () => {
    const source = await fetchAppleCare([mbpPage], fakeFetcher())
    const result = applyAppleCare([model('MacBook', 'MacBook Pro 14"', ['M5 Pro 15-Core CPU 16-Core GPU'], proledPage)], source)
    expect(result.models[0].model.specs[0].appleCare).toEqual([])
    expect(result.warnings).toEqual(['MacBook Pro 14" / M5 Pro 15-Core CPU 16-Core GPU: no AppleCare+ data from Apple; AppleCare+ left empty'])
  })

  it('leaves a size empty and warns when several plans match it', async () => {
    const pages = { ...PRODUCT_PAGES, 'SGLP3ZM/A': titlePage(14, 'MacBook Pro', 'M5 Pro'), 'SGL83ZM/A': titlePage(14, 'MacBook Pro', 'M5 Pro') }
    const source = await fetchAppleCare([mbpPage], fakeFetcher(pages))
    const result = applyAppleCare([model('MacBook', 'MacBook Pro 14"', ['M5 Pro 15-Core CPU 16-Core GPU', 'M5 Max 18-Core CPU 40-Core GPU'], mbpPage)], source)
    expect(tiers(result.models[0], 'M5 Pro 15-Core CPU 16-Core GPU')).toEqual([])
    expect(tiers(result.models[0], 'M5 Max 18-Core CPU 40-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 9.99, 'monthly', 'SD423ZM/A'],
      ['AppleCare+ (Annual)', 99.99, 'annual', 'SD3X3ZM/A'],
    ])
    expect(result.warnings.join('\n')).toContain('nothing says which applies')
  })

  it('attributes MacBook Air 13 and 15 inch tiers only from the product pages', async () => {
    const source = await fetchAppleCare([mbaPage], fakeFetcher())
    const [a13, a15] = applyAppleCare([mba13(), mba15()], source).models
    expect(tiers(a13, 'M5 10-Core CPU 8-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 6.99, 'monthly', 'SD303ZM/A'],
      ['AppleCare+ (Annual)', 69.99, 'annual', 'SD2V3ZM/A'],
    ])
    expect(tiers(a15, 'M5 10-Core CPU 10-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 7.99, 'monthly', 'SD313ZM/A'],
      ['AppleCare+ (Annual)', 79.99, 'annual', 'SD2W3ZM/A'],
    ])
  })

  it('leaves MacBook Air empty with a warning when the product pages do not name a size', async () => {
    const blank = '<html><title>AppleCare+ for Mac</title></html>'
    const source = await fetchAppleCare([mbaPage], fakeFetcher({ 'SD303ZM/A': blank, 'SD313ZM/A': blank, 'SD2V3ZM/A': blank, 'SD2W3ZM/A': blank }))
    const result = applyAppleCare([mba13(), mba15()], source)
    for (const m of result.models) expect(m.model.specs[0].appleCare).toEqual([])
    expect(result.warnings.filter(w => w.startsWith('MacBook Air'))).toHaveLength(2)
  })

  it('maps an unsized Mac from the single plan row on its own page', async () => {
    const source = await fetchAppleCare([imacPage, neoPage], fakeFetcher())
    const [imac, neo] = applyAppleCare(
      [model('MacBook', 'iMac', ['M6 12-Core CPU 12-Core GPU'], imacPage), model('MacBook', 'MacBook Neo', ['6-Core CPU 5-Core GPU'], neoPage)],
      source,
    ).models
    expect(tiers(imac, 'M6 12-Core CPU 12-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 6.49, 'monthly', 'SGJU3ZM/A'],
      ['AppleCare+ (Annual)', 64.99, 'annual', 'SGJY3ZM/A'],
    ])
    expect(tiers(neo, '6-Core CPU 5-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 4.99, 'monthly', 'SD6P3ZM/A'],
      ['AppleCare+ (Annual)', 49.99, 'annual', 'SD6M3ZM/A'],
    ])
  })

  it('maps Apple Watch Ultra and SE from the plan row on their own page', async () => {
    const source = await fetchAppleCare([watchPage, ultraPage, sePage], fakeFetcher())
    const result = applyAppleCare(
      [model('Apple Watch', 'Apple Watch Ultra 4', ['Titanium Case'], ultraPage), model('Apple Watch', 'Apple Watch SE 3', ['Aluminium Case'], sePage)],
      source,
    )
    const [ultra, se] = result.models
    expect(tiers(ultra, 'Titanium Case')).toEqual([
      ['AppleCare+ with Theft and Loss (Monthly)', 5.99, 'monthly', 'SH403ZM/A'],
      ['AppleCare+ with Theft and Loss (Annual)', 59.99, 'annual', 'SH3V3ZM/A'],
    ])
    expect(tiers(se, 'Aluminium Case')).toEqual([
      ['AppleCare+ with Theft and Loss (Monthly)', 2.99, 'monthly', 'SXJR2ZM/A'],
      ['AppleCare+ with Theft and Loss (Annual)', 29.99, 'annual', 'SXJV2ZM/A'],
    ])
    expect(result.warnings).toEqual([])
  })

  it('gives a model with no AppleCare data an empty list and a warning', async () => {
    const source = await fetchAppleCare([miniPage, studioPage, ipadPage], fakeFetcher())
    const models = [
      model('MacBook', 'Mac mini', ['M5 Pro 15-Core CPU 16-Core GPU'], miniPage),
      model('MacBook', 'Mac Studio', ['M5 Ultra 30-Core CPU 64-Core GPU'], studioPage),
      model('iPad', 'iPad Air', ['11-inch iPad Air']),
    ]
    const result = applyAppleCare(models, source)
    for (const m of result.models) expect(m.model.specs[0].appleCare).toEqual([])
    expect(result.warnings).toEqual([
      'Mac mini / M5 Pro 15-Core CPU 16-Core GPU: no AppleCare+ data from Apple; AppleCare+ left empty',
      'Mac Studio / M5 Ultra 30-Core CPU 64-Core GPU: no AppleCare+ data from Apple; AppleCare+ left empty',
      'iPad Air / 11-inch iPad Air: no AppleCare+ data from Apple; AppleCare+ left empty',
    ])
  })

  it('returns AppleCare One as unmapped and gives unique tier names per spec', async () => {
    const source = await fetchAppleCare([iphonePage, watchPage, mbaPage], fakeFetcher())
    const result = applyAppleCare([...iphoneModels(), watch(), mba13(), mba15()], source)
    expect(result.unmapped).toEqual(['AppleCare One SN7W2ZM/A £16.99/mo (multi-device subscription, not a per-product plan)'])
    for (const m of result.models) {
      for (const s of m.model.specs) expect(new Set(s.appleCare.map(t => t.name)).size).toBe(s.appleCare.length)
    }
  })

  it('does not mutate its input', async () => {
    const source = await fetchAppleCare([watchPage], fakeFetcher())
    const input = [watch()]
    const before = JSON.stringify(input)
    const result = applyAppleCare(input, source)
    expect(JSON.stringify(input)).toBe(before)
    expect(result.models[0]).not.toBe(input[0])
    expect(result.models[0].model.specs[0].appleCare).toHaveLength(2)
  })

  it('reads a configured MacBook Pro page like any other row', async () => {
    const source = await fetchAppleCare([mbpConfigPage], fakeFetcher())
    expect(source.rows[0].tiers.map(t => t.partNumber)).toEqual(['SD423ZM/A', 'SD3X3ZM/A'])
  })
})
