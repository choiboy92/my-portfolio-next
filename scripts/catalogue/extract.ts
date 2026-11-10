import { isRecord, roundToPence } from './util'

export class MissingDataError extends Error {
  constructor(url: string, blob: string) {
    super(`Missing ${blob} in ${url}`)
    this.name = 'MissingDataError'
  }
}

function balancedEnd(src: string, start: number): number {
  const open = src[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  for (let i = start; i < src.length; i++) {
    const ch = src[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function parseAt(html: string, from: number): unknown {
  let i = from
  while (i < html.length && /\s/.test(html[i])) i++
  if (html[i] !== '{' && html[i] !== '[') return undefined
  const end = balancedEnd(html, i)
  if (end < 0) return undefined
  try {
    return JSON.parse(html.slice(i, end + 1))
  } catch {
    return undefined
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractWindowJson(html: string, url: string, name: string): unknown {
  const marker = new RegExp(`window\\.${escapeRegExp(name)}\\s*=`)
  const m = marker.exec(html)
  if (m) {
    const parsed = parseAt(html, m.index + m[0].length)
    if (parsed !== undefined) return parsed
  }
  throw new MissingDataError(url, `window.${name}`)
}

export function extractKeyedJson(html: string, url: string, key: string): unknown {
  const marker = new RegExp(`(?<![\\w"])${escapeRegExp(key)}\\s*:`, 'g')
  let m: RegExpExecArray | null
  while ((m = marker.exec(html))) {
    const parsed = parseAt(html, m.index + m[0].length)
    if (parsed !== undefined) return parsed
  }
  throw new MissingDataError(url, key)
}

export function parsePounds(value: string | number): number {
  const n = typeof value === 'number' ? value : Number(value.replace(/[£,\s]/g, ''))
  if (!Number.isFinite(n)) throw new Error(`Cannot parse price: ${String(value)}`)
  return roundToPence(n)
}

export function normaliseLabel(raw: string): string {
  return raw.replace(/[‐‑–]/g, '-').replace(/\s+/g, ' ').trim()
}

export function stripHtml(html: string, dropPatterns: RegExp[] = []): string {
  const kept = dropPatterns.reduce((text, pattern) => text.replace(pattern, ' '), html)
  return normaliseLabel(kept.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'))
}

export function ldJsonObjects(html: string): unknown[] {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  const out: unknown[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    let data: unknown
    try {
      data = JSON.parse(m[1])
    } catch {
      continue
    }
    out.push(...(Array.isArray(data) ? data : [data]))
  }
  return out
}

type AnalyticsProduct = { sku: string; partNumber: string; name: string; price: number }

export function extractAnalyticsProducts(html: string, url: string): AnalyticsProduct[] {
  const marker = /"products"\s*:/g
  let m: RegExpExecArray | null
  while ((m = marker.exec(html))) {
    const parsed = parseAt(html, m.index + m[0].length)
    if (!Array.isArray(parsed)) continue
    const out: AnalyticsProduct[] = []
    for (const p of parsed as Record<string, unknown>[]) {
      const price = (p.price as { fullPrice?: unknown } | undefined)?.fullPrice
      if (
        typeof p.sku === 'string' &&
        typeof p.partNumber === 'string' &&
        typeof p.name === 'string' &&
        typeof price === 'number'
      ) {
        out.push({ sku: p.sku, partNumber: p.partNumber, name: p.name, price })
      }
    }
    if (out.length > 0) return out
  }
  throw new MissingDataError(url, 'analytics products')
}

export function productName(html: string): string | undefined {
  for (const item of ldJsonObjects(html)) {
    if (isRecord(item) && item['@type'] === 'Product' && typeof item.name === 'string' && item.name.trim()) return normaliseLabel(item.name)
  }
  return undefined
}

export type PriceTable = Record<string, { amount?: unknown }>

export type DisplayGroup = Record<string, unknown> & { variantOrder?: string[] }

export type ProductSelection<P> = {
  data: Record<string, unknown>
  products: P[]
  display: Record<string, DisplayGroup> & { prices: PriceTable }
}

export function readProductSelection<P>(bootstrap: unknown, url: string, displayKey: string): ProductSelection<P> {
  if (!isRecord(bootstrap) || !Array.isArray(bootstrap.products) || bootstrap.products.length === 0) {
    throw new MissingDataError(url, 'productSelectionData.products')
  }
  const display = bootstrap[displayKey]
  if (!isRecord(display) || !isRecord(display.prices)) throw new MissingDataError(url, `productSelectionData.${displayKey}.prices`)
  return { data: bootstrap, products: bootstrap.products as P[], display: display as ProductSelection<P>['display'] }
}

export function amountOf(prices: Record<string, unknown>, key: string): number | undefined {
  const entry = prices[key]
  const amount = isRecord(entry) ? entry.amount : undefined
  return typeof amount === 'number' || typeof amount === 'string' ? parsePounds(amount) : undefined
}

export function displayHeader(group: DisplayGroup | undefined, value: string): string | undefined {
  const entry = group?.[value]
  return isRecord(entry) && typeof entry.header === 'string' ? entry.header : undefined
}
