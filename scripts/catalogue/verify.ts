import { formatPounds } from '@/lib/catalogue/format'
import { priceSpec } from '@/lib/catalogue/helpers'
import { parseCatalogue, type Catalogue, type CategoryKey, type Model, type Spec } from '@/lib/catalogue/schema'
import type { MapResult, MappedModel } from './types'
import { toPence, unique } from './util'

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

function checkModel(mapped: MappedModel): SelfCheckFailure[] {
  const base = { category: mapped.category, model: mapped.key }
  if (mapped.model.specs.length === 0 && mapped.published.length === 0) {
    return [{ ...base, spec: '', label: 'no specs and nothing published', expected: 0, actual: 0 }]
  }
  const failures: SelfCheckFailure[] = []
  for (const published of mapped.published) {
    const spec = mapped.model.specs.find(s => s.name === published.spec)
    const actual = spec ? priceSpec(mapped.category, spec, published.options) : 0
    if (!spec || toPence(actual) !== toPence(published.price)) {
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

export function selfCheck(mapped: MappedModel[]): SelfCheckFailure[] {
  return mapped.flatMap(checkModel)
}

function describeFailures(list: SelfCheckFailure[]): string {
  return list.map(f => (f.expected === 0 && f.actual === 0 ? f.label : `${f.label} expected ${formatPounds(f.expected)}, got ${formatPounds(f.actual)}`)).join('; ')
}

function withLastMergedSpecs(fresh: Spec[], failed: Set<string>, previous: Model | undefined): { specs: Spec[]; kept: Spec[] } {
  const kept = previous ? previous.specs.filter(s => failed.has(s.name)) : []
  const specs = fresh.flatMap(s => (failed.has(s.name) ? kept.filter(k => k.name === s.name) : [s]))
  for (const k of kept) if (!specs.includes(k)) specs.push(k)
  return { specs, kept }
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

    const failures = selfCheck(result.models)
    const failedKeys = new Set(failures.map(f => f.model))
    const models: Record<string, Model> = {}

    for (const mapped of result.models) {
      if (!failedKeys.has(mapped.key)) {
        models[mapped.key] = mapped.model
        continue
      }
      const mine = failures.filter(f => f.model === mapped.key)
      const failedSpecs = new Set(mine.map(f => f.spec))
      const previousModel = Object.hasOwn(prevCategory.models, mapped.key) ? prevCategory.models[mapped.key] : undefined
      const passing = failedSpecs.has('') ? [] : mapped.model.specs.filter(spec => !failedSpecs.has(spec.name))
      if (passing.length > 0) {
        const { specs, kept } = withLastMergedSpecs(mapped.model.specs, failedSpecs, previousModel)
        const keptNames = new Set(kept.map(s => s.name))
        const dropped = mine.filter(f => !keptNames.has(f.spec))
        models[mapped.key] = { ...mapped.model, specs }
        if (kept.length > 0) {
          keptLastMerged.push(mapped.key)
          warnings.push(
            `⚠️ ${mapped.key}: kept last-merged spec(s) ${[...keptNames].join(', ')} — ${describeFailures(mine.filter(f => keptNames.has(f.spec)))} (last-merged data, not re-verified against Apple today)`,
          )
        }
        if (dropped.length > 0) {
          warnings.push(`⚠️ ${mapped.key}: ${new Set(dropped.map(f => f.spec)).size} spec(s) held back — ${describeFailures(dropped)}; shipped the rest`)
        }
        continue
      }
      const detail = describeFailures(mine)
      if (previousModel) {
        models[mapped.key] = previousModel
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
  return { catalogue, warnings: unique(warnings), unmapped: unique(unmapped), keptLastMerged: unique(keptLastMerged) }
}
