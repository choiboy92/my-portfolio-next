import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writeOutputs } from '@/scripts/catalogue/output'
import { serializeCatalogue } from '@/scripts/catalogue/serialize'
import { testCatalogue } from '../fixtures/test-catalogue'

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), 'sync-output-'))
  const out = join(dir, 'catalogue.json')
  writeFileSync(out, 'previous\n')
  return { dir, out }
}

const changed = { catalogue: testCatalogue, changed: true, summary: '## Summary\n' }

describe('writeOutputs', () => {
  it('writes the summary and the catalogue when changed', () => {
    const { dir, out } = workspace()
    const summary = join(dir, 'summary.md')
    writeOutputs(changed, { out, summary }, () => {})
    expect(readFileSync(summary, 'utf8')).toBe('## Summary\n')
    expect(readFileSync(out, 'utf8')).toBe(serializeCatalogue(testCatalogue))
  })

  it('leaves the catalogue untouched when the summary path cannot be written', () => {
    const { dir, out } = workspace()
    const summary = join(dir, 'missing-dir', 'summary.md')
    expect(() => writeOutputs(changed, { out, summary }, () => {})).toThrow()
    expect(readFileSync(out, 'utf8')).toBe('previous\n')
  })

  it('prints the summary when no summary path is given', () => {
    const { out } = workspace()
    const printed: string[] = []
    writeOutputs(changed, { out }, text => printed.push(text))
    expect(printed).toEqual(['## Summary\n'])
    expect(readFileSync(out, 'utf8')).toBe(serializeCatalogue(testCatalogue))
  })

  it('writes nothing and prints No changes when unchanged', () => {
    const { dir, out } = workspace()
    const summary = join(dir, 'summary.md')
    const printed: string[] = []
    writeOutputs({ ...changed, changed: false }, { out, summary }, text => printed.push(text))
    expect(printed).toEqual(['No changes\n'])
    expect(readFileSync(out, 'utf8')).toBe('previous\n')
    expect(() => readFileSync(summary, 'utf8')).toThrow()
  })
})
