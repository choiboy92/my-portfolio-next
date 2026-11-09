import { makeCatalogueHelpers } from '@/lib/catalogue/helpers'
import { CATALOGUE_NOTICE, parseCatalogue, type Catalogue, type CategoryKey, type Model } from '@/lib/catalogue/schema'
import type { MapResult, MappedModel } from './types'

export class GuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GuardError'
  }
}

export type SelfCheckFailure = {
  category: CategoryKey
  model: string
  spec: string
  label: string
  expected: number
  actual: number
}

const MAX_REMOVED_SHARE = 0.3

function oneModelCatalogue(mapped: MappedModel): Catalogue {
  const empty = (category: string) => ({ category, appleCareAvailable: false, models: {} as Record<string, Model> })
  return {
    notice: CATALOGUE_NOTICE,
    categories: {
      iPhone: empty('iPhone'),
      iPad: empty('iPad'),
      MacBook: empty('MacBook'),
      'Apple Watch': empty('Apple Watch'),
      [mapped.category]: { category: mapped.category, appleCareAvailable: false, models: { [mapped.key]: mapped.model } },
    },
  }
}

function checkModel(mapped: MappedModel): SelfCheckFailure[] {
  const base = { category: mapped.category, model: mapped.key }
  if (mapped.model.specs.length === 0 && mapped.published.length === 0) {
    return [{ ...base, spec: '', label: 'no specs and nothing published', expected: 0, actual: 0 }]
  }
  const { calculatePrice } = makeCatalogueHelpers(oneModelCatalogue(mapped))
  const failures: SelfCheckFailure[] = []
  for (const published of mapped.published) {
    const known = mapped.model.specs.some(spec => spec.name === published.spec)
    const actual = known ? calculatePrice(mapped.category, mapped.key, published.spec, published.options) : 0
    if (!known || Math.round(actual * 100) !== Math.round(published.price * 100)) {
      failures.push({ ...base, spec: published.spec, label: published.label, expected: published.price, actual })
    }
  }
  for (const spec of mapped.model.specs) {
    if (!mapped.published.some(published => published.spec === spec.name)) {
      failures.push({ ...base, spec: spec.name, label: `${mapped.key} / ${spec.name}: no Apple-published price to verify`, expected: 0, actual: 0 })
    }
  }
  return failures
}

export function selfCheck(mapped: MappedModel[]): { passed: MappedModel[]; failures: SelfCheckFailure[] } {
  const passed: MappedModel[] = []
  const failures: SelfCheckFailure[] = []
  for (const model of mapped) {
    const found = checkModel(model)
    if (found.length === 0) passed.push(model)
    else failures.push(...found)
  }
  return { passed, failures }
}

function pounds(value: number): string {
  return `£${value}`
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

export function assembleCatalogue(
  previous: Catalogue,
  results: Record<CategoryKey, MapResult>,
  opts: { bootstrap: boolean }
): { catalogue: Catalogue; warnings: string[]; unmapped: string[]; keptLastMerged: string[] } {
  const warnings: string[] = []
  const unmapped: string[] = []
  const keptLastMerged: string[] = []
  const categories = {} as Catalogue['categories']

  for (const key of Object.keys(previous.categories) as CategoryKey[]) {
    const prevCategory = previous.categories[key]
    const result = Object.hasOwn(results, key) ? results[key] : undefined
    if (!result) {
      categories[key] = prevCategory
      continue
    }

    unmapped.push(...result.unmapped)
    warnings.push(...result.warnings)

    const { failures } = selfCheck(result.models)
    const failedKeys = new Set(failures.map(f => f.model))
    const models: Record<string, Model> = {}

    for (const mapped of result.models) {
      if (!failedKeys.has(mapped.key)) {
        models[mapped.key] = mapped.model
        continue
      }
      const mine = failures.filter(f => f.model === mapped.key)
      const describe = (list: SelfCheckFailure[]) =>
        list.map(f => (f.expected === 0 && f.actual === 0 ? f.label : `${f.label} expected ${pounds(f.expected)}, got ${pounds(f.actual)}`)).join('; ')
      const failedSpecs = new Set(mine.map(f => f.spec))
      const passing = failedSpecs.has('') ? [] : mapped.model.specs.filter(spec => !failedSpecs.has(spec.name))
      if (passing.length > 0) {
        models[mapped.key] = { ...mapped.model, specs: passing }
        warnings.push(`⚠️ ${mapped.key}: ${failedSpecs.size} spec(s) held back — ${describe(mine)}; shipped the rest`)
        continue
      }
      const detail = describe(mine)
      if (Object.hasOwn(prevCategory.models, mapped.key)) {
        models[mapped.key] = prevCategory.models[mapped.key]
        keptLastMerged.push(mapped.key)
        warnings.push(`⚠️ ${mapped.key}: kept last-merged entry — ${detail} (last-merged data, not re-verified against Apple today)`)
      } else {
        warnings.push(`⚠️ ${mapped.key}: new product held back — ${detail}`)
      }
    }

    const previousKeys = Object.keys(prevCategory.models)
    const removed = previousKeys.filter(k => !Object.hasOwn(models, k)).length
    if (Object.keys(models).length === 0) {
      throw new GuardError(`${key}: the sync would leave the category with no models`)
    }
    if (!opts.bootstrap && previousKeys.length > 0 && removed / previousKeys.length > MAX_REMOVED_SHARE) {
      throw new GuardError(`${key}: the sync would remove ${removed} of ${previousKeys.length} models (more than 30%); rerun with --bootstrap if intended`)
    }

    categories[key] = { ...prevCategory, models }
  }

  const catalogue = parseCatalogue({ notice: previous.notice, categories })
  return { catalogue, warnings: dedupe(warnings), unmapped: dedupe(unmapped), keptLastMerged: dedupe(keptLastMerged) }
}
