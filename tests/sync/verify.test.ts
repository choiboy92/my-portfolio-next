import { describe, expect, it } from 'vitest'
import { parseCatalogue, type Catalogue, type CategoryKey, type Model } from '@/lib/catalogue/schema'
import type { MapResult, MappedModel } from '@/scripts/catalogue/types'
import { GuardError, assembleCatalogue, selfCheck } from '@/scripts/catalogue/verify'
import { testCatalogue } from '../fixtures/test-catalogue'

const emptyResult = (): MapResult => ({ models: [], unmapped: [], warnings: [] })

function good(category: CategoryKey, key: string, model: Model): MappedModel {
  const spec = model.specs[0]
  return { category, key, model, published: [{ spec: spec.name, label: 'base', options: {}, price: spec.price }] }
}

function resultsFor(models: Partial<Record<CategoryKey, MappedModel[]>>): Record<CategoryKey, MapResult> {
  const keys: CategoryKey[] = ['iPhone', 'iPad', 'MacBook', 'Apple Watch']
  const out = {} as Record<CategoryKey, MapResult>
  for (const key of keys) {
    const given = models[key] ?? Object.entries(testCatalogue.categories[key].models).map(([k, m]) => good(key, k, m))
    out[key] = { ...emptyResult(), models: given }
  }
  return out
}

function phone(price: number, publishedPrice = price): MappedModel {
  const base = testCatalogue.categories.iPhone.models['Phone X']
  const model: Model = { ...base, specs: [{ ...base.specs[0], price }] }
  return { category: 'iPhone', key: 'Phone X', model, published: [{ spec: 'Phone X', label: '512GB', options: { storage: '512GB' }, price: publishedPrice + 300 }] }
}

function withPhones(count: number): Catalogue {
  const copy = structuredClone(testCatalogue)
  const base = copy.categories.iPhone.models['Phone X']
  for (let i = 1; i < count; i++) copy.categories.iPhone.models[`Phone ${i}`] = { ...base, displayName: `Phone ${i}` }
  return copy
}

describe('selfCheck', () => {
  it('passes a model whose published prices match', () => {
    const result = selfCheck([phone(999)])
    expect(result.passed).toHaveLength(1)
    expect(result.failures).toEqual([])
  })

  it('reports mismatching prices', () => {
    const result = selfCheck([phone(999, 1099)])
    expect(result.passed).toEqual([])
    expect(result.failures).toEqual([{ category: 'iPhone', model: 'Phone X', spec: 'Phone X', label: '512GB', expected: 1399, actual: 1299 }])
  })

  it('fails a published config that references a missing spec', () => {
    const mapped = phone(999)
    mapped.published.push({ spec: 'Ghost', label: 'ghost', options: {}, price: 5 })
    expect(selfCheck([mapped]).failures.map(f => f.spec)).toEqual(['Ghost'])
  })

  it('fails a model with no specs and published configs', () => {
    const mapped = phone(999)
    mapped.model = { ...mapped.model, specs: [] }
    const result = selfCheck([mapped])
    expect(result.passed).toEqual([])
    expect(result.failures.length).toBeGreaterThan(0)
  })

  it('fails a model with specs but nothing published', () => {
    const mapped = phone(999)
    mapped.published = []
    const result = selfCheck([mapped])
    expect(result.passed).toEqual([])
    expect(result.failures.map(f => f.label)).toEqual(['Phone X / Phone X: no Apple-published price to verify'])
  })

  it('fails a model where one spec has no published price', () => {
    const mapped = phone(999)
    mapped.model = { ...mapped.model, specs: [...mapped.model.specs, { ...mapped.model.specs[0], name: 'Phone Y' }] }
    const result = selfCheck([mapped])
    expect(result.passed).toEqual([])
    expect(result.failures.map(f => f.spec)).toEqual(['Phone Y'])
  })

  it('compares in whole pence', () => {
    const mapped = phone(999.1)
    mapped.published = [{ spec: 'Phone X', label: 'sum', options: { storage: '512GB' }, price: 1299.1 }]
    expect(selfCheck([mapped]).failures).toEqual([])
  })

  it('lists every failure for a held-back model', () => {
    const bad = phone(999, 1099)
    bad.published.push({ spec: 'Ghost', label: 'ghost', options: {}, price: 5 })
    const { warnings } = assembleCatalogue(testCatalogue, resultsFor({ iPhone: [bad] }), { bootstrap: false })
    expect(warnings[0]).toContain('512GB expected £1399, got £1299; ghost expected £5, got £0')
  })

  it('fails a model with no specs and nothing published', () => {
    const mapped = phone(999)
    mapped.model = { ...mapped.model, specs: [] }
    mapped.published = []
    const result = selfCheck([mapped])
    expect(result.passed).toEqual([])
    expect(result.failures).toHaveLength(1)
  })
})

describe('assembleCatalogue', () => {
  it('replaces a failing model with its previous entry and warns', () => {
    const results = resultsFor({ iPhone: [phone(999, 1099)] })
    const { catalogue, warnings, keptLastMerged } = assembleCatalogue(testCatalogue, results, { bootstrap: false })
    expect(catalogue.categories.iPhone.models['Phone X']).toEqual(testCatalogue.categories.iPhone.models['Phone X'])
    expect(warnings).toContain('⚠️ Phone X: kept last-merged entry — 512GB expected £1399, got £1299 (last-merged data, not re-verified against Apple today)')
    expect(keptLastMerged).toEqual(['Phone X'])
  })

  it('leaves out a new failing model with a warning', () => {
    const bad = phone(999, 1099)
    bad.key = 'Phone New'
    const results = resultsFor({ iPhone: [phone(999), bad] })
    const { catalogue, warnings, keptLastMerged } = assembleCatalogue(testCatalogue, results, { bootstrap: false })
    expect(Object.keys(catalogue.categories.iPhone.models)).toEqual(['Phone X'])
    expect(warnings).toContain('⚠️ Phone New: new product held back — 512GB expected £1399, got £1299')
    expect(keptLastMerged).toEqual([])
  })

  function mixed(yPublished: number): MappedModel {
    const base = phone(999)
    const x = base.model.specs[0]
    const y = { ...x, name: 'Phone Y', price: 1099 }
    return {
      ...base,
      model: { ...base.model, specs: [x, y] },
      published: [...base.published, { spec: 'Phone Y', label: 'Y 512GB', options: { storage: '512GB' }, price: yPublished }],
    }
  }

  it('ships the passing specs of a partly failing model and warns about the rest', () => {
    const results = resultsFor({ iPhone: [mixed(1300)] })
    const { catalogue, warnings } = assembleCatalogue(testCatalogue, results, { bootstrap: false })
    const model = catalogue.categories.iPhone.models['Phone X']
    expect(model.specs.map(s => s.name)).toEqual(['Phone X'])
    expect(model.specs[0].price).toBe(999)
    expect(warnings).toContain('⚠️ Phone X: 1 spec(s) held back — Y 512GB expected £1300, got £1399; shipped the rest')
    expect(warnings.some(w => w.includes('kept last-merged entry'))).toBe(false)
  })

  it('drops published prices of a spec the mapper held and ships the rest', () => {
    const base = phone(999)
    base.published.push({ spec: 'Phone Held', label: 'held 1TB', options: { storage: '1TB' }, price: 1499 })
    const { catalogue, warnings } = assembleCatalogue(testCatalogue, resultsFor({ iPhone: [base] }), { bootstrap: false })
    expect(catalogue.categories.iPhone.models['Phone X'].specs.map(s => s.name)).toEqual(['Phone X'])
    expect(warnings).toContain('⚠️ Phone X: 1 spec(s) held back — held 1TB expected £1499, got £0; shipped the rest')
  })

  it('still falls back to the last-merged entry when every spec fails', () => {
    const bad = mixed(1300)
    bad.published[0] = { ...bad.published[0], price: 1 }
    const { catalogue, warnings } = assembleCatalogue(testCatalogue, resultsFor({ iPhone: [bad] }), { bootstrap: false })
    expect(catalogue.categories.iPhone.models['Phone X']).toEqual(testCatalogue.categories.iPhone.models['Phone X'])
    expect(warnings.some(w => w.startsWith('⚠️ Phone X: kept last-merged entry'))).toBe(true)
  })

  it('holds back a model with specs [] rather than emitting it', () => {
    const empty = phone(999)
    empty.key = 'Phone New'
    empty.model = { ...empty.model, specs: [] }
    const results = resultsFor({ iPhone: [phone(999), empty] })
    const { catalogue } = assembleCatalogue(testCatalogue, results, { bootstrap: false })
    expect(Object.keys(catalogue.categories.iPhone.models)).toEqual(['Phone X'])
    expect(() => parseCatalogue(catalogue)).not.toThrow()
  })

  it('throws GuardError when a category ends empty', () => {
    const results = resultsFor({ iPhone: [] })
    expect(() => assembleCatalogue(testCatalogue, results, { bootstrap: true })).toThrow(GuardError)
  })

  it('throws when more than 30% of previous models disappear, unless bootstrap', () => {
    const previous = withPhones(3)
    const results = resultsFor({ iPhone: [phone(999)] })
    expect(() => assembleCatalogue(previous, results, { bootstrap: false })).toThrow(GuardError)
    expect(() => assembleCatalogue(previous, results, { bootstrap: true })).not.toThrow()
  })

  it('allows removing 1 of 4 models', () => {
    const previous = withPhones(4)
    const results = resultsFor({ iPhone: ['Phone X', 'Phone 1', 'Phone 2'].map(key => ({ ...phone(999), key })) })
    const { catalogue } = assembleCatalogue(previous, results, { bootstrap: false })
    expect(Object.keys(catalogue.categories.iPhone.models)).toEqual(['Phone X', 'Phone 1', 'Phone 2'])
    expect(() => parseCatalogue(catalogue)).not.toThrow()
  })

  it('follows result order and keeps categories missing from results', () => {
    const previous = withPhones(2)
    const results = resultsFor({ iPhone: ['Phone 1', 'Phone X'].map(key => ({ ...phone(999), key })) })
    const partial: Partial<Record<CategoryKey, MapResult>> = { ...results }
    delete partial.iPad
    const { catalogue } = assembleCatalogue(previous, partial as Record<CategoryKey, MapResult>, { bootstrap: false })
    expect(Object.keys(catalogue.categories.iPhone.models)).toEqual(['Phone 1', 'Phone X'])
    expect(catalogue.categories.iPad).toEqual(previous.categories.iPad)
  })

  it('dedupes unmapped and warnings in first-seen order', () => {
    const results = resultsFor({})
    results.iPhone.unmapped = ['a', 'b']
    results.iPad.unmapped = ['b', 'c']
    results.iPhone.warnings = ['w1']
    results.iPad.warnings = ['w1', 'w2']
    const out = assembleCatalogue(testCatalogue, results, { bootstrap: false })
    expect(out.unmapped).toEqual(['a', 'b', 'c'])
    expect(out.warnings).toEqual(['w1', 'w2'])
  })
})
