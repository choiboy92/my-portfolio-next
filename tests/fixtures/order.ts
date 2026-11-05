import { PRODUCT_CONFIGURATIONS, getAvailableOptions } from '@/lib/product-config'
import type { CategoryKey, Spec } from '@/lib/catalogue/schema'
import type { BasketItemFormData, OrderFormData } from '@/lib/validation-schema'

export function cheapestItem(category: CategoryKey, pick: (model: string, spec: Spec) => boolean = () => true): BasketItemFormData {
  for (const [model, config] of Object.entries(PRODUCT_CONFIGURATIONS[category].models)) {
    const spec = config.specs.find(s => pick(model, s))
    if (!spec) continue
    const offered = getAvailableOptions(category, model, spec.name)
    const group = spec.bandOptions?.[0]
    const style = group?.style[0]
    return {
      category,
      model,
      specs: spec.name,
      color: (spec.colors ?? config.colors)[0],
      storage: offered?.storageOptions?.[0],
      memory: offered?.memoryOptions?.[0],
      charger: offered?.chargerOptions?.[0],
      connectivity: offered?.connectivityOptions?.[0],
      size: offered?.sizeOptions?.[0],
      band: group && style ? { material: group.material, style: style.styleName, color: style.bandColor[0], size: style.bandSizeOptions?.[0] } : undefined,
      appleCare: undefined,
    }
  }
  throw new Error(`No ${category} model matches`)
}

export function validItem(overrides: Partial<BasketItemFormData> = {}): BasketItemFormData {
  return { ...cheapestItem('iPhone'), ...overrides }
}

export const macbookItem = cheapestItem('MacBook')
export const watchItem = cheapestItem('Apple Watch')

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
