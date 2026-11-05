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
  return Math.round(n * 100) / 100
}

export function normaliseLabel(raw: string): string {
  return raw.replace(/[‐‑–]/g, '-').replace(/\s+/g, ' ').trim()
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

export function extractLdJsonOffers(html: string, url: string): { sku: string; price: number }[] {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  const out: { sku: string; price: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    let data: unknown
    try {
      data = JSON.parse(m[1])
    } catch {
      continue
    }
    const items = (Array.isArray(data) ? data : [data]) as Record<string, unknown>[]
    for (const item of items) {
      const raw = item?.offers
      const offers = (Array.isArray(raw) ? raw : raw ? [raw] : []) as Record<string, unknown>[]
      for (const o of offers) {
        if (typeof o.sku === 'string' && o.price !== undefined) {
          out.push({ sku: o.sku, price: parsePounds(o.price as string | number) })
        }
      }
    }
  }
  if (out.length === 0) throw new MissingDataError(url, 'ld+json offers')
  return out
}
