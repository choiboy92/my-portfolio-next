import type { AppleCareTier } from '@/lib/catalogue/schema'
import { extractKeyedJson, MissingDataError, normaliseLabel, parsePounds } from './extract'
import { FetchFailedError, type Fetcher } from './http'
import type { MappedModel, Page } from './types'

export type AppleCareRow = {
  page: string
  wuip: string
  familyType?: string
  tiers: AppleCareTier[]
}

export type MacProduct = {
  family: string
  size: number
  chips: string[]
}

export type AppleCareSource = {
  rows: AppleCareRow[]
  products: Record<string, MacProduct>
  unmapped: string[]
  warnings: string[]
}

type RawPlanDetail = {
  partNumber?: unknown
  rawPrice?: unknown
  dimensionPaymentType?: { value?: unknown }
}

type RawPlan = {
  appleCareType?: unknown
  additionalData?: { tileHeader?: unknown }
  moreOptions?: { planDetails?: RawPlanDetail[] }
}

type RawRow = {
  compatibleWuip?: unknown
  familyType?: unknown
  appleCarePlans?: RawPlan[]
}

const PRODUCT_URL = 'https://www.apple.com/uk/shop/product/'
const MAC_NOTEBOOK_WUIP = /^MACBOOK(PRO|AIR)_/
const PRODUCT_TITLE = /^AppleCare\+ for (\d+)-inch (MacBook\b[^()]*?)(?: \(([^)]*)\))?(?: - Apple\b.*)?$/

function plain(raw: string): string {
  return normaliseLabel(raw.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' '))
}

function billingOf(value: unknown): AppleCareTier['billing'] | undefined {
  if (value === 'monthly') return 'monthly'
  if (value === 'annually') return 'annual'
  return undefined
}

const money = (n: number) => (Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`)

function tiersOf(plan: RawPlan, label: string, warnings: string[]): AppleCareTier[] {
  const header = typeof plan.additionalData?.tileHeader === 'string' ? plain(plan.additionalData.tileHeader) : ''
  if (!header) {
    warnings.push(`AppleCare+ ${label}: plan has no tile header; plan skipped`)
    return []
  }
  const tiers: AppleCareTier[] = []
  for (const detail of plan.moreOptions?.planDetails ?? []) {
    const part = typeof detail.partNumber === 'string' ? detail.partNumber : undefined
    const billing = billingOf(detail.dimensionPaymentType?.value)
    const rawPrice = detail.rawPrice
    const priceOk = typeof rawPrice === 'number' || (typeof rawPrice === 'string' && rawPrice.trim() !== '' && Number.isFinite(Number(rawPrice)))
    if (!part || !billing || !priceOk) {
      const why = !part ? 'no part number' : !billing ? `unrecognised billing "${String(detail.dimensionPaymentType?.value)}"` : 'non-numeric price'
      warnings.push(`AppleCare+ ${part ?? label}: ${why}; plan detail skipped`)
      continue
    }
    tiers.push({
      name: `${header} (${billing === 'monthly' ? 'Monthly' : 'Annual'})`,
      price: parsePounds(rawPrice),
      billing,
      partNumber: part,
    })
  }
  const rank = (t: AppleCareTier) => (t.billing === 'monthly' ? 0 : 1)
  return tiers.map((t, i) => ({ t, i })).sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i).map(x => x.t)
}

function oneDescription(plan: RawPlan): string[] {
  const header = typeof plan.additionalData?.tileHeader === 'string' ? plain(plan.additionalData.tileHeader) : 'AppleCare One'
  return (plan.moreOptions?.planDetails ?? []).flatMap(d => {
    const billing = billingOf(d.dimensionPaymentType?.value)
    if (typeof d.partNumber !== 'string' || typeof d.rawPrice !== 'number') return []
    return [`${header} ${d.partNumber} ${money(d.rawPrice)}${billing === 'annual' ? '/yr' : '/mo'} (multi-device subscription, not a per-product plan)`]
  })
}

function readRows(page: Page, source: AppleCareSource, seenWuips: Set<string>): void {
  let data: unknown
  try {
    data = extractKeyedJson(page.html, page.url, 'appleCareData')
  } catch (err) {
    if (err instanceof MissingDataError) return
    throw err
  }
  if (!Array.isArray(data)) return
  for (const raw of data as RawRow[]) {
    if (typeof raw.compatibleWuip !== 'string') continue
    const plans = raw.appleCarePlans ?? []
    for (const plan of plans) {
      if (plan.appleCareType !== 'acmultipart') continue
      for (const text of oneDescription(plan)) if (!source.unmapped.includes(text)) source.unmapped.push(text)
    }
    if (seenWuips.has(raw.compatibleWuip)) continue
    seenWuips.add(raw.compatibleWuip)
    const tiers = plans.filter(p => p.appleCareType === 'acp' || p.appleCareType === 'acptl').flatMap(p => tiersOf(p, typeof raw.familyType === 'string' ? plain(raw.familyType) : String(raw.compatibleWuip), source.warnings))
    const row: AppleCareRow = { page: page.url, wuip: raw.compatibleWuip, tiers }
    if (typeof raw.familyType === 'string') row.familyType = plain(raw.familyType)
    source.rows.push(row)
  }
}

function productNames(html: string): string[] {
  const names: string[] = []
  const ld = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m: RegExpExecArray | null
  while ((m = ld.exec(html))) {
    try {
      const data = JSON.parse(m[1]) as unknown
      for (const item of (Array.isArray(data) ? data : [data]) as Record<string, unknown>[]) {
        if (item?.['@type'] === 'Product' && typeof item.name === 'string') names.push(item.name)
      }
    } catch {
      continue
    }
  }
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  if (title) names.push(title)
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]
  if (h1) names.push(h1.replace(/<[^>]*>/g, ' '))
  return names
}

export function parseProductTitle(html: string): MacProduct | undefined {
  for (const name of productNames(html)) {
    const m = PRODUCT_TITLE.exec(normaliseLabel(name))
    if (!m) continue
    const chips = (m[3] ?? '').split('/').map(c => normaliseLabel(c)).filter(Boolean)
    return { family: m[2], size: Number(m[1]), chips }
  }
  return undefined
}

export async function fetchAppleCare(pages: Page[], fetcher: Fetcher): Promise<AppleCareSource> {
  const source: AppleCareSource = { rows: [], products: {}, unmapped: [], warnings: [] }
  const seen = new Set<string>()
  for (const page of pages) readRows(page, source, seen)

  const parts = new Set<string>()
  for (const row of source.rows) {
    if (!MAC_NOTEBOOK_WUIP.test(row.wuip)) continue
    for (const tier of row.tiers) if (tier.partNumber) parts.add(tier.partNumber)
  }
  for (const part of parts) {
    let html: string
    try {
      html = await fetcher.text(`${PRODUCT_URL}${part}`)
    } catch (err) {
      if (err instanceof FetchFailedError && (err.status === 404 || err.status === 410)) {
        source.warnings.push(`AppleCare+ plan ${part}: product page not found — tier left unattributed`)
        continue
      }
      throw err
    }
    const product = parseProductTitle(html)
    if (product) source.products[part] = product
    else source.warnings.push(`AppleCare+ ${part}: product page title does not name a MacBook size; tier left unattributed`)
  }
  return source
}

function chipOf(specName: string): string | undefined {
  const chip = /^(.*?) \d+-Core CPU/.exec(specName)?.[1]
  return chip && /^M\d/.test(chip) ? chip : undefined
}

function dedupe(tiers: AppleCareTier[]): AppleCareTier[] {
  const seen = new Set<string>()
  return tiers.filter(t => {
    const id = t.partNumber ?? t.name
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function duplicateBilling(tiers: AppleCareTier[]): boolean {
  return new Set(tiers.map(t => t.billing)).size !== tiers.length
}

type Resolved = { tiers: AppleCareTier[] } | { reason: string }

function fromRow(rows: AppleCareRow[]): Resolved {
  const tiers = dedupe(rows.flatMap(r => r.tiers))
  if (tiers.length === 0) return { reason: 'no AppleCare+ data from Apple' }
  if (duplicateBilling(tiers)) return { reason: 'Apple lists more than one plan per billing period and nothing says which applies' }
  return { tiers }
}

function pageRows(m: MappedModel, source: AppleCareSource): AppleCareRow[] {
  return m.page ? source.rows.filter(r => r.page === m.page) : []
}

function resolveWatch(m: MappedModel, source: AppleCareSource): Resolved {
  const n = /^Apple Watch Series (\d+)$/.exec(m.key)?.[1]
  if (n) return fromRow(source.rows.filter(r => r.wuip === `CS${n}_APPLEWATCH`))
  return fromRow(pageRows(m, source))
}

function resolveSized(line: string, size: number, specName: string, rows: AppleCareRow[], source: AppleCareSource): Resolved {
  if (rows.length === 0) return { reason: 'no AppleCare+ data from Apple' }
  const chip = chipOf(specName)
  const tiers = dedupe(rows.flatMap(r => r.tiers)).filter(t => {
    const p = t.partNumber ? source.products[t.partNumber] : undefined
    if (!p || p.size !== size || !line.startsWith(p.family)) return false
    return !chip || p.chips.length === 0 || p.chips.includes(chip)
  })
  if (tiers.length === 0) return { reason: 'no AppleCare+ plan could be attributed to this size and chip' }
  if (duplicateBilling(tiers)) return { reason: 'several AppleCare+ plans match this size and chip and nothing says which applies' }
  return { tiers }
}

function resolve(m: MappedModel, specName: string, source: AppleCareSource): Resolved {
  if (m.category === 'iPhone' || m.category === 'iPad') {
    return fromRow(source.rows.filter(r => r.familyType === specName))
  }
  if (m.category === 'Apple Watch') return resolveWatch(m, source)
  const sized = /^(.+) (\d+)"$/.exec(m.key)
  if (!sized) return fromRow(pageRows(m, source))
  return resolveSized(sized[1], Number(sized[2]), specName, pageRows(m, source), source)
}

export function applyAppleCare(
  models: MappedModel[],
  source: AppleCareSource,
): { models: MappedModel[]; warnings: string[]; unmapped: string[] } {
  const warnings = [...source.warnings]
  const out = models.map(m => {
    const specs = m.model.specs.map(spec => {
      const resolved = resolve(m, spec.name, source)
      if ('reason' in resolved) {
        const text = `${m.key} / ${spec.name}: ${resolved.reason}; AppleCare+ left empty`
        if (!warnings.includes(text)) warnings.push(text)
        return { ...spec, appleCare: [] }
      }
      return { ...spec, appleCare: resolved.tiers.map(t => ({ ...t })) }
    })
    return { ...m, model: { ...m.model, specs } }
  })
  return { models: out, warnings, unmapped: [...source.unmapped] }
}
