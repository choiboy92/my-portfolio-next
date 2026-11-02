const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeStrings<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/[&<>"']/g, char => ENTITIES[char]) as T
  if (Array.isArray(value)) return value.map(escapeStrings) as T
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, escapeStrings(entry)])) as T
  }
  return value
}
