import catalogueJson from './catalogue/apple-uk.json'
import { makeCatalogueHelpers } from './catalogue/helpers'
import { parseCatalogue } from './catalogue/schema'
import type { CategoryKey, Pencil, Spec } from './catalogue/schema'

const catalogue = parseCatalogue(catalogueJson)

export type { Pencil }
export type ProductCategoryKey = CategoryKey
export type ProductSpecificationOptions = Spec

export const PRODUCT_CONFIGURATIONS = catalogue.categories

export const {
  getModelConfigurations,
  getModelConfiguration,
  getSpecConfiguration,
  getAvailableOptions,
  calculatePrice,
  getAppleCareTiers,
  findAppleCareTier,
  isOffered,
  priceBasketItem,
} = makeCatalogueHelpers(catalogue)

export function formatSpecDisplay(spec: Spec): string {
  return spec.name || 'Unnamed Configuration'
}

export function getProductCategoryDisplayName(category: CategoryKey): string {
  return PRODUCT_CONFIGURATIONS[category].category
}
