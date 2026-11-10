import { type Catalogue, type CategoryKey, parseCatalogue } from '@/lib/catalogue/schema'
import { compareStrings, roundToPence } from './util'

const CATEGORY_ORDER: CategoryKey[] = ['iPhone', 'iPad', 'MacBook', 'Apple Watch']

function roundPrices(value: unknown): unknown {
  if (typeof value === 'number') return roundToPence(value)
  if (Array.isArray(value)) return value.map(roundPrices)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, roundPrices(v)]))
  }
  return value
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => compareStrings(a, b))
        .map(([k, v]) => [k, canonical(v)]),
    )
  }
  return value
}

export function canonicalEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
}

function normalise(c: Catalogue): Catalogue {
  return parseCatalogue(roundPrices(c))
}

export function serializeCatalogue(c: Catalogue): string {
  const rounded = normalise(c)
  const ordered = {
    notice: rounded.notice,
    categories: Object.fromEntries(CATEGORY_ORDER.map(key => [key, rounded.categories[key]])),
  }
  return JSON.stringify(ordered, null, 2) + '\n'
}

export function catalogueEquals(a: Catalogue, b: Catalogue): boolean {
  return canonicalEquals(normalise(a), normalise(b))
}
