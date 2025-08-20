#!/usr/bin/env node
/*
 Minimal CLI to generate TypeScript types from a PostgREST OpenAPI JSON.
*/
import { resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { request as httpRequest, type ClientRequest, type IncomingMessage } from 'node:http'
import { request as httpsRequest, type RequestOptions as HttpsRequestOptions } from 'node:https'
import { stdin } from 'node:process'
import { pathToFileURL } from 'node:url'
import { loadSpec, type AnySpec } from '../src/openapi/loadSpec'
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

// For tests, allow an override via globalThis.__PGX_HTTP_GET__
async function httpGet(url: string): Promise<string> {
  const override = (globalThis as unknown as { __PGX_HTTP_GET__?: (u: string) => Promise<string> }).__PGX_HTTP_GET__
  if (override) return override(url)
  return new Promise((resolveStr, reject) => {
    const isHttps = url.startsWith('https://')
    const httpsAgent = (globalThis as unknown as { __PGX_HTTPS_AGENT__?: unknown }).__PGX_HTTPS_AGENT__ as unknown
    const shim = (globalThis as unknown as {
      __PGX_REQUEST_SHIM__?: {
        httpRequest?: (...args: Parameters<typeof httpRequest>) => ReturnType<typeof httpRequest>
        httpsRequest?: (...args: Parameters<typeof httpsRequest>) => ReturnType<typeof httpsRequest>
      }
    }).__PGX_REQUEST_SHIM__
    const httpReqFn: (...args: Parameters<typeof httpRequest>) => ReturnType<typeof httpRequest> = shim?.httpRequest ?? httpRequest
    const httpsReqFn: (...args: Parameters<typeof httpsRequest>) => ReturnType<typeof httpsRequest> = shim?.httpsRequest ?? httpsRequest
    const req = isHttps
      ? (httpsAgent
        ? httpsReqFn(url, { agent: httpsAgent as HttpsRequestOptions['agent'] } as HttpsRequestOptions, (res: IncomingMessage) => {
          const { statusCode = 0 } = res
          let data = ''
          res.setEncoding('utf8')
          res.on('data', (chunk: unknown) => { data += String(chunk) })
          res.on('end', () => {
            if (statusCode >= 200 && statusCode < 300) resolveStr(data)
            else reject(new Error(`HTTP ${statusCode}: failed to GET ${url}`))
          })
        })
        : httpsReqFn(url, {}, (res: IncomingMessage) => {
          const { statusCode = 0 } = res
          let data = ''
          res.setEncoding('utf8')
          res.on('data', (chunk: unknown) => { data += String(chunk) })
          res.on('end', () => {
            if (statusCode >= 200 && statusCode < 300) resolveStr(data)
            else reject(new Error(`HTTP ${statusCode}: failed to GET ${url}`))
          })
        }))
      : httpReqFn(url, {}, (res: IncomingMessage) => {
        const { statusCode = 0 } = res
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (chunk: unknown) => { data += String(chunk) })
        res.on('end', () => {
          if (statusCode >= 200 && statusCode < 300) resolveStr(data)
          else reject(new Error(`HTTP ${statusCode}: failed to GET ${url}`))
        })
      })
      ; (req as ClientRequest).on('error', (err: Error) => reject(err))
      ; (req as ClientRequest).end()
  })
}

// For tests, allow an override via globalThis.__PGX_READ_STDIN__ that returns a Promise<string>
async function readStdin(): Promise<string> {
  const override = (globalThis as unknown as { __PGX_READ_STDIN__?: () => Promise<string> }).__PGX_READ_STDIN__
  if (override) return override()
  return new Promise((resolveStr, reject) => {
    let data = ''
    stdin.setEncoding('utf8')
    stdin.on('data', (chunk) => {
      data += chunk
    })
    stdin.on('end', () => resolveStr(data))
    stdin.on('error', reject)
  })
}

async function loadSpecFromArg(input: string): Promise<AnySpec> {
  if (input === '-') {
    const raw = await readStdin()
    return JSON.parse(raw)
  }
  if (input.startsWith('http://') || input.startsWith('https://')) {
    const raw = await httpGet(input)
    return JSON.parse(raw)
  }
  if (input.startsWith('data:')) {
    const comma = input.indexOf(',')
    if (comma === -1) throw new Error('Invalid data URL: missing comma')
    const meta = input.slice(5, comma)
    const payload = input.slice(comma + 1)
    const isBase64 = /;base64$/i.test(meta)
    const decoded = isBase64 ? Buffer.from(payload, 'base64').toString('utf8') : decodeURIComponent(payload)
    return JSON.parse(decoded)
  }
  return loadSpec(resolve(process.cwd(), input))
}

export async function runGenerateTypes(args: Args) {
  const { input, out } = args
  const spec = await loadSpecFromArg(input)
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
  await runGenerateTypes(args)
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
