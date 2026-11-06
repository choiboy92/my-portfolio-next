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

const titlePage = (size: number, family: string, chips?: string) =>
  `<html><head><title>AppleCare+ for ${size}‑inch ${family}${chips ? ` (${chips})` : ''} - Apple (UK)</title></head></html>`

const PRODUCT_PAGES: Record<string, string> = {
  'SD423ZM/A': fx('applecare-product-sd3x3zm.html'),
  'SD3X3ZM/A': fx('applecare-product-sd3x3zm.html'),
  'SD433ZM/A': titlePage(16, 'MacBook Pro', 'M5 Pro/M5 Max'),
  'SD3Y3ZM/A': titlePage(16, 'MacBook Pro', 'M5 Pro/M5 Max'),
  'SGLP3ZM/A': '<html><head><title>AppleCare+ for Mac</title></head></html>',
  'SGL83ZM/A': '<html><head><title>AppleCare+ for Mac</title></head></html>',
  'SD303ZM/A': titlePage(13, 'MacBook Air', 'M5'),
  'SD2V3ZM/A': titlePage(13, 'MacBook Air', 'M5'),
  'SD313ZM/A': titlePage(15, 'MacBook Air', 'M5'),
  'SD2W3ZM/A': titlePage(15, 'MacBook Air', 'M5'),
}

function fakeFetcher(pages: Record<string, string> = PRODUCT_PAGES): Fetcher & { requested: string[] } {
  const requested: string[] = []
  return {
    requested,
    async text(url: string): Promise<string> {
      requested.push(url)
      const part = url.replace('https://www.apple.com/uk/shop/product/', '')
      const html = pages[part]
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
const model = (category: MappedModel['category'], key: string, specs: string[]): MappedModel => ({
  category,
  key,
  model: { displayName: key, colors: [], specs: specs.map(spec) },
  published: [],
})

const mbp14 = () => model('MacBook', 'MacBook Pro 14"', ['M5 Pro 15-Core CPU 16-Core GPU', 'M5 Max 18-Core CPU 40-Core GPU'])
const mbp16 = () => model('MacBook', 'MacBook Pro 16"', ['M5 Max 18-Core CPU 40-Core GPU'])
const mba13 = () => model('MacBook', 'MacBook Air 13"', ['10-Core CPU 8-Core GPU'])
const mba15 = () => model('MacBook', 'MacBook Air 15"', ['10-Core CPU 10-Core GPU'])
const watch = () => model('Apple Watch', 'Apple Watch Series 12', ['Aluminium Case', 'Titanium Case'])

const tiers = (m: MappedModel, specName: string) =>
  m.model.specs.find(s => s.name === specName)?.appleCare.map(t => [t.name, t.price, t.billing, t.partNumber])

const iphoneModels = () => mapIPhone([iphonePage]).models
const ipadModels = () => mapIPad([ipadPage], parseIPadAccessories([ipadPage]), { category: 'iPad', appleCareAvailable: true, models: {} }).models

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
    const source = await fetchAppleCare([mbpPage, mbaPage], fetcher)
    expect([...fetcher.requested].sort()).toEqual(
      Object.keys(PRODUCT_PAGES)
        .map(p => `https://www.apple.com/uk/shop/product/${p}`)
        .sort(),
    )
    expect(source.products['SD3X3ZM/A']).toEqual({ family: 'MacBook Pro', size: 14, chips: ['M5', 'M5 Pro', 'M5 Max'] })
    expect(source.products['SGLP3ZM/A']).toBeUndefined()
    expect(source.warnings.join()).toContain('SGLP3ZM/A')
    expect(source.warnings.join()).toContain('SGL83ZM/A')
  })

  it('treats a failed product page request as fatal', async () => {
    await expect(fetchAppleCare([mbpPage], fakeFetcher({}))).rejects.toBeInstanceOf(FetchFailedError)
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

  it('attributes MacBook Pro tiers by the size named on Apple\'s product page', async () => {
    const source = await fetchAppleCare([mbpPage], fakeFetcher())
    const result = applyAppleCare([mbp14(), mbp16()], source)
    const [m14, m16] = result.models
    expect(tiers(m14, 'M5 Pro 15-Core CPU 16-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 9.99, 'monthly', 'SD423ZM/A'],
      ['AppleCare+ (Annual)', 99.99, 'annual', 'SD3X3ZM/A'],
    ])
    expect(tiers(m14, 'M5 Max 18-Core CPU 40-Core GPU')).toEqual(tiers(m14, 'M5 Pro 15-Core CPU 16-Core GPU'))
    expect(tiers(m16, 'M5 Max 18-Core CPU 40-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 14.99, 'monthly', 'SD433ZM/A'],
      ['AppleCare+ (Annual)', 149.99, 'annual', 'SD3Y3ZM/A'],
    ])
    expect(result.warnings.join('\n')).toContain('SGLP3ZM/A')
    expect(result.warnings.join('\n')).toContain('SGL83ZM/A')
  })

  it('does not attach a plan to a chip its product page does not list', async () => {
    const source = await fetchAppleCare([mbpPage], fakeFetcher())
    const m14 = model('MacBook', 'MacBook Pro 14"', ['M6 Pro 15-Core CPU 16-Core GPU'])
    const result = applyAppleCare([m14], source)
    expect(result.models[0].model.specs[0].appleCare).toEqual([])
    expect(result.warnings).toContain(
      'MacBook Pro 14" / M6 Pro 15-Core CPU 16-Core GPU: no AppleCare+ plan could be attributed to this size and chip; AppleCare+ left empty',
    )
  })

  it('leaves a size empty and warns when several plans match it', async () => {
    const pages = { ...PRODUCT_PAGES, 'SGLP3ZM/A': titlePage(14, 'MacBook Pro', 'M5 Pro'), 'SGL83ZM/A': titlePage(14, 'MacBook Pro', 'M5 Pro') }
    const source = await fetchAppleCare([mbpPage], fakeFetcher(pages))
    const result = applyAppleCare([mbp14()], source)
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
    expect(tiers(a13, '10-Core CPU 8-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 6.99, 'monthly', 'SD303ZM/A'],
      ['AppleCare+ (Annual)', 69.99, 'annual', 'SD2V3ZM/A'],
    ])
    expect(tiers(a15, '10-Core CPU 10-Core GPU')).toEqual([
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

  it('maps iMac from its single plan row', async () => {
    const source = await fetchAppleCare([imacPage], fakeFetcher())
    const m = applyAppleCare([model('MacBook', 'iMac', ['12-Core CPU 12-Core GPU'])], source).models[0]
    expect(tiers(m, '12-Core CPU 12-Core GPU')).toEqual([
      ['AppleCare+ (Monthly)', 6.49, 'monthly', 'SGJU3ZM/A'],
      ['AppleCare+ (Annual)', 64.99, 'annual', 'SGJY3ZM/A'],
    ])
  })

  it('gives a model with no AppleCare data an empty list and a warning', async () => {
    const source = await fetchAppleCare([miniPage, studioPage, ipadPage], fakeFetcher())
    const models = [
      model('MacBook', 'Mac mini', ['M5 Pro 15-Core CPU 16-Core GPU']),
      model('MacBook', 'Mac Studio', ['M5 Ultra 30-Core CPU 64-Core GPU']),
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
