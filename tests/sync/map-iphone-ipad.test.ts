import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { makeCatalogueHelpers } from '@/lib/catalogue/helpers'
import { CATALOGUE_NOTICE, parseCatalogue, type Category } from '@/lib/catalogue/schema'
import { MissingDataError, normaliseLabel } from '@/scripts/catalogue/extract'
import { mapIPad, mapIPhone, parseIPadAccessories } from '@/scripts/catalogue/map-iphone-ipad'
import type { MappedModel, Page } from '@/scripts/catalogue/types'

const fx = (name: string) => readFileSync(`tests/fixtures/apple/${name}`, 'utf8')
const page = (file: string, url: string): Page => ({ url, html: fx(file) })

const iphonePage = page('iphone-iphone-18-pro.html', 'https://www.apple.com/uk/shop/buy-iphone/iphone-18-pro')
const ipadProPage = page('ipad-ipad-pro.html', 'https://www.apple.com/uk/shop/buy-ipad/ipad-pro')
const accessoryPages = [
  ipadProPage,
  page('ipad-ipad-air-accessories.html', 'https://www.apple.com/uk/shop/buy-ipad/ipad-air'),
  page('ipad-ipad-accessories.html', 'https://www.apple.com/uk/shop/buy-ipad/ipad'),
  page('ipad-ipad-mini-accessories.html', 'https://www.apple.com/uk/shop/buy-ipad/ipad-mini'),
]
const emptyPrevious: Category = { category: 'iPad', appleCareAvailable: true, models: {} }

function catalogueOf(iphone: MappedModel[], ipad: MappedModel[]) {
  const toCategory = (name: string, models: MappedModel[]): Category => ({
    category: name,
    appleCareAvailable: true,
    models: Object.fromEntries(models.map(m => [m.key, m.model])),
  })
  return parseCatalogue({
    notice: CATALOGUE_NOTICE,
    categories: {
      iPhone: toCategory('iPhone', iphone),
      iPad: toCategory('iPad', ipad),
      MacBook: toCategory('MacBook', []),
      'Apple Watch': toCategory('Apple Watch', []),
    },
  })
}

describe('normaliseLabel', () => {
  it('folds non-breaking spaces and non-breaking hyphens', () => {
    expect(normaliseLabel('iPhone 18 Pro Wi‑Fi')).toBe('iPhone 18 Pro Wi-Fi')
  })
})

describe('mapIPhone', () => {
  const result = mapIPhone([iphonePage])
  const model = result.models[0].model

  it('maps one model keyed by the family name', () => {
    expect(result.models).toHaveLength(1)
    expect(result.models[0]).toMatchObject({ category: 'iPhone', key: 'iPhone 18 Pro & Pro Max' })
    expect(model.displayName).toBe('iPhone 18 Pro & Pro Max')
    expect(model.colors).toEqual(['Black', 'Burgundy', 'Glacier', 'Silver'])
    expect(result.unmapped).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('derives specs with base price, storage deltas and part number', () => {
    expect(model.specs.map(s => [s.name, s.price])).toEqual([
      ['iPhone 18 Pro', 1199],
      ['iPhone 18 Pro Max', 1299],
    ])
    for (const spec of model.specs) {
      expect(spec.storageOptions).toEqual({ '256GB': 0, '512GB': 200, '1TB': 600, '2TB': 1200 })
      expect(spec.constraints).toEqual({ minStorage: '256GB' })
      expect(spec.appleCare).toEqual([])
      expect(spec.colors).toEqual(['Black', 'Burgundy', 'Glacier', 'Silver'])
    }
    expect(model.specs[0].partNumber).toBe('MJRP4QN/A')
    expect(model.specs[1].partNumber).toBe('MJXP4QN/A')
  })

  it('publishes every SKU and the helpers reproduce each price', () => {
    expect(result.models[0].published).toHaveLength(32)
    const helpers = makeCatalogueHelpers(catalogueOf(result.models, []))
    for (const p of result.models[0].published) {
      expect(helpers.calculatePrice('iPhone', result.models[0].key, p.spec, p.options), p.label).toBe(p.price)
    }
  })

  it('sends unparseable names to unmapped', () => {
    const html = iphonePage.html.replace(/iPhone\s18\sPro 1TB Black/, 'iPhone 18 Pro Mystery Black')
    const odd = mapIPhone([{ ...iphonePage, html }])
    expect(odd.unmapped.join()).toContain('Mystery')
    expect(odd.models[0].published).toHaveLength(32 - odd.unmapped.length)
  })

  it('rejects pages without a products list', () => {
    expect(() => mapIPhone([{ url: 'u', html: '<html></html>' }])).toThrow(MissingDataError)
    expect(() => mapIPhone([{ url: 'u', html: '{"products":[]}' }])).toThrow(MissingDataError)
  })
})

describe('mapIPad', () => {
  const accessories = parseIPadAccessories(accessoryPages)
  const result = mapIPad([ipadProPage], accessories, emptyPrevious)
  const model = result.models[0].model
  const [spec11, spec13] = model.specs

  it('maps the iPad Pro model and specs', () => {
    expect(result.models[0]).toMatchObject({ category: 'iPad', key: 'iPad Pro' })
    expect(model.displayName).toBe('iPad Pro')
    expect(model.colors).toEqual(['Silver', 'Space Black'])
    expect(result.unmapped).toEqual([])
    expect(result.warnings).toEqual([])
    expect(model.specs.map(s => [s.name, s.price])).toEqual([
      ['11-inch iPad Pro', 1199],
      ['13-inch iPad Pro', 1499],
    ])
  })

  it('derives storage, connectivity and nano-texture deltas', () => {
    expect(spec11.storageOptions).toEqual({ '256GB': 0, '512GB': 200, '1TB': 600, '2TB': 1100 })
    expect(spec13.storageOptions).toEqual({ '256GB': 0, '512GB': 200, '1TB': 600, '2TB': 1100 })
    for (const spec of [spec11, spec13]) {
      expect(spec.connectivityOptions).toEqual({ 'Wi-Fi': 0, 'Wi-Fi + Cellular': 200 })
      expect(spec.nanoTexture).toBe(100)
      expect(spec.constraints).toEqual({ minStorage: '256GB', minStorageForNanotexture: '1TB' })
      expect(spec.appleCare).toEqual([])
    }
    expect(spec11.partNumber).toBe('MDWK4KN/A')
  })

  it('takes Pencil and Magic Keyboard prices from the accessory slots', () => {
    expect(spec11.applePencil).toEqual([
      { pencilType: 'None', price: 0 },
      { pencilType: 'Apple Pencil Pro', price: 129 },
      { pencilType: 'Apple Pencil (USB-C)', price: 79 },
    ])
    expect(spec11.magicKeyboard).toBe(299)
    expect(spec13.magicKeyboard).toBe(349)
  })

  it('publishes every SKU and the helpers reproduce each price', () => {
    expect(result.models[0].published).toHaveLength(48)
    const helpers = makeCatalogueHelpers(catalogueOf([], result.models))
    for (const p of result.models[0].published) {
      expect(helpers.calculatePrice('iPad', 'iPad Pro', p.spec, p.options), p.label).toBe(p.price)
    }
  })

  it('sends SKUs with an unknown token to unmapped', () => {
    const html = ipadProPage.html.replace(/("name":"[^"]*?)with nano-texture glass/, '$1with matte glass')
    const odd = mapIPad([{ ...ipadProPage, html }], accessories, emptyPrevious)
    expect(odd.unmapped).toHaveLength(1)
    expect(odd.unmapped[0]).toContain('matte glass')
    expect(odd.models[0].published).toHaveLength(47)
  })

  it('keeps previous pencil types with refreshed prices when a page has no accessory slots', () => {
    const previous: Category = {
      category: 'iPad',
      appleCareAvailable: true,
      models: {
        'iPad Pro': {
          ...model,
          specs: model.specs.map(s => ({
            ...s,
            applePencil: [
              { pencilType: 'None', price: 0 },
              { pencilType: 'Apple Pencil Pro', price: 1 },
              { pencilType: 'Apple Pencil (USB-C)', price: 2 },
            ],
            magicKeyboard: 5,
          })),
        },
      },
    }
    const mini = parseIPadAccessories([accessoryPages[3]])
    const fallback = mapIPad([ipadProPage], mini, previous)
    expect(fallback.warnings.join()).toContain('iPad Pro')
    expect(fallback.models[0].model.specs[0].applePencil).toEqual([
      { pencilType: 'None', price: 0 },
      { pencilType: 'Apple Pencil Pro', price: 129 },
      { pencilType: 'Apple Pencil (USB-C)', price: 79 },
    ])
    expect(fallback.models[0].model.specs[0].magicKeyboard).toBe(5)
  })
})

describe('parseIPadAccessories', () => {
  const accessories = parseIPadAccessories(accessoryPages)

  it('reads pencils per iPad model', () => {
    expect(accessories.pencils['iPad Pro']).toHaveLength(2)
    expect(accessories.pencils['iPad Air']).toHaveLength(2)
    expect(accessories.pencils['iPad mini']).toEqual(
      expect.arrayContaining([
        { pencilType: 'Apple Pencil Pro', price: 129 },
        { pencilType: 'Apple Pencil (USB-C)', price: 79 },
      ]),
    )
    expect(accessories.pencils['iPad']).toEqual([
      { pencilType: 'Apple Pencil (USB-C)', price: 79 },
      { pencilType: 'Apple Pencil (1st Generation)', price: 99 },
    ])
  })

  it('picks the British English keyboard by size slot', () => {
    expect(accessories.magicKeyboard).toEqual({
      'iPad Pro:11inch': 299,
      'iPad Pro:13inch': 349,
      'iPad Air:11inch': 269,
      'iPad Air:13inch': 299,
      iPad: 249,
    })
  })
})
