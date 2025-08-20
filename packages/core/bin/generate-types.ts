#!/usr/bin/env node
/*
 Minimal CLI to generate TypeScript types from a PostgREST OpenAPI JSON.
*/
import { resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { loadSpec } from '../src/openapi/loadSpec'
import { introspectSpec } from '../src/openapi/schemaIntrospect'
import { emitOperatorsDTS, emitTablesDTS, toMetadataJSON } from '../src/openapi/tableMetadata'

interface Args { input: string; out: string }

export function parseArgs(argv: string[]): Args {
  let input = ''
  let out = ''
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--input' || a === '-i') {
      input = argv[++i]
      continue
    }
    if (a === '--out' || a === '-o') {
      out = argv[++i]
      continue
    }
  }
  if (!input || !out) {
    console.error('Usage: postgrestx-generate --input openapi.json --out packages/core/src/types/generated')
    process.exit(1)
  }
  return { input, out }
}

export function runGenerateTypes(args: Args) {
  const { input, out } = args
  const spec = loadSpec(resolve(process.cwd(), input))
  const intro = introspectSpec(spec)

  const outDir = resolve(process.cwd(), out)
  mkdirSync(outDir, { recursive: true })

  const tablesDts = emitTablesDTS(intro)
  const opsDts = emitOperatorsDTS()
  const metadata = JSON.stringify(toMetadataJSON(intro), null, 2)

  writeFileSync(resolve(outDir, 'tables.d.ts'), tablesDts)
  writeFileSync(resolve(outDir, 'operators.d.ts'), opsDts)
  writeFileSync(resolve(outDir, 'metadata.json'), metadata)

  console.log(`Generated types to ${outDir}`)
}

export async function main() {
  const args = parseArgs(process.argv)
  runGenerateTypes(args)
}

// Only run when executed as a script, not when imported for tests
/* c8 ignore start */
if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
/* c8 ignore stop */
