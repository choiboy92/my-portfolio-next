import { describe, expect, it } from 'vitest'
import type { Catalogue } from '@/lib/catalogue/schema'
import { summarizeChanges } from '@/scripts/catalogue/summary'
import { testCatalogue } from '../fixtures/test-catalogue'

const clone = () => structuredClone(testCatalogue) as Catalogue
const info = { warnings: [] as string[], unmapped: [] as string[], requestCount: 12, date: '2026-11-09' }
const NC = '## 👀 Not cross-checked — please eyeball'
const heads = [
  '## ⚠️ Warnings',
  '## 🆕 New products',
  '## 🗑️ Removed products',
  '## 💷 Price changes',
  NC,
  '## 🔧 Other changes',
  '## ❔ Unmapped Apple options',
  '## Run',
]

const section = (md: string, heading: string) => {
  const start = md.indexOf(heading)
  const rest = md.slice(start + heading.length)
  const next = rest.indexOf('\n## ')
  return (next === -1 ? rest : rest.slice(0, next)).trim()
}

describe('summarizeChanges', () => {
  it('shows None for every empty section and lists the run', () => {
    const md = summarizeChanges(clone(), clone(), info)
    for (const h of heads.slice(0, 7)) expect(section(md, h)).toBe('None')
    expect(section(md, '## Run')).toBe('- Date: 2026-11-09\n- Requests: 12')
  })

  it('keeps sections in order', () => {
    const md = summarizeChanges(clone(), clone(), info)
    const idx = heads.map(h => md.indexOf(h))
    expect(idx.every(i => i >= 0)).toBe(true)
    expect([...idx].sort((a, b) => a - b)).toEqual(idx)
  })

  it('reports warnings and unmapped options', () => {
    const md = summarizeChanges(clone(), clone(), { ...info, warnings: ['stale price'], unmapped: ['Phone X: Foo'] })
    expect(section(md, '## ⚠️ Warnings')).toBe('- stale price')
    expect(section(md, '## ❔ Unmapped Apple options')).toBe('- Phone X: Foo')
  })

  it('reports a new spec and a removed model', () => {
    const next = clone()
    next.categories.iPhone.models['Phone X'].specs.push({ name: 'Phone X Max', price: 1199, appleCare: [] })
    delete next.categories.iPad.models['Pad Pro']
    const md = summarizeChanges(testCatalogue, next, info)
    expect(section(md, '## 🆕 New products')).toBe('- Phone X / Phone X Max')
    expect(section(md, '## 🗑️ Removed products')).toBe('- Pad Pro / 11-inch Pad Pro')
  })

  it('reports a delta change and the base price', () => {
    const next = clone()
    const spec = next.categories.iPad.models['Pad Pro'].specs[0]
    spec.connectivityOptions!['Wi-Fi + Cellular'] = 250
    spec.price = 1199
    const md = summarizeChanges(testCatalogue, next, info)
    expect(section(md, '## 💷 Price changes')).toBe(
      '- Pad Pro / 11-inch Pad Pro / base: £999 → £1,199\n- Pad Pro / 11-inch Pad Pro / Wi-Fi + Cellular: £200 → £250',
    )
  })

  it('reports added and removed option keys', () => {
    const next = clone()
    const spec = next.categories.iPhone.models['Phone X'].specs[0]
    spec.storageOptions!['2TB'] = 600
    delete spec.storageOptions!['512GB']
    const lines = section(summarizeChanges(testCatalogue, next, info), '## 💷 Price changes')
    expect(lines).toContain('- Phone X / Phone X / 2TB: £— → £600')
    expect(lines).toContain('- Phone X / Phone X / 512GB: £300 → £—')
  })

  it('puts a new AppleCare tier only under Not cross-checked', () => {
    const next = clone()
    next.categories.MacBook.models['Book 16"'].specs[0].appleCare = [
      { name: 'AppleCare+ with Theft and Loss', price: 199, billing: 'annual' },
    ]
    const md = summarizeChanges(testCatalogue, next, info)
    expect(section(md, '## 💷 Price changes')).toBe('None')
    expect(section(md, NC)).toBe('- Book 16" / Chip A / AppleCare+ with Theft and Loss: £— → £199')
  })

  it('formats pence', () => {
    const next = clone()
    next.categories.iPhone.models['Phone X'].specs[0].appleCare[0].price = 13.5
    const md = summarizeChanges(testCatalogue, next, info)
    expect(section(md, NC)).toBe('- Phone X / Phone X / AppleCare+ with Theft and Loss (Monthly): £12.99 → £13.5')
  })

  it('puts band, pencil and keyboard changes under Not cross-checked', () => {
    const next = clone()
    const spec = next.categories['Apple Watch'].models['Watch 11'].specs[0]
    spec.bandOptions![1].style[0].price = 60
    spec.magicKeyboard = 300
    spec.applePencil = [{ pencilType: 'Apple Pencil Pro', price: 129 }]
    const md = summarizeChanges(testCatalogue, next, info)
    expect(section(md, '## 💷 Price changes')).toBe('None')
    const nc = section(md, NC)
    expect(nc).toContain('- Watch 11 / Aluminium Case / Textile / Magnetic Link: £50 → £60')
    expect(nc).toContain('- Watch 11 / Aluminium Case / Magic Keyboard: £— → £300')
    expect(nc).toContain('- Watch 11 / Aluminium Case / Apple Pencil Pro: £— → £129')
  })

  it('lists non-price changes tersely under Other changes', () => {
    const next = clone()
    next.categories.iPhone.models['Phone X'].colors = ['Silver', 'Blue']
    next.categories.iPhone.models['Phone X'].specs[0].partNumber = 'ABC'
    next.categories['Apple Watch'].models['Watch 11'].specs[0].bandOptions![0].style[0].bandColor = ['Red']
    const md = summarizeChanges(testCatalogue, next, info)
    expect(section(md, '## 💷 Price changes')).toBe('None')
    expect(section(md, '## 🔧 Other changes')).toBe(
      '- Phone X: colors changed\n- Phone X / Phone X: partNumber changed\n- Watch 11 / Aluminium Case: bandOptions changed',
    )
  })
})
