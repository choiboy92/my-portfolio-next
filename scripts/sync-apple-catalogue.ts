import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { parseCatalogue } from '@/lib/catalogue/schema'
import { createFetcher } from './catalogue/http'
import { runSync } from './catalogue/run'
import { serializeCatalogue } from './catalogue/serialize'

type Args = { out: string; summary?: string; bootstrap: boolean }

function parseArgs(argv: string[]): Args {
  const args: Args = { out: 'lib/catalogue/apple-uk.json', bootstrap: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--bootstrap') args.bootstrap = true
    else if (arg === '--out' || arg === '--summary') {
      const value = argv[++i]
      if (!value || value.startsWith('--')) throw new Error(`${arg} needs a path`)
      if (arg === '--out') args.out = value
      else args.summary = value
    } else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const previous = parseCatalogue(JSON.parse(readFileSync(args.out, 'utf8')))
  const fetcher = createFetcher()
  const result = await runSync({ fetcher, previous, bootstrap: args.bootstrap, date: new Date().toISOString().slice(0, 10) })

  if (result.changed) {
    writeFileSync(args.out, serializeCatalogue(result.catalogue))
    if (args.summary) writeFileSync(args.summary, result.summary)
    else process.stdout.write(result.summary)
  } else {
    process.stdout.write('No changes\n')
  }

  const githubOutput = process.env.GITHUB_OUTPUT
  if (githubOutput) appendFileSync(githubOutput, `changed=${result.changed}\n`)
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(1)
})
