import { writeFileSync } from 'node:fs'
import type { SyncResult } from './run'
import { serializeCatalogue } from './serialize'

export type OutputPaths = { out: string; summary?: string }

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
