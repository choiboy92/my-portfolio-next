import { expect, test } from 'vitest'
import { makeCatalogueHelpers } from '@/lib/catalogue/helpers'
import type { BasketItemFormData } from '@/lib/validation-schema'
import { testCatalogue } from './fixtures/test-catalogue'

const { calculatePrice, getAvailableOptions, isOffered, priceBasketItem } = makeCatalogueHelpers(testCatalogue)

const phone: BasketItemFormData = { category: 'iPhone', model: 'Phone X', specs: 'Phone X', color: 'Silver', storage: '512GB', appleCare: false }
const mac: BasketItemFormData = { category: 'MacBook', model: 'Book 16"', specs: 'Chip A', color: 'Space Black', memory: '36GB', storage: '1TB', charger: '96W', appleCare: false }
const pad: BasketItemFormData = { category: 'iPad', model: 'Pad Pro', specs: '11-inch Pad Pro', color: 'Silver', storage: '1TB', connectivity: 'Wi-Fi', nanoTexture: true, appleCare: true }
const watch: BasketItemFormData = {
  category: 'Apple Watch',
  model: 'Watch 11',
  specs: 'Aluminium Case',
  color: 'Space Grey',
  size: '46mm',
  connectivity: 'GPS + Cellular',
  band: { material: 'Textile', style: 'Magnetic Link', color: 'Navy', size: 'S/M' },
  appleCare: false,
}

test('iPad nano-texture requires the minimum storage', () => {
  const avail = (s?: string) => getAvailableOptions('iPad', 'Pad Pro', '11-inch Pad Pro', s)?.nanoTextureAvailable
  expect([avail(undefined), avail('256GB'), avail('1TB')]).toEqual([false, false, true])
  expect(calculatePrice('iPad', 'Pad Pro', '11-inch Pad Pro', { storage: '256GB', nanoTexture: true })).toBe(999)
  expect(calculatePrice('iPad', 'Pad Pro', '11-inch Pad Pro', { storage: '1TB', nanoTexture: true })).toBe(1699)
})
test.each([
  ['phone 512GB', phone, 1299, 220.83],
  ['mac 36GB/1TB/96W', mac, 2919, 496.23],
  ['pad 1TB nano + AppleCare', pad, 1848, 288.83],
  ['watch 46mm cellular + Magnetic Link', watch, 549, 93.33],
  ['unknown model', { ...phone, model: 'Phone 99' }, 0, 0],
])('priceBasketItem: %s', (_, item, estimatedPrice, discountValue) => {
  expect(priceBasketItem(item)).toEqual({ estimatedPrice, discountValue })
})
test('isOffered accepts valid items and rejects unsupported ones', () => {
  expect([phone, mac, pad, watch].map(isOffered)).toEqual([true, true, true, true])
  expect(isOffered({ ...pad, storage: '256GB' })).toBe(false)
  expect(isOffered({ ...phone, model: 'constructor' })).toBe(false)
  expect(isOffered({ ...phone, category: 'toString' })).toBe(false)
  expect(isOffered({ ...watch, size: '42mm' })).toBe(false)
})
