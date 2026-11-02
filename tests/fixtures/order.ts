import type { BasketItemFormData, OrderFormData } from '@/lib/validation-schema'

export function validItem(overrides: Partial<BasketItemFormData> = {}): BasketItemFormData {
  return {
    category: 'iPhone',
    model: 'iPhone 17 Pro & Pro Max',
    specs: 'iPhone 17 Pro',
    color: 'Silver',
    storage: '512GB',
    appleCare: false,
    ...overrides,
  }
}

export const macbookItem = validItem({ category: 'MacBook', model: 'MacBook Pro 16"', specs: 'M4 Pro 14-Core CPU 20-Core GPU 24GB Unified Memory', color: 'Space Black', memory: '36GB', storage: '1TB', charger: '96W' })
export const watchItem = validItem({ category: 'Apple Watch', model: 'Apple Watch Series 11', specs: 'Aluminium Case', color: 'Space Grey', storage: undefined, size: '46mm', connectivity: 'GPS + Cellular', band: { material: 'Rubber', style: 'Solo Loop', color: 'Black', size: '5' } })

export function validOrder(overrides: Partial<OrderFormData> = {}): OrderFormData {
  return {
    basket: [validItem()],
    delivery: {
      method: 'delivery',
      address: { title: 'Mr', firstName: 'Sam', surname: 'Lee', line1: '1 High St', city: 'London', postcode: 'SW1A 1AA' },
      contact: { email: 'buyer@example.com', phone: '07700900123' },
    },
    additionalComments: 'Please engrave',
    checkCompleted: true,
    ...overrides,
  }
}
