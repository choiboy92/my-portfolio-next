import { expect, test } from 'vitest'
import { calculatePrice, getAvailableOptions, isOffered, priceBasketItem } from '@/lib/product-config'
import { macbookItem, validItem, watchItem } from './fixtures/order'

test('iPad Pro nano-texture requires 1TB storage', () => {
  const avail = (s?: string) => getAvailableOptions('iPad', 'iPad Pro', '11-inch iPad Pro', s).nanoTextureAvailable
  expect([avail(undefined), avail('256GB'), avail('1TB'), avail('2TB')]).toEqual([false, false, true, true])
  expect(calculatePrice('iPad', 'iPad Pro', '11-inch iPad Pro', { storage: '256GB', nanoTexture: true })).toBe(999)
  expect(calculatePrice('iPad', 'iPad Pro', '11-inch iPad Pro', { storage: '1TB', nanoTexture: true })).toBe(1699)
})
test.each([
  ['iPhone 17 Pro 512GB', validItem(), 1299, 220.83],
  ['MacBook Pro 16 36GB/1TB/96W', macbookItem, 2919, 496.23],
  ['iPad Pro 11 1TB nano + AppleCare', validItem({ category: 'iPad', model: 'iPad Pro', specs: '11-inch iPad Pro', color: 'Silver', storage: '1TB', connectivity: 'Wi-Fi', nanoTexture: true, appleCare: true }), 1848, 288.83],
  ['Watch S11 46mm cellular', watchItem, 499, 84.83],
  ['unknown model', validItem({ model: 'iPhone 99' }), 0, 0],
])('priceBasketItem: %s', (_, item, estimatedPrice, discountValue) => {
  expect(priceBasketItem(item)).toEqual({ estimatedPrice, discountValue })
})
test('isOffered accepts every valid catalog item', () => {
  const ipad = validItem({ category: 'iPad', model: 'iPad Pro', specs: '11-inch iPad Pro', color: 'Silver', storage: '1TB', connectivity: 'Wi-Fi', nanoTexture: true, appleCare: true })
  expect([validItem(), macbookItem, ipad, watchItem].map(isOffered)).toEqual([true, true, true, true])
  expect(isOffered({ ...ipad, storage: '256GB' })).toBe(false)
})
