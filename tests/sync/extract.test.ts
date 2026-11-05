import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  extractAnalyticsProducts,
  extractKeyedJson,
  extractLdJsonOffers,
  extractWindowJson,
  MissingDataError,
  normaliseLabel,
  parsePounds,
} from '@/scripts/catalogue/extract'

const fx = (name: string) => readFileSync(`tests/fixtures/apple/${name}`, 'utf8')
const URL = 'https://example.test/page'

describe('extractAnalyticsProducts', () => {
  it('reads the iPhone products', () => {
    const products = extractAnalyticsProducts(fx('iphone-iphone-18-pro.html'), URL)
    expect(products).toHaveLength(32)
    expect(products[0]).toMatchObject({
      sku: 'MJY04',
      partNumber: 'MJY04QN/A',
      price: 1899,
    })
    expect(products[0].name).toMatch(/^iPhone\s18\sPro\sMax\s1TB/)
  })

  it('reads the iPad products', () => {
    const products = extractAnalyticsProducts(fx('ipad-ipad-pro.html'), URL)
    expect(products[0]).toMatchObject({ sku: 'MDWU4', partNumber: 'MDWU4KN/A', price: 2299 })
  })

  it('reads the Mac config page product', () => {
    const products = extractAnalyticsProducts(fx('mac-macbook-pro-14-config-m5max-18-32.html'), URL)
    expect(products).toEqual([
      expect.objectContaining({ sku: 'MGDU4', partNumber: 'MGDU4B/A', price: 4099 }),
    ])
  })

  it('throws when absent', () => {
    expect(() => extractAnalyticsProducts('<html></html>', URL)).toThrow(MissingDataError)
  })
})

describe('extractLdJsonOffers', () => {
  it('returns sku and price for a list of plain offers', () => {
    expect(extractLdJsonOffers(fx('mac-macbook-pro-14-config-m5max-18-32.html'), URL)).toEqual([
      { sku: 'MGDU4B/A', price: 4099 },
    ])
  })

  it('skips aggregate offers that have no sku', () => {
    expect(() => extractLdJsonOffers(fx('iphone-iphone-18-pro.html'), URL)).toThrow(MissingDataError)
  })

  it('handles a single offer object', () => {
    const html =
      '<script type="application/ld+json">{"offers":{"@type":"Offer","sku":"A1","price":"£1,199.50"}}</script>'
    expect(extractLdJsonOffers(html, URL)).toEqual([{ sku: 'A1', price: 1199.5 }])
  })
})

describe('extractWindowJson', () => {
  it('parses a window assignment of pure JSON', () => {
    const html = '<script>window.FOO = {"a":[1,2],"b":{"c":"d"}};\nwindow.BAR = 1</script>'
    expect(extractWindowJson(html, URL, 'FOO')).toEqual({ a: [1, 2], b: { c: 'd' } })
  })

  it('survives braces and escaped quotes inside string literals', () => {
    const html = '<script>window.FOO = {"a":"x } y \\" { z","b":2}; var q = {}</script>'
    expect(extractWindowJson(html, URL, 'FOO')).toEqual({ a: 'x } y " { z', b: 2 })
  })

  it('throws MissingDataError naming the url and blob', () => {
    expect(() => extractWindowJson('<html></html>', URL, 'FOO')).toThrow(MissingDataError)
    expect(() => extractWindowJson('<html></html>', URL, 'FOO')).toThrow(/FOO.*example\.test\/page/)
  })

  it('throws when the assignment is not JSON', () => {
    expect(() => extractWindowJson('window.FOO = {bare: 1}', URL, 'FOO')).toThrow(MissingDataError)
  })
})

describe('extractKeyedJson', () => {
  it.each([
    ['iphone-iphone-18-pro.html', 'productSelectionData'],
    ['ipad-ipad-pro.html', 'productSelectionData'],
    ['mac-mac-mini.html', 'productSelectionData'],
    ['mac-macbook-pro.html', 'productSelectionData'],
    ['watch-apple-watch.html', 'productSelectionData'],
    ['iphone-iphone-18-pro.html', 'appleCareData'],
    ['watch-apple-watch.html', 'appleCareData'],
  ])('reads %s %s', (file, key) => {
    const data = extractKeyedJson(fx(file), URL, key)
    expect(typeof data).toBe('object')
    expect(data).not.toBeNull()
  })

  it('reads iPhone products with part numbers', () => {
    const data = extractKeyedJson(fx('iphone-iphone-18-pro.html'), URL, 'productSelectionData') as {
      products: { partNumber: string }[]
    }
    expect(data.products.some((p) => p.partNumber === 'MJY04QN/A')).toBe(true)
  })

  it('throws when the key is absent', () => {
    expect(() => extractKeyedJson('<html></html>', URL, 'nope')).toThrow(MissingDataError)
  })
})

describe('parsePounds', () => {
  it('parses formatted pounds', () => {
    expect(parsePounds('£1,199.00')).toBe(1199)
    expect(parsePounds('£12.50')).toBe(12.5)
    expect(parsePounds(519)).toBe(519)
  })
})

describe('normaliseLabel', () => {
  it('normalises dashes and whitespace', () => {
    expect(normaliseLabel('Wi‑Fi + Cellular')).toBe('Wi-Fi + Cellular')
    expect(normaliseLabel('  a – b\n c ')).toBe('a - b c')
  })
})
