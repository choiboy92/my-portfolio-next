import { type Catalogue, type CategoryKey, parseCatalogue } from '@/lib/catalogue/schema'

const CATEGORY_ORDER: CategoryKey[] = ['iPhone', 'iPad', 'MacBook', 'Apple Watch']

function roundToPence(value: unknown): unknown {
  if (typeof value === 'number') return Math.round(value * 100) / 100
  if (Array.isArray(value)) return value.map(roundToPence)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, roundToPence(v)]))
  }
  return value
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonical(v)]),
    )
  }
  return value
}

function normalise(c: Catalogue): Catalogue {
  return parseCatalogue(roundToPence(parseCatalogue(c)))
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
  return JSON.stringify(canonical(normalise(a))) === JSON.stringify(canonical(normalise(b)))
}
