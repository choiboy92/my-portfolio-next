import { describe, expect, test } from 'vitest'
import { PRODUCT_CONFIGURATIONS, isOffered, priceBasketItem } from '@/lib/product-config'
import type { CategoryKey, PriceMap, Spec } from '@/lib/catalogue/schema'
import { cheapestItem } from './fixtures/order'

const categories = Object.keys(PRODUCT_CONFIGURATIONS) as CategoryKey[]
const priceMaps = ['memoryOptions', 'storageOptions', 'chargerOptions', 'connectivityOptions', 'sizeOptions'] as const

function expectedPrice(spec: Spec, item: ReturnType<typeof cheapestItem>) {
  const delta = (map: PriceMap | undefined, key: string | undefined) => (map && key ? (map[key] ?? 0) : 0)
  const style = spec.bandOptions
    ?.find(g => g.material === item.band?.material)
    ?.style.find(s => s.styleName === item.band?.style)
  return (
    spec.price +
    delta(spec.memoryOptions, item.memory) +
    delta(spec.storageOptions, item.storage) +
    delta(spec.chargerOptions, item.charger) +
    delta(spec.connectivityOptions, item.connectivity) +
    delta(spec.sizeOptions, item.size) +
    (style?.price ?? 0)
  )
}

describe('generated catalogue', () => {
  const specsOf = (category: CategoryKey) => Object.values(PRODUCT_CONFIGURATIONS[category].models).flatMap(m => m.specs)

  test.each(['iPhone', 'iPad', 'MacBook'] as CategoryKey[])('%s has Apple part numbers', category => {
    expect(specsOf(category).some(spec => typeof spec.partNumber === 'string' && spec.partNumber.length > 0)).toBe(true)
  })

  test.each(['iPhone', 'iPad'] as CategoryKey[])('every %s spec has an exact part number for each SKU, including its base one', category => {
    for (const spec of specsOf(category)) {
      const parts = Object.values(spec.partNumbers ?? {})
      expect(parts.length, spec.name).toBeGreaterThan(1)
      expect(parts, spec.name).toContain(spec.partNumber)
    }
  })

  test('every MacBook Pro size has AppleCare+ tiers', () => {
    for (const [name, model] of Object.entries(PRODUCT_CONFIGURATIONS.MacBook.models)) {
      if (!name.startsWith('MacBook Pro')) continue
      for (const spec of model.specs) expect(spec.appleCare.length, `${name} / ${spec.name}`).toBe(2)
    }
  })

  test('Apple Watch has a priced band style', () => {
    const priced = specsOf('Apple Watch').some(spec => spec.bandOptions?.some(group => group.style.some(style => style.price > 0)))
    expect(priced).toBe(true)
  })
})

describe.each(categories)('%s', category => {
  const models = Object.entries(PRODUCT_CONFIGURATIONS[category].models)

  test('has models', () => {
    expect(models.length).toBeGreaterThan(0)
  })
  test.each(models)('%s is well formed', (modelName, model) => {
    for (const spec of model.specs) {
      expect(spec.price).toBeGreaterThan(0)
      for (const key of priceMaps) {
        const map = spec[key]
        if (map) expect(Object.keys(map).length).toBeGreaterThan(0)
      }
      expect((spec.colors ?? model.colors).length).toBeGreaterThan(0)
      const item = cheapestItem(category, (m, s) => m === modelName && s.name === spec.name)
      expect(isOffered(item)).toBe(true)
      expect(priceBasketItem(item).estimatedPrice).toBe(expectedPrice(spec, item))
    }
  })
})
