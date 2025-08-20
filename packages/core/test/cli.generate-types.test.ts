import { describe, expect, it, vi } from 'vitest'
import { parseArgs, runGenerateTypes, main as cliMain } from '../bin/generate-types'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { request as httpsReq, Agent as HttpsAgent } from 'node:https'

describe('CLI: generate-types', () => {
    type GlobalWithHooks = typeof globalThis & {
        __PGX_HTTP_GET__?: (u: string) => Promise<string>
        __PGX_READ_STDIN__?: () => Promise<string>
    }
    const g = globalThis as GlobalWithHooks
    it('parseArgs parses --input and --out', () => {
        const args = parseArgs(['node', 'cli', '--input', 'a.json', '--out', 'outdir'])
        expect(args).toEqual({ input: 'a.json', out: 'outdir' })
    })

    it('parseArgs supports short flags -i and -o', () => {
        const args = parseArgs(['node', 'cli', '-i', 'a.json', '-o', 'outdir'])
        expect(args).toEqual({ input: 'a.json', out: 'outdir' })
    })

    it('parseArgs exits with code 1 when arguments missing', () => {
        const spy = vi
            .spyOn(process, 'exit')
            .mockImplementation(((code?: string | number | null) => { throw new Error(`exit:${code}`) }) as never)
        const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        expect(() => parseArgs(['node', 'cli'])).toThrow('exit:1')
        spy.mockRestore()
        err.mockRestore()
    })

    it('runGenerateTypes writes expected files', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const here = dirname(fileURLToPath(import.meta.url))
        const input = resolve(here, '../../../openapi.sample.json')
        await runGenerateTypes({ input, out })
        const tables = readFileSync(resolve(out, 'tables.d.ts'), 'utf8')
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as { tables: { name: string }[] }
        expect(tables).toContain('export interface people')
        expect(meta.tables.map(t => t.name)).toContain('people')
    })

    it('main() runs end-to-end with provided argv (happy path)', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const here = dirname(fileURLToPath(import.meta.url))
        const input = resolve(here, '../../../openapi.sample.json')
        const origArgv = process.argv
        process.argv = ['node', 'cli', '--input', input, '--out', out]
        await cliMain()
        const tables = readFileSync(resolve(out, 'tables.d.ts'), 'utf8')
        expect(tables).toContain('export interface people')
        process.argv = origArgv
    })

    it('main() exits on missing args (error path)', async () => {
        const origArgv = process.argv
        const spy = vi
            .spyOn(process, 'exit')
            .mockImplementation(((code?: string | number | null) => { throw new Error(`exit:${code}`) }) as never)
        const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        process.argv = ['node', 'cli']
        await expect(cliMain()).rejects.toThrow('exit:1')
        spy.mockRestore()
        err.mockRestore()
        process.argv = origArgv
    })

    it('runGenerateTypes supports http URL input (override)', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const sample = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const payload = JSON.stringify(sample)
        g.__PGX_HTTP_GET__ = (async () => Promise.resolve(payload)) as (u: string) => Promise<string>
        await runGenerateTypes({ input: 'http://example.com/openapi.json', out })
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta).toBe('object')
        delete g.__PGX_HTTP_GET__
    })

    it('runGenerateTypes supports https URL input', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const sample = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const payload = JSON.stringify(sample)
        g.__PGX_HTTP_GET__ = (async () => Promise.resolve(payload)) as (u: string) => Promise<string>
        await runGenerateTypes({ input: 'https://example.com/openapi.json', out })
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta).toBe('object')
        delete g.__PGX_HTTP_GET__
    })

    it('runGenerateTypes supports stdin "-" input', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const sample = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const payload = JSON.stringify(sample)
        // Emit into real stdin stream to cover default path
        setTimeout(() => {
            process.stdin.emit('data', payload)
            process.stdin.emit('end')
        }, 0)
        await runGenerateTypes({ input: '-', out })
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta).toBe('object')
    })

    it('runGenerateTypes supports data: URL input (base64 and urlencoded)', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const obj = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const b64 = Buffer.from(JSON.stringify(obj), 'utf8').toString('base64')
        await runGenerateTypes({ input: `data:application/json;base64,${b64}`, out })
        const meta1 = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta1).toBe('object')
        const out2 = join(tmp, 'out2')
        const urlenc = encodeURIComponent(JSON.stringify(obj))
        await runGenerateTypes({ input: `data:application/json,${urlenc}`, out: out2 })
        const meta2 = JSON.parse(readFileSync(resolve(out2, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta2).toBe('object')
    })

    it('runGenerateTypes supports http URL via real local server (no override)', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const sample = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const payload = JSON.stringify(sample)
        const server = createServer((req, res) => {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(payload)
        })
        await new Promise<void>((resolveReady) => server.listen(0, resolveReady))
        const address = server.address()
        const port = typeof address === 'object' && address && 'port' in address ? address.port : 0
        await runGenerateTypes({ input: `http://127.0.0.1:${port}/openapi.json`, out })
        server.close()
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta).toBe('object')
    })

    it('covers https path and custom agent branch using a request shim', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const obj = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const payload = JSON.stringify(obj)
        // Shim https.request to simulate a 200 JSON response and ensure agent option is passed
        const gAny = globalThis as unknown as {
            __PGX_REQUEST_SHIM__?: {
                httpsRequest?: typeof httpsReq | ((...args: any[]) => any)
            }
            __PGX_HTTPS_AGENT__?: unknown
        }
        gAny.__PGX_HTTPS_AGENT__ = new HttpsAgent({ rejectUnauthorized: false })
        gAny.__PGX_REQUEST_SHIM__ = {
            httpsRequest: ((url: string, optionsOrCb: any, maybeCb?: any) => {
                const hasOptions = typeof optionsOrCb === 'object' && optionsOrCb !== null
                const cb = hasOptions ? maybeCb : optionsOrCb
                // Assert agent was passed when provided
                if (hasOptions) expect(!!optionsOrCb.agent).toBe(true)
                // Minimal mock of ClientRequest with on/end
                const listeners: Record<string, Function[]> = {}
                const req = {
                    on: (event: string, fn: Function) => { (listeners[event] ||= []).push(fn); return req },
                    end: () => {
                        // Create a minimal IncomingMessage-like object
                        const resListeners: Record<string, Function[]> = {}
                        const res = {
                            statusCode: 200,
                            setEncoding: (_enc: string) => { },
                            on: (ev: string, fn: Function) => { (resListeners[ev] ||= []).push(fn); return res },
                        }
                        // Invoke callback with our fake response
                        cb(res)
                            // Emit data and end
                            ; (resListeners['data'] || []).forEach(fn => fn(payload))
                            ; (resListeners['end'] || []).forEach(fn => fn())
                    },
                }
                return req as any
            }) as any,
        }
        await runGenerateTypes({ input: 'https://shimmed.test/openapi.json', out })
        delete gAny.__PGX_REQUEST_SHIM__
        delete gAny.__PGX_HTTPS_AGENT__
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta).toBe('object')
    })

    it('httpGet rejects on non-2xx for http (real local server)', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const server = createServer((_req, res) => {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end('{"error":"boom"}')
        })
        await new Promise<void>((resolveReady) => server.listen(0, resolveReady))
        const address = server.address()
        const port = typeof address === 'object' && address && 'port' in address ? address.port : 0
        await expect(runGenerateTypes({ input: `http://127.0.0.1:${port}/openapi.json`, out })).rejects.toThrow(/HTTP 500/)
        server.close()
    })

    it('https path without agent (shim) succeeds', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const obj = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const payload = JSON.stringify(obj)
        const gAny = globalThis as unknown as {
            __PGX_REQUEST_SHIM__?: { httpsRequest?: typeof httpsReq | ((...args: any[]) => any) }
            __PGX_HTTPS_AGENT__?: unknown
        }
        delete gAny.__PGX_HTTPS_AGENT__
        gAny.__PGX_REQUEST_SHIM__ = {
            httpsRequest: ((url: string, optionsOrCb: any, maybeCb?: any) => {
                const hasOptions = typeof optionsOrCb === 'object' && optionsOrCb !== null
                const cb = hasOptions ? maybeCb : optionsOrCb
                // Minimal ClientRequest mock
                const listeners: Record<string, Function[]> = {}
                const req = {
                    on: (ev: string, fn: Function) => { (listeners[ev] ||= []).push(fn); return req },
                    end: () => {
                        const resListeners: Record<string, Function[]> = {}
                        const res = {
                            statusCode: 200,
                            setEncoding: (_enc: string) => { },
                            on: (ev: string, fn: Function) => { (resListeners[ev] ||= []).push(fn); return res },
                        }
                        cb(res)
                            ; (resListeners['data'] || []).forEach(fn => fn(payload))
                            ; (resListeners['end'] || []).forEach(fn => fn())
                    },
                }
                return req as any
            }) as any,
        }
        await runGenerateTypes({ input: 'https://shimmed-no-agent.test/openapi.json', out })
        delete gAny.__PGX_REQUEST_SHIM__
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta).toBe('object')
    })

    it('https path with agent (shim) rejects on non-2xx', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const gAny = globalThis as unknown as {
            __PGX_REQUEST_SHIM__?: { httpsRequest?: typeof httpsReq | ((...args: any[]) => any) }
            __PGX_HTTPS_AGENT__?: unknown
        }
        gAny.__PGX_HTTPS_AGENT__ = new HttpsAgent({ rejectUnauthorized: false })
        gAny.__PGX_REQUEST_SHIM__ = {
            httpsRequest: ((url: string, optionsOrCb: any, maybeCb?: any) => {
                const hasOptions = typeof optionsOrCb === 'object' && optionsOrCb !== null
                const cb = hasOptions ? maybeCb : optionsOrCb
                // Ensure agent presence
                if (hasOptions) expect(!!optionsOrCb.agent).toBe(true)
                const listeners: Record<string, Function[]> = {}
                const req = {
                    on: (ev: string, fn: Function) => { (listeners[ev] ||= []).push(fn); return req },
                    end: () => {
                        const resListeners: Record<string, Function[]> = {}
                        const res = {
                            statusCode: 500,
                            setEncoding: (_enc: string) => { },
                            on: (ev: string, fn: Function) => { (resListeners[ev] ||= []).push(fn); return res },
                        }
                        cb(res)
                            ; (resListeners['data'] || []).forEach(fn => fn('{"err":"x"}'))
                            ; (resListeners['end'] || []).forEach(fn => fn())
                    },
                }
                return req as any
            }) as any,
        }
        await expect(runGenerateTypes({ input: 'https://shimmed-agent-error.test/openapi.json', out })).rejects.toThrow(/HTTP 500/)
        delete gAny.__PGX_REQUEST_SHIM__
        delete gAny.__PGX_HTTPS_AGENT__
    })

    it('https path without agent (shim) rejects on non-2xx', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const gAny = globalThis as unknown as {
            __PGX_REQUEST_SHIM__?: { httpsRequest?: typeof httpsReq | ((...args: any[]) => any) }
            __PGX_HTTPS_AGENT__?: unknown
        }
        delete gAny.__PGX_HTTPS_AGENT__
        gAny.__PGX_REQUEST_SHIM__ = {
            httpsRequest: ((url: string, optionsOrCb: any, maybeCb?: any) => {
                const hasOptions = typeof optionsOrCb === 'object' && optionsOrCb !== null
                const cb = hasOptions ? maybeCb : optionsOrCb
                const listeners: Record<string, Function[]> = {}
                const req = {
                    on: (ev: string, fn: Function) => { (listeners[ev] ||= []).push(fn); return req },
                    end: () => {
                        const resListeners: Record<string, Function[]> = {}
                        const res = {
                            statusCode: 404,
                            setEncoding: (_enc: string) => { },
                            on: (ev: string, fn: Function) => { (resListeners[ev] ||= []).push(fn); return res },
                        }
                        cb(res)
                            ; (resListeners['data'] || []).forEach(fn => fn('{"err":"notfound"}'))
                            ; (resListeners['end'] || []).forEach(fn => fn())
                    },
                }
                return req as any
            }) as any,
        }
        await expect(runGenerateTypes({ input: 'https://shimmed-no-agent-error.test/openapi.json', out })).rejects.toThrow(/HTTP 404/)
        delete gAny.__PGX_REQUEST_SHIM__
    })

    it('readStdin uses override hook when provided', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const obj = { openapi: '3.0.0', components: { schemas: {} }, paths: {}, info: { title: 'x', version: '1' } }
        const payload = JSON.stringify(obj)
        const gAny = globalThis as unknown as { __PGX_READ_STDIN__?: () => Promise<string> }
        gAny.__PGX_READ_STDIN__ = async () => payload
        await runGenerateTypes({ input: '-', out })
        delete gAny.__PGX_READ_STDIN__
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as Record<string, unknown>
        expect(typeof meta).toBe('object')
    })

    it('data: URL missing comma throws a helpful error', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        await expect(runGenerateTypes({ input: 'data:application/json', out })).rejects.toThrow('Invalid data URL: missing comma')
    })
})
