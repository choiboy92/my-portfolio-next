import { appendFileSync, writeFileSync } from 'node:fs'
import type { SyncResult } from './run'
import { serializeCatalogue } from './serialize'
import { warningsSection } from './summary'

export type OutputPaths = { out: string; summary?: string }

export type RunEnv = { GITHUB_OUTPUT?: string; GITHUB_STEP_SUMMARY?: string }

export type RunIO = { stdout: (text: string) => void; stderr: (text: string) => void }

export function writeOutputs(result: SyncResult, paths: OutputPaths, print: (text: string) => void): void {
  if (!result.changed) {
    print('No changes\n')
    return
  }
  const json = serializeCatalogue(result.catalogue)
  if (paths.summary) writeFileSync(paths.summary, result.summary)
  writeFileSync(paths.out, json)
  if (!paths.summary) print(result.summary)
}

export function finishRun(result: SyncResult, paths: OutputPaths, env: RunEnv, io: RunIO): number {
  writeOutputs(result, paths, io.stdout)
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `changed=${result.changed}\n`)
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, warningsSection(result.warnings))
  if (result.keptLastMerged.length === 0) return 0
  io.stderr(
    `Apple's data could not be re-verified for ${result.keptLastMerged.join(', ')}; their last-merged entries were kept. See the Warnings section of the summary.\n`,
  )
  return 1
}
