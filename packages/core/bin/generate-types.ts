#!/usr/bin/env node
/*
 Minimal CLI to generate TypeScript types from a PostgREST OpenAPI JSON.
*/
import { resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { loadSpec } from '../src/openapi/loadSpec'
import { introspectSpec } from '../src/openapi/schemaIntrospect'
import { emitOperatorsDTS, emitTablesDTS, toMetadataJSON } from '../src/openapi/tableMetadata'

interface Args { input: string; out: string }

function parseArgs(argv: string[]): Args {
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

async function main() {
  const { input, out } = parseArgs(process.argv)
  const spec = loadSpec(resolve(process.cwd(), input))
  const intro = introspectSpec(spec)

  const outDir = resolve(process.cwd(), out)
  mkdirSync(outDir, { recursive: true })

  const tablesDts = emitTablesDTS(intro)
  const opsDts = emitOperatorsDTS(intro)
  const metadata = JSON.stringify(toMetadataJSON(intro), null, 2)

  writeFileSync(resolve(outDir, 'tables.d.ts'), tablesDts)
  writeFileSync(resolve(outDir, 'operators.d.ts'), opsDts)
  writeFileSync(resolve(outDir, 'metadata.json'), metadata)

  console.log(`Generated types to ${outDir}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
