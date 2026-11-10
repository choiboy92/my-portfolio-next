export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function rankIn(order: string[] | undefined, value: string | undefined): number {
  const i = value === undefined ? -1 : (order ?? []).indexOf(value)
  return i < 0 ? Infinity : i
}

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)]
}

export function uniqueBy<T>(items: T[], key: (item: T) => unknown): T[] {
  const seen = new Set<unknown>()
  return items.filter(item => {
    const id = key(item)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function toPence(n: number): number {
  return Math.round(n * 100)
}

export function roundToPence(n: number): number {
  return toPence(n) / 100
}
