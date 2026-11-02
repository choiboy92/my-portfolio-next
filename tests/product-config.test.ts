import { expect, test } from 'vitest'
import { calculatePrice, getAvailableOptions, priceBasketItem } from '@/lib/product-config'
import { validItem } from './fixtures/order'

test('iPad Pro nano-texture requires 1TB storage', () => {
  const avail = (s?: string) => getAvailableOptions('iPad', 'iPad Pro', '11-inch iPad Pro', s).nanoTextureAvailable
  expect([avail(undefined), avail('256GB'), avail('1TB'), avail('2TB')]).toEqual([false, false, true, true])
  expect(calculatePrice('iPad', 'iPad Pro', '11-inch iPad Pro', { storage: '256GB', nanoTexture: true })).toBe(999)
  expect(calculatePrice('iPad', 'iPad Pro', '11-inch iPad Pro', { storage: '1TB', nanoTexture: true })).toBe(1699)
})
test.each([
  ['iPhone 17 Pro 512GB', validItem(), 1299, 220.83],
  ['MacBook Pro 16 36GB/1TB/96W', validItem({ category: 'MacBook', model: 'MacBook Pro 16"', specs: 'M4 Pro 14-Core CPU 20-Core GPU 24GB Unified Memory', color: 'Space Black', memory: '36GB', storage: '1TB', charger: '96W' }), 2919, 496.23],
  ['iPad Pro 11 1TB nano + AppleCare', validItem({ category: 'iPad', model: 'iPad Pro', specs: '11-inch iPad Pro', color: 'Silver', storage: '1TB', connectivity: 'Wi-Fi', nanoTexture: true, appleCare: true }), 1848, 288.83],
  ['Watch S11 46mm cellular', validItem({ category: 'Apple Watch', model: 'Apple Watch Series 11', specs: 'Aluminium Case', color: 'Space Grey', storage: undefined, size: '46mm', connectivity: 'GPS + Cellular', band: { material: 'Rubber', style: 'Solo Loop', color: 'Black', size: '5' } }), 499, 84.83],
  ['unknown model', validItem({ model: 'iPhone 99' }), 0, 0],
])('priceBasketItem: %s', (_, item, estimatedPrice, discountValue) => {
  expect(priceBasketItem(item)).toEqual({ estimatedPrice, discountValue })
})
