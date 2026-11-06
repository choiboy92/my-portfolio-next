import type { AppleCareTier } from '@/lib/catalogue/schema'
import { extractKeyedJson, MissingDataError, normaliseLabel, parsePounds } from './extract'
import type { Fetcher } from './http'
import type { MappedModel, Page } from './types'

export type AppleCareRow = {
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
const PRODUCT_TITLE = /AppleCare\+ for (\d+)[‐‑–-]inch (MacBook (?:Pro|Air))(?: \(([^)]*)\))?/

function plain(raw: string): string {
  return normaliseLabel(raw.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' '))
}

function billingOf(value: unknown): AppleCareTier['billing'] | undefined {
  if (value === 'monthly') return 'monthly'
  if (value === 'annually') return 'annual'
  return undefined
}

function tiersOf(plan: RawPlan): AppleCareTier[] {
  const header = typeof plan.additionalData?.tileHeader === 'string' ? plain(plan.additionalData.tileHeader) : ''
  if (!header) return []
  const tiers: AppleCareTier[] = []
  for (const detail of plan.moreOptions?.planDetails ?? []) {
    const billing = billingOf(detail.dimensionPaymentType?.value)
    if (!billing || typeof detail.partNumber !== 'string') continue
    if (typeof detail.rawPrice !== 'number' && typeof detail.rawPrice !== 'string') continue
    tiers.push({
      name: `${header} (${billing === 'monthly' ? 'Monthly' : 'Annual'})`,
      price: parsePounds(detail.rawPrice),
      billing,
      partNumber: detail.partNumber,
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
    return [`${header} ${d.partNumber} £${d.rawPrice}${billing === 'annual' ? '/yr' : '/mo'} (multi-device subscription, not a per-product plan)`]
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
    const tiers = plans.filter(p => p.appleCareType === 'acp' || p.appleCareType === 'acptl').flatMap(tiersOf)
    const row: AppleCareRow = { wuip: raw.compatibleWuip, tiers }
    if (typeof raw.familyType === 'string') row.familyType = plain(raw.familyType)
    source.rows.push(row)
  }
}

export function parseProductTitle(html: string): MacProduct | undefined {
  const m = PRODUCT_TITLE.exec(html)
  if (!m) return undefined
  const chips = (m[3] ?? '').split('/').map(c => normaliseLabel(c)).filter(Boolean)
  return { family: m[2], size: Number(m[1]), chips }
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
    const html = await fetcher.text(`${PRODUCT_URL}${part}`)
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

function allTiers(source: AppleCareSource): AppleCareTier[] {
  return source.rows.flatMap(r => r.tiers)
}

function fromRow(rows: AppleCareRow[]): Resolved {
  const tiers = dedupe(rows.flatMap(r => r.tiers))
  if (tiers.length === 0) return { reason: 'no AppleCare+ data from Apple' }
  if (duplicateBilling(tiers)) return { reason: 'Apple lists more than one plan per billing period and nothing says which applies' }
  return { tiers }
}

function resolveWatch(m: MappedModel, source: AppleCareSource): Resolved {
  const n = /^Apple Watch Series (\d+)$/.exec(m.key)?.[1]
  if (!n) return { reason: 'no AppleCare+ data from Apple' }
  return fromRow(source.rows.filter(r => r.wuip === `CS${n}_APPLEWATCH`))
}

function resolveSized(m: MappedModel, specName: string, source: AppleCareSource): Resolved {
  const fam = /^(MacBook (?:Pro|Air)) (\d+)"$/.exec(m.key)
  if (!fam) return { reason: 'no AppleCare+ data from Apple' }
  const chip = chipOf(specName)
  const tiers = dedupe(allTiers(source)).filter(t => {
    const p = t.partNumber ? source.products[t.partNumber] : undefined
    if (!p || p.family !== fam[1] || p.size !== Number(fam[2])) return false
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
  if (m.category === 'MacBook') {
    if (m.key === 'iMac') return fromRow(source.rows.filter(r => /^IMAC_/.test(r.wuip)))
    return resolveSized(m, specName, source)
  }
  return { reason: 'no AppleCare+ data from Apple' }
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
