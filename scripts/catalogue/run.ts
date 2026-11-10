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
import { unique } from './util'
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

async function mapCategories<T>(fn: (category: CategoryKey) => Promise<T>): Promise<Record<CategoryKey, T>> {
  const out: Partial<Record<CategoryKey, T>> = {}
  for (const category of CATEGORIES) out[category] = await fn(category)
  return out as Record<CategoryKey, T>
}

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

function discover(fetcher: Fetcher): Promise<Record<CategoryKey, string[]>> {
  return mapCategories(async category => discoverProductUrls(category, await fetchPage(fetcher, LANDING_PAGES[category])))
}

function fetchBuyPages(fetcher: Fetcher, urls: Record<CategoryKey, string[]>, warnings: string[]): Promise<Record<CategoryKey, Page[]>> {
  return mapCategories(async category => {
    const pages: Page[] = []
    for (const url of urls[category]) {
      const page = await fetchPage(fetcher, url)
      if (isBuyPage(page)) pages.push(page)
      else warnings.push(`${url}: Apple did not serve a buy page (redirected away); skipped`)
    }
    return pages
  })
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
  for (const page of pages) {
    const result = await map(page)
    results.push({ ...result, models: result.models.map(m => ({ ...m, page: page.url })) })
  }
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
  const results = Object.fromEntries(
    CATEGORIES.map(category => [category, { ...mapped[category], models: appleCare.models.filter(m => m.category === category) }]),
  ) as Record<CategoryKey, MapResult>

  const assembled = assembleCatalogue(previous, results, { bootstrap })
  const changed = !catalogueEquals(previous, assembled.catalogue)
  const warnings = unique([...discoveryWarnings, ...assembled.warnings, ...appleCare.warnings])
  const summary = summarizeChanges(previous, assembled.catalogue, {
    warnings,
    unmapped: unique([...assembled.unmapped, ...appleCare.unmapped]),
    requestCount: fetcher.requestCount,
    date,
  })
  return { catalogue: assembled.catalogue, changed, summary, warnings, keptLastMerged: assembled.keptLastMerged }
}
