import type { Catalogue, Model, Spec } from '@/lib/catalogue/schema'

type Info = { warnings: string[]; unmapped: string[]; requestCount: number; date: string }

const PRICE_MAPS = ['memoryOptions', 'storageOptions', 'chargerOptions', 'connectivityOptions', 'sizeOptions'] as const
const OTHER_FIELDS = ['colors', 'partNumber', 'includes', 'constraints'] as const

const money = (n: number | undefined) =>
  n === undefined ? '£—' : `£${n.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

type Entry = { option: string; old?: number; next?: number }

function diffNumbers(prev: Map<string, number>, next: Map<string, number>): Entry[] {
  const keys = [...new Set([...prev.keys(), ...next.keys()])]
  return keys
    .filter(k => prev.get(k) !== next.get(k))
    .map(k => ({ option: k, old: prev.get(k), next: next.get(k) }))
}

function plainEntries(spec: Spec) {
  const out = new Map<string, number>([['base', spec.price]])
  for (const field of PRICE_MAPS) for (const [k, v] of Object.entries(spec[field] ?? {})) out.set(k, v)
  if (spec.nanoTexture !== undefined) out.set('nanoTexture', spec.nanoTexture)
  return out
}

function eyeballEntries(spec: Spec) {
  const out = new Map<string, number>()
  for (const tier of spec.appleCare) out.set(tier.name, tier.price)
  for (const group of spec.bandOptions ?? []) {
    for (const style of group.style) out.set(`${group.material} / ${style.styleName}`, style.price)
  }
  for (const pencil of spec.applePencil ?? []) out.set(pencil.pencilType, pencil.price)
  if (spec.magicKeyboard !== undefined) out.set('Magic Keyboard', spec.magicKeyboard)
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

function allModels(c: Catalogue) {
  return Object.values(c.categories).flatMap(cat => Object.entries(cat.models).map(([key, model]) => ({ key, model })))
}

function modelMap(c: Catalogue) {
  const out = new Map<string, Model>()
  for (const { key, model } of allModels(c)) out.set(key, model)
  return out
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

  for (const [key, model] of nextModels) {
    const before = prevModels.get(key)
    if (!before) {
      for (const spec of model.specs) added.push(`- ${model.displayName} / ${spec.name}`)
      continue
    }
    if (!same(before.colors, model.colors)) other.push(`- ${model.displayName}: colors changed`)
    const beforeSpecs = new Map(before.specs.map(s => [s.name, s]))
    for (const spec of model.specs) {
      const prevSpec = beforeSpecs.get(spec.name)
      if (!prevSpec) {
        added.push(`- ${model.displayName} / ${spec.name}`)
        continue
      }
      const label = `${model.displayName} / ${spec.name}`
      for (const e of diffNumbers(plainEntries(prevSpec), plainEntries(spec))) {
        prices.push(`- ${label} / ${e.option}: ${money(e.old)} → ${money(e.next)}`)
      }
      for (const e of diffNumbers(eyeballEntries(prevSpec), eyeballEntries(spec))) {
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
