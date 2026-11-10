import type { BasketItemFormData } from '../validation-schema'
import type { AppleCareTier, BandGroup, BandStyle, Catalogue, CategoryKey, Model, Pencil, PriceMap, Spec } from './schema'

export interface SelectedOptions {
  memory?: string
  storage?: string
  charger?: string
  connectivity?: string
  size?: string
  applePencil?: string
  magicKeyboard?: boolean
  nanoTexture?: boolean
  appleCare?: string
  band?: { material: string; style: string; color: string }
}

export interface AvailableOptions {
  colors: string[]
  specs: Spec[]
  appleCareTiers: AppleCareTier[]
  memoryOptions?: string[]
  storageOptions?: string[]
  chargerOptions?: string[]
  connectivityOptions?: string[]
  sizeOptions?: string[]
  applePencilOptions?: Pencil[]
  bandOptions?: BandGroup[]
  nanoTextureAvailable?: boolean
  nanoTexturePrice?: number
  magicKeyboardPrice?: number
}

export type SkuSelection = { color: string; storage?: string; connectivity?: string; nanoTexture?: boolean }

export function skuKey(item: SkuSelection): string {
  return `${item.color}|${item.storage ?? ''}|${item.connectivity ?? ''}|${item.nanoTexture ? 'nano' : ''}`
}

export function parseStorageSize(size: string): number {
  const match = size.match(/(\d+)(GB|TB)/i)
  if (!match) return 0
  const value = parseInt(match[1])
  return match[2].toUpperCase() === 'TB' ? value * 1024 : value
}

function parseMemorySize(memory: string): number {
  const match = memory.match(/(\d+)GB/i)
  return match ? parseInt(match[1]) : 0
}

function filterAtLeast(options: PriceMap | undefined, minimum: string | undefined, parse: (value: string) => number): string[] {
  if (!options) return []
  if (!minimum) return Object.keys(options)
  const minValue = parse(minimum)
  return Object.keys(options).filter(option => parse(option) >= minValue)
}

function iPadNanoTextureAvailable(spec: Spec, selectedStorage: string | undefined): boolean {
  const minNano = spec.constraints?.minStorageForNanotexture
  return typeof spec.nanoTexture === 'number' && (!minNano || (!!selectedStorage && parseStorageSize(selectedStorage) >= parseStorageSize(minNano)))
}

function findTier(spec: Spec | undefined, tierName: string | undefined): AppleCareTier | undefined {
  return tierName ? spec?.appleCare.find(t => t.name === tierName) : undefined
}

export function priceSpec(category: string, spec: Spec, selected: SelectedOptions = {}): number {
  const delta = (map: PriceMap | undefined, key: string | undefined) => (map && key ? (map[key] ?? 0) : 0)
  let total = spec.price

  if (category === 'MacBook') {
    total += delta(spec.memoryOptions, selected.memory)
    total += delta(spec.storageOptions, selected.storage)
    total += delta(spec.chargerOptions, selected.charger)
    if (selected.nanoTexture && spec.nanoTexture) total += spec.nanoTexture
  }

  if (category === 'iPhone') {
    total += delta(spec.storageOptions, selected.storage)
  }

  if (category === 'iPad') {
    total += delta(spec.storageOptions, selected.storage)
    total += delta(spec.connectivityOptions, selected.connectivity)
    if (selected.applePencil) {
      const pencil = spec.applePencil?.find(p => p.pencilType === selected.applePencil)
      if (pencil) total += pencil.price
    }
    if (selected.magicKeyboard && spec.magicKeyboard) total += spec.magicKeyboard
    if (selected.nanoTexture && spec.nanoTexture && iPadNanoTextureAvailable(spec, selected.storage)) {
      total += spec.nanoTexture
    }
  }

  if (category === 'Apple Watch') {
    total += delta(spec.sizeOptions, selected.size)
    total += delta(spec.connectivityOptions, selected.connectivity)
    if (selected.band) {
      const style = spec.bandOptions?.find(g => g.material === selected.band?.material)?.style.find(s => s.styleName === selected.band?.style)
      if (style) total += style.price
    }
  }

  total += findTier(spec, selected.appleCare)?.price ?? 0

  return total
}

export function bandSizesFor(style: BandStyle, caseSize: string | undefined): string[] {
  const byCase = style.bandSizesByCase
  if (!byCase) return style.bandSizeOptions ?? []
  return caseSize && Object.hasOwn(byCase, caseSize) ? byCase[caseSize] : []
}

export function makeCatalogueHelpers(catalogue: Catalogue) {
  function getModelConfigurations(category: string): Array<{ key: string; config: Model }> | undefined {
    if (!Object.hasOwn(catalogue.categories, category)) return undefined
    return Object.entries(catalogue.categories[category as CategoryKey].models).map(([key, config]) => ({ key, config }))
  }

  function getModelConfiguration(category: string, modelName: string): Model | undefined {
    if (!Object.hasOwn(catalogue.categories, category)) return undefined
    const { models } = catalogue.categories[category as CategoryKey]
    if (!Object.hasOwn(models, modelName)) return undefined
    return models[modelName]
  }

  function getSpecConfiguration(category: string, modelName: string, specName: string): Spec | undefined {
    return getModelConfiguration(category, modelName)?.specs.find(spec => spec.name === specName)
  }

  function getAppleCareTiers(category: string, modelName: string, specName?: string): AppleCareTier[] {
    if (!specName) return []
    return getSpecConfiguration(category, modelName, specName)?.appleCare ?? []
  }

  function findAppleCareTier(category: string, modelName: string, specName: string | undefined, tierName: string | undefined): AppleCareTier | undefined {
    return specName ? findTier(getSpecConfiguration(category, modelName, specName), tierName) : undefined
  }

  function getAvailableOptions(category: string, modelName: string, specName?: string, selectedStorage?: string): AvailableOptions | null {
    const model = getModelConfiguration(category, modelName)
    if (!model) return null

    const spec = specName ? model.specs.find(s => s.name === specName) : undefined
    const result: AvailableOptions = {
      colors: spec?.colors ?? model.colors,
      specs: model.specs,
      appleCareTiers: getAppleCareTiers(category, modelName, specName),
    }
    if (!spec) return result

    if (category === 'MacBook') {
      result.memoryOptions = filterAtLeast(spec.memoryOptions, spec.constraints?.minMemory, parseMemorySize)
      result.storageOptions = filterAtLeast(spec.storageOptions, spec.constraints?.minStorage, parseStorageSize)
      result.chargerOptions = spec.chargerOptions ? Object.keys(spec.chargerOptions) : undefined
      result.nanoTextureAvailable = typeof spec.nanoTexture === 'number'
      result.nanoTexturePrice = spec.nanoTexture
    }

    if (category === 'iPhone') {
      result.storageOptions = filterAtLeast(spec.storageOptions, spec.constraints?.minStorage, parseStorageSize)
    }

    if (category === 'iPad') {
      result.storageOptions = filterAtLeast(spec.storageOptions, spec.constraints?.minStorage, parseStorageSize)
      result.connectivityOptions = Object.keys(spec.connectivityOptions ?? {})
      result.applePencilOptions = spec.applePencil ?? []
      result.magicKeyboardPrice = spec.magicKeyboard
      result.nanoTextureAvailable = iPadNanoTextureAvailable(spec, selectedStorage)
      result.nanoTexturePrice = spec.nanoTexture
    }

    if (category === 'Apple Watch') {
      result.sizeOptions = Object.keys(spec.sizeOptions ?? {})
      result.connectivityOptions = Object.keys(spec.connectivityOptions ?? {})
      result.bandOptions = spec.bandOptions ?? []
    }

    return result
  }

  function calculatePrice(category: string, modelName: string, specName: string, selected: SelectedOptions = {}): number {
    const spec = getSpecConfiguration(category, modelName, specName)
    return spec ? priceSpec(category, spec, selected) : 0
  }

  function isOffered(item: BasketItemFormData): boolean {
    const options = getAvailableOptions(item.category, item.model, item.specs, item.storage)
    if (!options) return false
    const offered = (value: string | undefined, list: string[] = []) => !value || list.includes(value)
    const bandStyle = options.bandOptions?.find(b => b.material === item.band?.material)?.style.find(s => s.styleName === item.band?.style)
    return (
      offered(item.color, options.colors) &&
      offered(item.storage, options.storageOptions) &&
      offered(item.memory, options.memoryOptions) &&
      offered(item.charger, options.chargerOptions) &&
      offered(item.connectivity, options.connectivityOptions) &&
      offered(item.size, options.sizeOptions) &&
      offered(item.applePencil, options.applePencilOptions?.map(p => p.pencilType)) &&
      (!item.magicKeyboard || options.magicKeyboardPrice !== undefined) &&
      (!item.nanoTexture || !!options.nanoTextureAvailable) &&
      (!item.appleCare || options.appleCareTiers.some(t => t.name === item.appleCare)) &&
      (!item.band ||
        (!!bandStyle &&
          bandStyle.bandColor.includes(item.band.color) &&
          offered(item.band.size, bandSizesFor(bandStyle, item.size)) &&
          (!bandStyle.caseSizes || (!!item.size && bandStyle.caseSizes.includes(item.size)))))
    )
  }

  function priceBasketItem(item: BasketItemFormData): { estimatedPrice: number; discountValue: number } {
    const appleCare = findAppleCareTier(item.category, item.model, item.specs, item.appleCare)?.price ?? 0
    const estimatedPrice =
      calculatePrice(item.category, item.model, item.specs ?? '', {
        memory: item.memory,
        storage: item.storage,
        charger: item.charger,
        connectivity: item.connectivity,
        size: item.size,
        applePencil: item.applePencil,
        magicKeyboard: item.magicKeyboard,
        nanoTexture: item.nanoTexture,
        band: item.band,
      }) + appleCare
    const discountValue = Math.round((estimatedPrice - appleCare) * 0.17 * 100) / 100
    return { estimatedPrice, discountValue }
  }

  return {
    getModelConfigurations,
    getModelConfiguration,
    getSpecConfiguration,
    getAvailableOptions,
    calculatePrice,
    getAppleCareTiers,
    findAppleCareTier,
    isOffered,
    priceBasketItem,
  }
}
