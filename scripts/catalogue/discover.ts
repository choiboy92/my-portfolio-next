import type { CategoryKey } from '@/lib/catalogue/schema'
import { MissingDataError } from './extract'
import type { Page } from './types'
import { unique } from './util'

const ORIGIN = 'https://www.apple.com'

const BUY_SEGMENT: Record<CategoryKey, string> = {
  iPhone: 'iphone',
  iPad: 'ipad',
  MacBook: 'mac',
  'Apple Watch': 'watch',
}

export const LANDING_PAGES = Object.fromEntries(
  Object.entries(BUY_SEGMENT).map(([category, segment]) => [category, `${ORIGIN}/uk/shop/buy-${segment}`]),
) as Record<CategoryKey, string>

const BUY_PAGE_PATH = new RegExp(`^/uk/shop/buy-(${Object.values(BUY_SEGMENT).join('|')})/.+`)

const EXCLUDED_SLUGS = new Set(['studio-display', 'studio-display-xdr'])

function toPath(url: string): string {
  const parsed = URL.parse(url, ORIGIN)
  return parsed?.origin === ORIGIN ? parsed.pathname : ''
}

export function discoverProductUrls(category: CategoryKey, landing: Page): string[] {
  const prefix = `/uk/shop/buy-${BUY_SEGMENT[category]}/`
  const found: string[] = []
  for (const m of landing.html.matchAll(/href="([^"]+)"/g)) {
    const href = toPath(m[1])
    if (!href.startsWith(prefix)) continue
    const path = href.split(/[?#]/)[0]
    const slug = path.slice(prefix.length).split('/')[0]
    if (!slug || EXCLUDED_SLUGS.has(slug)) continue
    found.push(`${ORIGIN}${path}`)
  }
  if (found.length === 0) throw new MissingDataError(landing.url, `${category} product links`)
  return unique(found)
}

export function isBuyPage(page: Page): boolean {
  const m = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(page.html)
  return !!m && BUY_PAGE_PATH.test(toPath(m[1]))
}
