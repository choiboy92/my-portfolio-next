import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  amountOf,
  displayHeader,
  extractAnalyticsProducts,
  extractKeyedJson,
  extractWindowJson,
  MissingDataError,
  normaliseLabel,
  parsePounds,
  productName,
  readProductSelection,
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

describe('productName', () => {
  it('reads the ld+json Product name and ignores other types', () => {
    expect(productName(fx('watch-apple-watch.html'))).toBe('Apple Watch Series 12')
    expect(productName('<script type="application/ld+json">{"@type":"BreadcrumbList","name":"Shop"}</script>')).toBeUndefined()
  })
})

describe('readProductSelection', () => {
  it('reads products and the named display values', () => {
    const read = readProductSelection({ products: [{ part: 'A' }], displayValues: { prices: { k: { amount: 1 } } } }, URL, 'displayValues')
    expect(read.products).toEqual([{ part: 'A' }])
    expect(read.display.prices).toEqual({ k: { amount: 1 } })
  })

  it('throws when products or prices are missing', () => {
    expect(() => readProductSelection({ products: [] }, URL, 'displayValues')).toThrow(/productSelectionData\.products/)
    expect(() => readProductSelection({ products: [{}] }, URL, 'mainDisplayValues')).toThrow(/productSelectionData\.mainDisplayValues\.prices/)
  })
})

describe('amountOf and displayHeader', () => {
  it('parses an amount and reads a raw header', () => {
    expect(amountOf({ a: { amount: '£1,199.50' }, b: { amount: 5 }, c: {} }, 'a')).toBe(1199.5)
    expect(amountOf({ b: { amount: 5 } }, 'b')).toBe(5)
    expect(amountOf({ c: {} }, 'c')).toBeUndefined()
    expect(amountOf({}, 'missing')).toBeUndefined()
    expect(displayHeader({ x: { header: '<b>X</b>' } }, 'x')).toBe('<b>X</b>')
    expect(displayHeader(undefined, 'x')).toBeUndefined()
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
