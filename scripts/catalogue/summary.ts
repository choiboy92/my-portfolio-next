import type { Catalogue, Model, Spec } from '@/lib/catalogue/schema'

type Info = { warnings: string[]; unmapped: string[]; requestCount: number; date: string }

const OTHER_FIELDS = ['colors', 'partNumber', 'includes', 'constraints'] as const

const money = (n: number | undefined) =>
  n === undefined ? '£—' : `£${n.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

type Item = { scope: string; key: string; value: number }
type Entry = { option: string; old?: number; next?: number }

const MAP_SCOPES = {
  memoryOptions: 'memory',
  storageOptions: 'storage',
  chargerOptions: 'charger',
  connectivityOptions: 'connectivity',
  sizeOptions: 'size',
} as const

function indexItems(items: Item[]) {
  const seen = new Map<string, number>()
  const out = new Map<string, Item>()
  for (const item of items) {
    const base = `${item.scope}\u0000${item.key}`
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    out.set(`${base}\u0000${n}`, item)
  }
  return out
}

function diffItems(prev: Item[], next: Item[]): Entry[] {
  const a = indexItems(prev)
  const b = indexItems(next)
  const ids = [...new Set([...a.keys(), ...b.keys()])]
  const scopesByKey = new Map<string, Set<string>>()
  for (const item of [...a.values(), ...b.values()]) {
    const set = scopesByKey.get(item.key) ?? new Set<string>()
    set.add(item.scope)
    scopesByKey.set(item.key, set)
  }
  return ids
    .filter(id => a.get(id)?.value !== b.get(id)?.value)
    .map(id => {
      const item = (a.get(id) ?? b.get(id))!
      const ambiguous = (scopesByKey.get(item.key)?.size ?? 0) > 1
      return {
        option: ambiguous ? `${item.scope} ${item.key}` : item.key,
        old: a.get(id)?.value,
        next: b.get(id)?.value,
      }
    })
}

function plainItems(spec: Spec): Item[] {
  const out: Item[] = [{ scope: 'base', key: 'base', value: spec.price }]
  for (const field of Object.keys(MAP_SCOPES) as (keyof typeof MAP_SCOPES)[]) {
    for (const [key, value] of Object.entries(spec[field] ?? {})) out.push({ scope: MAP_SCOPES[field], key, value })
  }
  if (spec.nanoTexture !== undefined) out.push({ scope: 'nanoTexture', key: 'nanoTexture', value: spec.nanoTexture })
  return out
}

function eyeballItems(spec: Spec): Item[] {
  const out: Item[] = []
  for (const tier of spec.appleCare) out.push({ scope: 'appleCare', key: tier.name, value: tier.price })
  for (const group of spec.bandOptions ?? []) {
    for (const style of group.style) {
      out.push({ scope: 'band', key: `${group.material} / ${style.styleName}`, value: style.price })
    }
  }
  for (const pencil of spec.applePencil ?? []) out.push({ scope: 'pencil', key: pencil.pencilType, value: pencil.price })
  if (spec.magicKeyboard !== undefined) out.push({ scope: 'keyboard', key: 'Magic Keyboard', value: spec.magicKeyboard })
  return out
}

const withoutPrice = <T extends { price: number }>(item: T) => ({ ...item, price: 0 })

function stripPrices(spec: Spec) {
  return {
    appleCare: spec.appleCare.map(withoutPrice),
    bandOptions: spec.bandOptions?.map(g => ({ material: g.material, style: g.style.map(withoutPrice) })),
  }
}

function otherFields(prev: Spec, next: Spec) {
  const changed: string[] = OTHER_FIELDS.filter(f => !same(prev[f], next[f]))
  const a = stripPrices(prev)
  const b = stripPrices(next)
  if (!same(a.appleCare, b.appleCare)) changed.push('appleCare')
  if (!same(a.bandOptions, b.bandOptions)) changed.push('bandOptions')
  return changed
}

function modelMap(c: Catalogue) {
  const out = new Map<string, Model>()
  for (const [categoryKey, cat] of Object.entries(c.categories)) {
    for (const [key, model] of Object.entries(cat.models)) out.set(`${categoryKey}/${key}`, model)
  }
  return out
}

function categoryMap(c: Catalogue) {
  return new Map(Object.entries(c.categories).map(([key, cat]) => [key, cat.appleCareAvailable]))
}

const list = (lines: string[]) => (lines.length ? lines.join('\n') : 'None')

export function summarizeChanges(previous: Catalogue, next: Catalogue, info: Info): string {
  const added: string[] = []
  const removed: string[] = []
  const prices: string[] = []
  const eyeball: string[] = []
  const other: string[] = []

  const prevModels = modelMap(previous)
  const nextModels = modelMap(next)

  const prevCats = categoryMap(previous)
  for (const [key, available] of categoryMap(next)) {
    if (prevCats.get(key) !== available) other.push(`- ${key}: appleCareAvailable changed`)
  }

  for (const [key, model] of nextModels) {
    const before = prevModels.get(key)
    if (!before) {
      for (const spec of model.specs) added.push(`- ${model.displayName} / ${spec.name}`)
      continue
    }
    const modelFields = (['displayName', 'colors'] as const).filter(f => !same(before[f], model[f]))
    if (modelFields.length) other.push(`- ${model.displayName}: ${modelFields.join(', ')} changed`)
    const beforeSpecs = new Map(before.specs.map(s => [s.name, s]))
    for (const spec of model.specs) {
      const prevSpec = beforeSpecs.get(spec.name)
      if (!prevSpec) {
        added.push(`- ${model.displayName} / ${spec.name}`)
        continue
      }
      const label = `${model.displayName} / ${spec.name}`
      for (const e of diffItems(plainItems(prevSpec), plainItems(spec))) {
        prices.push(`- ${label} / ${e.option}: ${money(e.old)} → ${money(e.next)}`)
      }
      for (const e of diffItems(eyeballItems(prevSpec), eyeballItems(spec))) {
        eyeball.push(`- ${label} / ${e.option}: ${money(e.old)} → ${money(e.next)}`)
      }
      const fields = otherFields(prevSpec, spec)
      if (fields.length) other.push(`- ${label}: ${fields.join(', ')} changed`)
    }
    const nextSpecNames = new Set(model.specs.map(s => s.name))
    for (const spec of before.specs) {
      if (!nextSpecNames.has(spec.name)) removed.push(`- ${model.displayName} / ${spec.name}`)
    }
  }

  for (const [key, model] of prevModels) {
    if (nextModels.has(key)) continue
    for (const spec of model.specs) removed.push(`- ${model.displayName} / ${spec.name}`)
  }

  const sections: [string, string][] = [
    ['## ⚠️ Warnings', list(info.warnings.map(w => `- ${w}`))],
    ['## 🆕 New products', list(added)],
    ['## 🗑️ Removed products', list(removed)],
    ['## 💷 Price changes', list(prices)],
    ['## 👀 Not cross-checked — please eyeball', list(eyeball)],
    ['## 🔧 Other changes', list(other)],
    ['## ❔ Unmapped Apple options', list(info.unmapped.map(u => `- ${u}`))],
    ['## Run', `- Date: ${info.date}\n- Requests: ${info.requestCount}`],
  ]
  return sections.map(([heading, body]) => `${heading}\n${body}\n`).join('\n')
}
