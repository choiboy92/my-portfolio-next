import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { discoverProductUrls, isBuyPage, LANDING_PAGES } from '@/scripts/catalogue/discover'
import { MissingDataError } from '@/scripts/catalogue/extract'
import type { CategoryKey } from '@/lib/catalogue/schema'

const FILE: Record<CategoryKey, string> = {
  iPhone: 'iphone',
  iPad: 'ipad',
  MacBook: 'mac',
  'Apple Watch': 'watch',
}
const SEGMENT = FILE

const page = (name: string, url = 'https://example.test/') => ({
  url,
  html: readFileSync(`tests/fixtures/apple/${name}`, 'utf8'),
})
const A = 'https://www.apple.com/uk/shop'

const expected: Record<CategoryKey, string[]> = {
  iPhone: ['iphone-duo', 'iphone-18-pro', 'iphone-air', 'iphone-17', 'iphone-17e', 'iphone-16'].map(
    (s) => `${A}/buy-iphone/${s}`,
  ),
  iPad: ['ipad-pro', 'ipad-air', 'ipad', 'ipad-mini', 'ipad-10-2'].map((s) => `${A}/buy-ipad/${s}`),
  MacBook: [
    'macbook-neo',
    'macbook-air',
    'macbook-pro',
    'macbook-pro-proled-xdr',
    'imac',
    'mac-mini',
    'mac-studio',
  ].map((s) => `${A}/buy-mac/${s}`),
  'Apple Watch': [
    'apple-watch',
    'apple-watch-ultra/apple-watch-ultra-4-gps-cellular-49mm-titanium-case',
    'apple-watch-se',
    'apple-watch-hermes',
    'apple-watch-hermes-ultra/apple-watch-herm%C3%A8s-ultra-4-gps-cellular-49mm-titanium-case',
  ].map((s) => `${A}/buy-watch/${s}`),
}

describe('LANDING_PAGES', () => {
  it('has the four buy URLs', () => {
    expect(LANDING_PAGES.iPhone).toBe(`${A}/buy-iphone`)
    expect(LANDING_PAGES['Apple Watch']).toBe(`${A}/buy-watch`)
  })
})

describe('discoverProductUrls', () => {
  it.each(Object.keys(expected) as CategoryKey[])('discovers %s products', (cat) => {
    expect(discoverProductUrls(cat, page(`landing-buy-${FILE[cat]}.html`))).toEqual(expected[cat])
  })

  it('excludes accessories, refurbished, displays and other links', () => {
    for (const cat of Object.keys(expected) as CategoryKey[]) {
      const urls = discoverProductUrls(cat, page(`landing-buy-${FILE[cat]}.html`))
      for (const u of urls) {
        expect(u).not.toMatch(/accessories|refurbished|studio-display|browse|compare/)
        expect(u.startsWith(`${A}/buy-${SEGMENT[cat]}/`)).toBe(true)
      }
    }
  })

  it('throws on an empty page', () => {
    expect(() =>
      discoverProductUrls('MacBook', { url: 'https://example.test/', html: '<html></html>' }),
    ).toThrow(MissingDataError)
  })
})

describe('isBuyPage', () => {
  it('is false for a landing page canonical', () => {
    expect(isBuyPage(page('landing-buy-iphone.html'))).toBe(false)
  })

  it('is true for product pages', () => {
    expect(isBuyPage(page('iphone-iphone-18-pro.html'))).toBe(true)
    expect(isBuyPage(page('watch-apple-watch.html'))).toBe(true)
  })

  it('is false for a marketing redirect', () => {
    const html = '<link rel="canonical" href="https://www.apple.com/uk/ipad/" />'
    expect(isBuyPage({ url: 'x', html })).toBe(false)
  })

  it('is false without a canonical', () => {
    expect(isBuyPage({ url: 'x', html: '<html></html>' })).toBe(false)
  })
})
