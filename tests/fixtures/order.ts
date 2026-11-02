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
