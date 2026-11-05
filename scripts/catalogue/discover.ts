import type { CategoryKey } from '@/lib/catalogue/schema'
import { MissingDataError } from './extract'
import type { Page } from './types'

const ORIGIN = 'https://www.apple.com'

const BUY_SEGMENT: Record<CategoryKey, string> = {
  iPhone: 'iphone',
  iPad: 'ipad',
  MacBook: 'mac',
  'Apple Watch': 'watch',
}

export const LANDING_PAGES: Record<CategoryKey, string> = {
  iPhone: `${ORIGIN}/uk/shop/buy-iphone`,
  iPad: `${ORIGIN}/uk/shop/buy-ipad`,
  MacBook: `${ORIGIN}/uk/shop/buy-mac`,
  'Apple Watch': `${ORIGIN}/uk/shop/buy-watch`,
}

const EXCLUDED_SLUGS = new Set(['studio-display', 'studio-display-xdr'])

export function discoverProductUrls(category: CategoryKey, landing: Page): string[] {
  const prefix = `/uk/shop/buy-${BUY_SEGMENT[category]}/`
  const seen = new Set<string>()
  const re = /href="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(landing.html))) {
    let path = m[1]
    if (path.startsWith(ORIGIN)) path = path.slice(ORIGIN.length)
    if (!path.startsWith(prefix)) continue
    path = path.split(/[?#]/)[0]
    const segments = path.slice(prefix.length).split('/')
    if (!segments[0] || EXCLUDED_SLUGS.has(segments[0])) continue
    seen.add(`${ORIGIN}${path}`)
  }
  if (seen.size === 0) throw new MissingDataError(landing.url, `${category} product links`)
  return [...seen]
}

export function isBuyPage(page: Page): boolean {
  const m = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(page.html)
  if (!m) return false
  let path = m[1]
  if (path.startsWith(ORIGIN)) path = path.slice(ORIGIN.length)
  return /^\/uk\/shop\/buy-(iphone|ipad|mac|watch)\/.+/.test(path)
}
