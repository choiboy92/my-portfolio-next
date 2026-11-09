import { describe, expect, it } from 'vitest'
import type { Catalogue } from '@/lib/catalogue/schema'
import { catalogueEquals, serializeCatalogue } from '@/scripts/catalogue/serialize'
import { testCatalogue } from '../fixtures/test-catalogue'

const clone = () => structuredClone(testCatalogue) as Catalogue

describe('serializeCatalogue', () => {
  it('is stable across calls and ends with a newline', () => {
    const a = serializeCatalogue(clone())
    expect(serializeCatalogue(clone())).toBe(a)
    expect(a.endsWith('}\n')).toBe(true)
  })

  it('rounds numbers to pence', () => {
    const c = clone()
    c.categories.iPhone.models['Phone X'].specs[0].price = 1199.0000001
    c.categories.iPhone.models['Phone X'].specs[0].storageOptions!['512GB'] = 12.994
    const out = JSON.parse(serializeCatalogue(c))
    expect(out.categories.iPhone.models['Phone X'].specs[0].price).toBe(1199)
    expect(out.categories.iPhone.models['Phone X'].specs[0].storageOptions['512GB']).toBe(12.99)
  })

  it('orders categories iPhone, iPad, MacBook, Apple Watch', () => {
    const c = clone()
    const { categories } = c
    c.categories = {
      'Apple Watch': categories['Apple Watch'],
      MacBook: categories.MacBook,
      iPad: categories.iPad,
      iPhone: categories.iPhone,
    }
    expect(Object.keys(JSON.parse(serializeCatalogue(c)).categories)).toEqual(['iPhone', 'iPad', 'MacBook', 'Apple Watch'])
  })

  it('rejects an invalid catalogue', () => {
    const c = clone()
    c.categories.iPhone.models['Phone X'].specs = []
    expect(() => serializeCatalogue(c)).toThrow()
  })
})

describe('catalogueEquals', () => {
  it('ignores model order and object key order', () => {
    const a = clone()
    a.categories.iPad.models['Pad Air'] = structuredClone(a.categories.iPad.models['Pad Pro'])
    const b = clone()
    b.categories.iPad.models = {
      'Pad Air': structuredClone(a.categories.iPad.models['Pad Air']),
      'Pad Pro': b.categories.iPad.models['Pad Pro'],
    }
    expect(catalogueEquals(a, b)).toBe(true)
    const spec = b.categories.iPhone.models['Phone X'].specs[0]
    b.categories.iPhone.models['Phone X'].specs[0] = {
      price: spec.price,
      name: spec.name,
      appleCare: spec.appleCare,
      storageOptions: spec.storageOptions,
    }
    expect(catalogueEquals(a, b)).toBe(true)
  })

  it('treats reordered arrays as different', () => {
    const a = clone()
    const b = clone()
    a.categories.iPhone.models['Phone X'].colors = ['Silver', 'Blue']
    b.categories.iPhone.models['Phone X'].colors = ['Blue', 'Silver']
    expect(catalogueEquals(a, b)).toBe(false)
  })

  it('treats reordered specs as different', () => {
    const a = clone()
    a.categories.iPhone.models['Phone X'].specs.push({ name: 'Other', price: 5, appleCare: [] })
    const b = structuredClone(a)
    b.categories.iPhone.models['Phone X'].specs.reverse()
    expect(catalogueEquals(a, b)).toBe(false)
  })

  it('detects a value change', () => {
    const b = clone()
    b.categories.iPhone.models['Phone X'].specs[0].price = 1000
    expect(catalogueEquals(testCatalogue, b)).toBe(false)
  })

  it('matches serialisation: rounding noise and price-map key order do not count', () => {
    const a = clone()
    const b = clone()
    a.categories.iPhone.models['Phone X'].specs[0].price = 1199.0000001
    b.categories.iPhone.models['Phone X'].specs[0].price = 1199
    a.categories.iPhone.models['Phone X'].specs[0].storageOptions = { '1TB': 600, '256GB': 0 }
    b.categories.iPhone.models['Phone X'].specs[0].storageOptions = { '256GB': 0, '1TB': 600 }
    expect(catalogueEquals(a, b)).toBe(true)
  })
})
