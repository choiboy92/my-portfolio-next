import { expect, test } from 'vitest'
import { makeCatalogueHelpers } from '@/lib/catalogue/helpers'
import type { BasketItemFormData } from '@/lib/validation-schema'
import { testCatalogue } from './fixtures/test-catalogue'

const { calculatePrice, getAppleCareTiers, getAvailableOptions, isOffered, priceBasketItem } = makeCatalogueHelpers(testCatalogue)

const phone: BasketItemFormData = { category: 'iPhone', model: 'Phone X', specs: 'Phone X', color: 'Silver', storage: '512GB', appleCare: undefined }
const mac: BasketItemFormData = { category: 'MacBook', model: 'Book 16"', specs: 'Chip A', color: 'Space Black', memory: '36GB', storage: '1TB', charger: '96W', appleCare: undefined }
const pad: BasketItemFormData = { category: 'iPad', model: 'Pad Pro', specs: '11-inch Pad Pro', color: 'Silver', storage: '1TB', connectivity: 'Wi-Fi', nanoTexture: true, appleCare: 'AppleCare+' }
const watch: BasketItemFormData = {
  category: 'Apple Watch',
  model: 'Watch 11',
  specs: 'Aluminium Case',
  color: 'Space Grey',
  size: '46mm',
  connectivity: 'GPS + Cellular',
  band: { material: 'Textile', style: 'Magnetic Link', color: 'Navy', size: 'S/M' },
  appleCare: undefined,
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
test('isOffered limits band sizes to those offered for the selected case size', () => {
  const braided = (size: string, bandSize: string): BasketItemFormData => ({
    ...watch,
    size,
    band: { material: 'Textile', style: 'Braided Solo Loop', color: 'Navy', size: bandSize },
  })
  expect(isOffered(braided('46mm', '11'))).toBe(true)
  expect(isOffered(braided('42mm', '5'))).toBe(true)
  expect(isOffered(braided('42mm', '11'))).toBe(false)
})
test.each([
  ['Annual', 'AppleCare+ with Theft and Loss (Annual)', 1128.99],
  ['Monthly', 'AppleCare+ with Theft and Loss (Monthly)', 1011.99],
])('phone with %s tier is never discounted', (_, appleCare, estimatedPrice) => {
  expect(priceBasketItem({ ...phone, storage: '256GB', appleCare })).toEqual({ estimatedPrice, discountValue: 169.83 })
})
test('getAppleCareTiers returns the tiers in order', () => {
  expect(getAppleCareTiers('iPhone', 'Phone X', 'Phone X').map(t => t.name)).toEqual([
    'AppleCare+ with Theft and Loss (Monthly)',
    'AppleCare+ with Theft and Loss (Annual)',
  ])
  expect(getAppleCareTiers('iPhone', 'Phone X')).toEqual([])
})
test('isOffered rejects unknown or unavailable AppleCare tiers', () => {
  expect(isOffered({ ...phone, appleCare: 'Gold Plan' })).toBe(false)
  expect(isOffered({ ...phone, appleCare: 'AppleCare+ with Theft and Loss (Annual)' })).toBe(true)
  expect(isOffered({ ...mac, appleCare: 'AppleCare+' })).toBe(false)
})
