import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { finishRun, writeOutputs } from '@/scripts/catalogue/output'
import { serializeCatalogue } from '@/scripts/catalogue/serialize'
import { testCatalogue } from '../fixtures/test-catalogue'

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), 'sync-output-'))
  const out = join(dir, 'catalogue.json')
  writeFileSync(out, 'previous\n')
  return { dir, out }
}

const changed = { catalogue: testCatalogue, changed: true, summary: '## Summary\n', warnings: [] as string[], keptLastMerged: [] as string[] }

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

describe('finishRun', () => {
  function run(result: typeof changed) {
    const { dir, out } = workspace()
    const summary = join(dir, 'summary.md')
    const env = { GITHUB_OUTPUT: join(dir, 'output'), GITHUB_STEP_SUMMARY: join(dir, 'step-summary.md') }
    writeFileSync(env.GITHUB_STEP_SUMMARY, '')
    const stderr: string[] = []
    const code = finishRun(result, { out, summary }, env, { stdout: () => {}, stderr: text => stderr.push(text) })
    const read = (path: string) => {
      try {
        return readFileSync(path, 'utf8')
      } catch {
        return undefined
      }
    }
    return { code, stderr: stderr.join(''), out: read(out), summary: read(summary), output: read(env.GITHUB_OUTPUT), step: read(env.GITHUB_STEP_SUMMARY) }
  }

  it('fails naming the models kept from the last merge, after writing the changed catalogue', () => {
    const r = run({ ...changed, warnings: ['⚠️ Mac mini: kept last-merged entry — x'], keptLastMerged: ['Mac mini', 'Mac Studio'] })
    expect(r.code).toBe(1)
    expect(r.stderr).toContain('Mac mini, Mac Studio')
    expect(r.out).toBe(serializeCatalogue(testCatalogue))
    expect(r.summary).toBe('## Summary\n')
    expect(r.output).toBe('changed=true\n')
    expect(r.step).toBe('## ⚠️ Warnings\n- ⚠️ Mac mini: kept last-merged entry — x\n')
  })

  it('fails when a model is kept from the last merge even if nothing changed', () => {
    const r = run({ ...changed, changed: false, keptLastMerged: ['Mac mini'] })
    expect(r.code).toBe(1)
    expect(r.stderr).toContain('Mac mini')
    expect(r.out).toBe('previous\n')
    expect(r.output).toBe('changed=false\n')
  })

  it('passes when only a new product is held back, and shows it in the step summary', () => {
    const r = run({ ...changed, changed: false, warnings: ['⚠️ MacBook Neo: new product held back — x'] })
    expect(r.code).toBe(0)
    expect(r.stderr).toBe('')
    expect(r.step).toBe('## ⚠️ Warnings\n- ⚠️ MacBook Neo: new product held back — x\n')
  })

  it('writes None to the step summary on a clean run', () => {
    const r = run(changed)
    expect(r.code).toBe(0)
    expect(r.step).toBe('## ⚠️ Warnings\nNone\n')
  })

  it('skips the GitHub files when the variables are unset', () => {
    const { out } = workspace()
    const code = finishRun(changed, { out }, {}, { stdout: () => {}, stderr: () => {} })
    expect(code).toBe(0)
  })
})
