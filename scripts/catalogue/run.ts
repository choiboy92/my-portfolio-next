import type { Catalogue, Category, CategoryKey } from '@/lib/catalogue/schema'
import { applyAppleCare, fetchAppleCare } from './applecare'
import { discoverProductUrls, isBuyPage, LANDING_PAGES } from './discover'
import type { Fetcher } from './http'
import { mapIPad, mapIPhone, parseIPadAccessories } from './map-iphone-ipad'
import { mapMac } from './map-mac'
import { mapWatch } from './map-watch'
import { catalogueEquals } from './serialize'
import { summarizeChanges } from './summary'
import type { MapResult, Page } from './types'
import { assembleCatalogue } from './verify'

export type SyncDeps = {
  fetcher: Fetcher
  previous: Catalogue
  bootstrap: boolean
  date: string
}

export type SyncResult = {
  catalogue: Catalogue
  changed: boolean
  summary: string
  warnings: string[]
  keptLastMerged: string[]
}

const CATEGORIES = Object.keys(LANDING_PAGES) as CategoryKey[]

function merge(results: MapResult[]): MapResult {
  return {
    models: results.flatMap(r => r.models),
    unmapped: results.flatMap(r => r.unmapped),
    warnings: results.flatMap(r => r.warnings),
  }
}

async function fetchPage(fetcher: Fetcher, url: string): Promise<Page> {
  return { url, html: await fetcher.text(url) }
}

async function discover(fetcher: Fetcher): Promise<Record<CategoryKey, string[]>> {
  const urls = {} as Record<CategoryKey, string[]>
  for (const category of CATEGORIES) {
    const landing = await fetchPage(fetcher, LANDING_PAGES[category])
    urls[category] = discoverProductUrls(category, landing)
  }
  return urls
}

async function fetchBuyPages(fetcher: Fetcher, urls: Record<CategoryKey, string[]>, warnings: string[]): Promise<Record<CategoryKey, Page[]>> {
  const pages = {} as Record<CategoryKey, Page[]>
  for (const category of CATEGORIES) {
    pages[category] = []
    for (const url of urls[category]) {
      const page = await fetchPage(fetcher, url)
      if (isBuyPage(page)) pages[category].push(page)
      else warnings.push(`${url}: Apple did not serve a buy page (redirected away); skipped`)
    }
  }
  return pages
}

export function carryOverColours(result: MapResult, previous: Category): MapResult {
  const warnings = [...result.warnings]
  const models = result.models.map(m => {
    if (m.model.colors.length > 0) return m
    const kept = Object.hasOwn(previous.models, m.key) ? previous.models[m.key].colors : []
    if (kept.length === 0) {
      warnings.push(`${m.key}: Apple publishes no colour and there are no last-merged colours to keep`)
      return m
    }
    warnings.push(`${m.key}: Apple publishes no colour; kept the last-merged colours (${kept.join(', ')})`)
    return { ...m, model: { ...m.model, colors: [...kept] } }
  })
  return { ...result, models, warnings }
}

async function mapEach(pages: Page[], map: (page: Page) => Promise<MapResult>): Promise<MapResult> {
  const results: MapResult[] = []
  for (const page of pages) results.push(await map(page))
  return merge(results)
}

export async function runSync(deps: SyncDeps): Promise<SyncResult> {
  const { fetcher, previous, bootstrap, date } = deps
  const discoveryWarnings: string[] = []

  const urls = await discover(fetcher)
  const pages = await fetchBuyPages(fetcher, urls, discoveryWarnings)

  const mapped: Record<CategoryKey, MapResult> = {
    iPhone: mapIPhone(pages.iPhone),
    iPad: mapIPad(pages.iPad, parseIPadAccessories(pages.iPad), previous.categories.iPad),
    MacBook: carryOverColours(await mapEach(pages.MacBook, page => mapMac(page, fetcher)), previous.categories.MacBook),
    'Apple Watch': await mapEach(pages['Apple Watch'], page => mapWatch(page, fetcher)),
  }

  const source = await fetchAppleCare(CATEGORIES.flatMap(c => pages[c]), fetcher)
  const appleCare = applyAppleCare(CATEGORIES.flatMap(c => mapped[c].models), source)
  const results = {} as Record<CategoryKey, MapResult>
  for (const category of CATEGORIES) {
    results[category] = { ...mapped[category], models: appleCare.models.filter(m => m.category === category) }
  }

  const assembled = assembleCatalogue(previous, results, { bootstrap })
  const changed = !catalogueEquals(previous, assembled.catalogue)
  const warnings = [...new Set([...discoveryWarnings, ...assembled.warnings, ...appleCare.warnings])]
  const summary = summarizeChanges(previous, assembled.catalogue, {
    warnings,
    unmapped: [...new Set([...assembled.unmapped, ...appleCare.unmapped])],
    requestCount: fetcher.requestCount,
    date,
  })
  return { catalogue: assembled.catalogue, changed, summary, warnings, keptLastMerged: assembled.keptLastMerged }
}
