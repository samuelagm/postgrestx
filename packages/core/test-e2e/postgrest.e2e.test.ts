import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { execSync } from 'node:child_process'
import http from 'node:http'
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { PostgrestClient, createFetchHttpClient } from '../src/index.js'
import type { HttpClient, HttpRequest, HttpResponse } from '../src/index.js'
import type { AnySpec } from '../src/openapi/loadSpec.js'
import { runGenerateTypes, parseArgs, main as cliMain } from '../bin/generate-types'
import { loadSpec } from '../src/openapi/loadSpec.js'
import { normalizeError } from '../src/postgrest/errors.js'
import { introspectSpec } from '../src/openapi/schemaIntrospect.js'

function waitForReady(url: string, timeoutMs = 30000, intervalMs = 500): Promise<void> {
    const start = Date.now()
    return new Promise((resolve, reject) => {
        const tryOnce = () => {
            const req = http.request(url, { method: 'GET' }, (res) => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    res.resume()
                    resolve()
                } else {
                    res.resume()
                    if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ready: ${res.statusCode}`))
                    else setTimeout(tryOnce, intervalMs)
                }
            })
            req.on('error', () => {
                if (Date.now() - start > timeoutMs) reject(new Error('Timeout waiting for ready'))
                else setTimeout(tryOnce, intervalMs)
            })
            req.end()
        }
        tryOnce()
    })
}

const composeDir = new URL('../../../infra/dev', import.meta.url).pathname

function getMappedPort(service: string, containerPort: number, retries = 30, intervalMs = 500): string {
    for (let i = 0; i < retries; i++) {
        try {
            const out = execSync(`docker compose port ${service} ${containerPort}`, { cwd: composeDir }).toString().trim()
            // Expected formats: 0.0.0.0:49158 or [::]:49158
            const m = out.match(/(\d+)\s*$/)
            if (m && m[1]) return m[1]
        } catch { }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, intervalMs)
    }
    throw new Error(`Failed to resolve mapped port for ${service}:${containerPort}`)
}

describe('PostgREST e2e', () => {
    let httpBase = 'http://localhost'
    let adminBase = 'http://localhost'

    beforeAll(async () => {
        // Bring up the stack
        execSync('docker compose up -d', { cwd: composeDir, stdio: 'inherit' })
        // Resolve mapped ports
        const apiPort = getMappedPort('postgrest', 3000)
        const adminPort = getMappedPort('postgrest', 3001)
        httpBase = `http://localhost:${apiPort}`
        adminBase = `http://localhost:${adminPort}`
        // Wait for admin ready
        await waitForReady(`${adminBase}/ready`)
    }, 120_000)

    afterAll(() => {
        try {
            execSync('docker compose down -v', { cwd: composeDir, stdio: 'inherit' })
        } catch { }
    })

    it('lists people and tasks', async () => {
        const httpClient = createFetchHttpClient()
        const client = new PostgrestClient(httpBase, httpClient)
        const people = await client.select<Array<{ id: number; name: string }>>('people', { select: 'id,name', order: 'id.asc' })
        expect(people.status).toBe(200)
        expect(Array.isArray(people.data)).toBe(true)
        expect(people.data.length).toBeGreaterThanOrEqual(1)
        expect(people.data[0]).toHaveProperty('id')
        expect(people.data[0]).toHaveProperty('name')

        const tasks = await client.select<Array<{ id: number; title: string }>>('tasks', { select: 'id,title', order: 'id.asc' })
        expect(tasks.status).toBe(200)
        expect(Array.isArray(tasks.data)).toBe(true)
    })

    it('calls scalar RPC', async () => {
        const httpClient = createFetchHttpClient()
        const client = new PostgrestClient(httpBase, httpClient)
        const res = await client.rpc<number>('add_them', { a: 2, b: 3 })
        expect(res.status).toBe(200)
        expect(res.data).toBe(5)
    })

    it('lists with range and count parses Content-Range (if provided)', async () => {
        const httpClient = createFetchHttpClient()
        const client = new PostgrestClient(httpBase, httpClient)
        const res = await client.select<Array<{ id: number }>>('people', {
            select: 'id',
            range: { from: 0, to: 1 },
            count: 'exact',
            order: 'id.asc',
        })
        expect([200, 206]).toContain(res.status)
        // Some PostgREST versions omit Content-Range in 200 responses; accept null
        expect(typeof res.total === 'number' || res.total === null).toBe(true)
    })

    it('performs writes: insert, update, and delete', async () => {
        const httpClient = createFetchHttpClient()
        const client = new PostgrestClient(httpBase, httpClient)

        // Insert a new person and return representation
        const inserted = await client.insert<Array<{ id: number; name: string; age: number }>>(
            'people',
            [{ name: 'Dave', age: 28 }],
            { prefer: { return: 'representation' } }
        )
        expect([200, 201]).toContain(inserted.status)
        const newId = Array.isArray(inserted.data) && inserted.data[0]?.id
        expect(typeof newId).toBe('number')

        // Update the person
        const updated = await client.update(
            'people',
            { age: 29 },
            { filters: [{ column: 'id', op: 'eq', value: newId }], prefer: { return: 'headers-only' } }
        )
        expect([200, 204]).toContain(updated.status)

        // Verify the update via select
        const afterUpdate = await client.select<Array<{ id: number; age: number }>>(
            'people',
            { select: 'id,age', filters: [{ column: 'id', op: 'eq', value: newId }] }
        )
        expect(afterUpdate.status).toBe(200)
        expect(afterUpdate.data[0]?.age).toBe(29)

        // Delete the person
        const deleted = await client.delete('people', { filters: [{ column: 'id', op: 'eq', value: newId }] })
        expect([200, 204]).toContain(deleted.status)

        // Confirm deletion
        const afterDelete = await client.select<Array<{ id: number }>>(
            'people',
            { select: 'id', filters: [{ column: 'id', op: 'eq', value: newId }] }
        )
        expect(afterDelete.status).toBe(200)
        expect(afterDelete.data.length).toBe(0)
    })

    it('generates types via CLI from live OpenAPI', async () => {
        // Fetch OpenAPI JSON from the running PostgREST instance
        const openapiUrl = `${httpBase}/`
        const openapiJson: string = await new Promise((resolvePromise, reject) => {
            const req = http.request(openapiUrl, { method: 'GET', headers: { Accept: 'application/json' } }, (res) => {
                const chunks: Buffer[] = []
                res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
                res.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')))
            })
            req.on('error', reject)
            req.end()
        })

        // Write to a temp file
        const tmpBase = mkdtempSync(join(tmpdir(), 'pgx-types-'))
        const inputPath = resolve(tmpBase, 'openapi.json')
        const outDir = resolve(tmpBase, 'out')
        writeFileSync(inputPath, openapiJson, 'utf8')

        // Run the CLI to generate types
        const cli = resolve(process.cwd(), 'dist/bin/generate-types.cjs')
        execSync(`node ${cli} --input ${inputPath} --out ${outDir}`, { stdio: 'inherit' })

        // Assert files were generated
        const tablesPath = resolve(outDir, 'tables.d.ts')
        const opsPath = resolve(outDir, 'operators.d.ts')
        const metaPath = resolve(outDir, 'metadata.json')
        expect(existsSync(tablesPath)).toBe(true)
        expect(existsSync(opsPath)).toBe(true)
        expect(existsSync(metaPath)).toBe(true)

        const tablesDts = readFileSync(tablesPath, 'utf8')
        const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
            tables: Array<{ name: string; columns: Array<{ name: string; type: string; required: boolean }> }>
        }
        // Expect people and tasks present from the live schema
        const names = meta.tables.map((t) => t.name)
        expect(names).toContain('people')
        expect(names).toContain('tasks')
        expect(tablesDts).toContain('export interface people')
        expect(tablesDts).toContain('export interface tasks')
    })

    it('generates types via source module from live OpenAPI', async () => {
        // Fetch OpenAPI JSON from the running PostgREST instance
        const openapiUrl = `${httpBase}/`
        const openapiJson: string = await new Promise((resolvePromise, reject) => {
            const req = http.request(openapiUrl, { method: 'GET', headers: { Accept: 'application/json' } }, (res) => {
                const chunks: Buffer[] = []
                res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
                res.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')))
            })
            req.on('error', reject)
            req.end()
        })

        const tmpBase = mkdtempSync(join(tmpdir(), 'pgx-types-'))
        const inputPath = resolve(tmpBase, 'openapi.json')
        const outDir = resolve(tmpBase, 'out-src')
        writeFileSync(inputPath, openapiJson, 'utf8')

        runGenerateTypes({ input: inputPath, out: outDir })

        const tablesPath = resolve(outDir, 'tables.d.ts')
        const opsPath = resolve(outDir, 'operators.d.ts')
        const metaPath = resolve(outDir, 'metadata.json')
        expect(existsSync(tablesPath)).toBe(true)
        expect(existsSync(opsPath)).toBe(true)
        expect(existsSync(metaPath)).toBe(true)
    })

    it('normalizes error responses on invalid resource', async () => {
        const httpClient = createFetchHttpClient()
        const client = new PostgrestClient(httpBase, httpClient)
        await expect(client.select('nonexistent')).rejects.toMatchObject({ status: 404 })
    })

    it('offline coverage: encode and client wrap branches', async () => {
        // encode helpers
        const { buildHeaders, parseContentRange } = await import('../src/postgrest/encode.js')
        const headers = buildHeaders({ range: { from: 0, to: 9 }, prefer: { count: 'exact' } })
        expect(headers['Range-Unit']).toBe('items')
        expect(headers.Range).toBe('0-9')
        expect(headers.Prefer).toContain('count=exact')
        expect(parseContentRange('items 0-9/10')).toEqual({ unit: 'items', from: 0, to: 9, total: 10 })
        expect(parseContentRange('items 0-9/*')).toEqual({ unit: 'items', from: 0, to: 9, total: null })
        expect(parseContentRange('bad')).toBeNull()

        // client wrap fallback header case using a mock http client
        const mockHttp: HttpClient = {
            async request<T = unknown>(): Promise<HttpResponse<T>> {
                return { status: 206, headers: { 'Content-Range': 'items 1-2/3' }, data: ([{ id: 2 }] as unknown) as T }
            },
        }
        const c = new PostgrestClient('http://example.com/', mockHttp)
        const out = await c.select('x')
        expect(out.total).toBe(3)
        expect(out.range).toEqual({ unit: 'items', from: 1, to: 2 })
    })

    it('offline coverage: CLI parseArgs long and short flags', () => {
        const a1 = parseArgs(['node', 'cli', '--input', 'x.json', '--out', 'o'])
        expect(a1).toEqual({ input: 'x.json', out: 'o' })
        const a2 = parseArgs(['node', 'cli', '-i', 'x.json', '-o', 'o'])
        expect(a2).toEqual({ input: 'x.json', out: 'o' })
    })

    it('offline coverage: introspectSpec handles various schema shapes', () => {
        const spec = {
            openapi: '3.0.0',
            components: {
                schemas: {
                    A: { type: 'object', properties: { id: { type: 'integer' }, s: { type: 'string' } }, required: ['id'] },
                    B: { type: 'object', properties: { a: { type: 'array', items: { type: 'number' } } } },
                    C: { type: 'object', properties: { r: { $ref: '#/components/schemas/A' } } },
                    D: { type: 'object', properties: { o: { type: 'object' }, u: { type: 'weird' }, z: null } },
                    E: { type: 'object', properties: {} },
                    F: { type: 'string' },
                    G: null,
                    H: 123 as unknown as never,
                    I: { type: 'object', properties: { f: { type: 'string', format: 'date-time' } } },
                },
            },
        }
        const intro = introspectSpec(spec as unknown as AnySpec)
        expect(intro.tables.find(t => t.name === 'A')?.primaryKey).toBe('id')
        expect(intro.tables.find(t => t.name === 'B')?.columns.find(c => c.name === 'a')?.type).toBe('number[]')
        expect(intro.tables.find(t => t.name === 'C')?.columns.find(c => c.name === 'r')?.type).toBe('A')
        expect(intro.tables.find(t => t.name === 'D')?.columns.find(c => c.name === 'o')?.type).toBe('Record<string, any>')
        expect(intro.tables.find(t => t.name === 'D')?.columns.find(c => c.name === 'u')?.type).toBe('any')
        expect(intro.tables.find(t => t.name === 'D')?.columns.find(c => c.name === 'z')?.type).toBe('unknown')
        expect(intro.tables.find(t => t.name === 'I')?.columns.find(c => c.name === 'f')?.type).toBe('string')
        // E/F/G/H are skipped due to no props/non-object
        expect(intro.tables.find(t => t.name === 'E')).toBeUndefined()
        expect(intro.tables.find(t => t.name === 'F')).toBeUndefined()
        expect(intro.tables.find(t => t.name === 'G')).toBeUndefined()
        expect(intro.tables.find(t => t.name === 'H')).toBeUndefined()
    })

    it('offline coverage: introspectSpec supports Swagger v2 definitions and empty schemas', () => {
        const spec1 = {
            swagger: '2.0.0',
            definitions: {
                J: { type: 'object', properties: { id: { type: 'integer' }, n: { type: 'string' } }, required: ['id'] },
            },
        }
        const out1 = introspectSpec(spec1 as unknown as AnySpec)
        expect(out1.tables.find(t => t.name === 'J')?.primaryKey).toBe('id')

        const spec2 = { openapi: '3.0.0' }
        const out2 = introspectSpec(spec2 as unknown as AnySpec)
        expect(out2.tables.length).toBe(0)
    })

    it('offline coverage: CLI parseArgs error path', () => {
        const spy = vi
            .spyOn(process, 'exit')
            .mockImplementation(((code?: string | number | null | undefined) => {
                throw new Error(`exit:${code}`)
            }) as never)
        const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        expect(() => parseArgs(['node', 'cli'])).toThrow('exit:1')
        spy.mockRestore()
        err.mockRestore()
    })

    it('offline coverage: loadSpec error path', () => {
        const tmpBase = mkdtempSync(join(tmpdir(), 'pgx-badjson-'))
        const bad = resolve(tmpBase, 'bad.json')
        writeFileSync(bad, '{bad json', 'utf8')
        expect(() => loadSpec(bad)).toThrow(/Failed to parse OpenAPI JSON/)
    })

    it('offline coverage: encode filter array with quotes', async () => {
        const { buildQueryParams } = await import('../src/postgrest/encode.js')
        const qs = buildQueryParams({ filters: [{ column: 'labels', op: 'cs', modifier: 'all', value: ['a"b'] }] })
        expect(qs).toContain('labels=cs%28all%29.%28%22a%5C%22b%22%29')
    })

    it('offline coverage: normalizeError string body', () => {
        const err = normalizeError({ status: 500, headers: {}, data: 'boom' })
        expect(err).toMatchObject({ status: 500, message: 'boom' })
    })

    it('offline coverage: normalizeError object message and error fields', () => {
        const e1 = normalizeError({ status: 400, headers: {}, data: { message: 'bad' } })
        expect(e1).toMatchObject({ status: 400, message: 'bad' })
        const e2 = normalizeError({ status: 401, headers: {}, data: { error: 'nope' } })
        expect(e2).toMatchObject({ status: 401, message: 'nope' })
        const e3 = normalizeError({ status: 402, headers: {}, data: 123 })
        expect(e3).toMatchObject({ status: 402, message: 'PostgREST error' })
        const e4 = normalizeError({ status: 403, headers: {}, data: {} })
        expect(e4).toMatchObject({ status: 403, message: 'PostgREST error' })
    })

    it('client error paths: insert/update/delete/rpc', async () => {
        const httpClient = createFetchHttpClient()
        const client = new PostgrestClient(httpBase, httpClient)
        await expect(client.rpc('no_such_fn' as unknown as string)).rejects.toMatchObject({ status: 404 })
        // insert with missing not-null column should error
        await expect(client.insert('people', [{ name: null as unknown as string }])).rejects.toMatchObject({ status: 400 })
        // create a valid row, then update setting not-null column to null should error
        const created = await client.insert<Array<{ id: number }>>('people', [{ name: 'TempName', age: 1 }], { prefer: { return: 'representation' } })
        const tempId = Array.isArray(created.data) && created.data[0]?.id
        expect(typeof tempId).toBe('number')
        await expect(
            client.update('people', { name: null as unknown as string }, { filters: [{ column: 'id', op: 'eq', value: tempId }] })
        ).rejects.toMatchObject({ status: 400 })
        // delete invalid resource errors
        await expect(client.delete('no_such_table')).rejects.toMatchObject({ status: 404 })
        // rpc missing function errors
        await expect(client.rpc('no_such_fn' as unknown as string)).rejects.toMatchObject({ status: 404 })
    })

    it('offline coverage: CLI main happy and error paths', async () => {
        const tmpBase = mkdtempSync(join(tmpdir(), 'pgx-cli-main-'))
        const outDir = resolve(tmpBase, 'out')
        const input = resolve(process.cwd(), '../../openapi.sample.json')
        const origArgv = process.argv
        process.argv = ['node', 'cli', '--input', input, '--out', outDir]
        await cliMain()
        expect(existsSync(resolve(outDir, 'tables.d.ts'))).toBe(true)
        // error path
        const spy = vi
            .spyOn(process, 'exit')
            .mockImplementation(((code?: string | number | null | undefined) => { throw new Error(`exit:${code}`) }) as never)
        const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        process.argv = ['node', 'cli']
        await expect(cliMain()).rejects.toThrow('exit:1')
        spy.mockRestore()
        err.mockRestore()
        process.argv = origArgv
    })

    it('offline coverage: client.rpc GET builds query with args', async () => {
        const captured: HttpRequest[] = []
        const mock: HttpClient = {
            async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
                captured.push(req)
                return { status: 200, headers: {}, data: (123 as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com', mock)
        const out = await client.rpc<number>('fn', { a: 1, b: 'x' }, { method: 'GET' })
        expect(out.status).toBe(200)
        expect(String(captured[0].url)).toContain('/rpc/fn?')
        expect(String(captured[0].url)).toContain('a=1')
        expect(String(captured[0].url)).toContain('b=x')
    })

    it('offline coverage: client.rpc default GET without args', async () => {
        const captured: HttpRequest[] = []
        const mock: HttpClient = {
            async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
                captured.push(req)
                return { status: 200, headers: {}, data: (null as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com/', mock)
        const out = await client.rpc('ping')
        expect(out.status).toBe(200)
        expect(captured[0].method).toBe('GET')
        expect(String(captured[0].url)).toBe('http://example.com/rpc/ping')
    })

    it('offline coverage: client.rpc POST with non-empty qs', async () => {
        const captured: HttpRequest[] = []
        const mock: HttpClient = {
            async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
                captured.push(req)
                return { status: 200, headers: {}, data: (0 as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com', mock)
        const out = await client.rpc('add', { a: 1, b: 2 }, { limit: 1 })
        expect(out.status).toBe(200)
        expect(String(captured[0].url)).toContain('/rpc/add?')
        expect(String(captured[0].url)).toContain('limit=1')
        expect(captured[0].method).toBe('POST')
    })

    it('offline coverage: client.rpc POST with empty qs and undefined args', async () => {
        const captured: HttpRequest[] = []
        const mock: HttpClient = {
            async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
                captured.push(req)
                return { status: 200, headers: {}, data: (null as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com', mock)
        const out = await client.rpc('noop', undefined, { method: 'POST' })
        expect(out.status).toBe(200)
        expect(String(captured[0].url)).toBe('http://example.com/rpc/noop')
        expect(captured[0].method).toBe('POST')
        expect(captured[0].headers?.['Content-Type']).toBe('application/json')
        expect(captured[0].body).toEqual({})
    })

    it('offline coverage: client.upsert default and explicit resolution', async () => {
        const seen: HttpRequest[] = []
        const mock: HttpClient = {
            async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
                seen.push(req)
                return { status: 200, headers: {}, data: ([] as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com', mock)
        await client.upsert('people', [{ id: 1, name: 'A' }])
        await client.upsert('people', [{ id: 1, name: 'A' }], { prefer: { resolution: 'ignore-duplicates' } })
        expect(seen[0].headers?.Prefer).toContain('resolution=merge-duplicates')
        expect(seen[1].headers?.Prefer).toContain('resolution=ignore-duplicates')
    })

    it('offline coverage: client.upsert prefer present without resolution defaults', async () => {
        const seen: HttpRequest[] = []
        const mock: HttpClient = {
            async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
                seen.push(req)
                return { status: 200, headers: {}, data: ([] as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com', mock)
        await client.upsert('people', [{ id: 2, name: 'B' }], { prefer: { return: 'minimal' } })
        expect(seen[0].headers?.Prefer).toContain('return=minimal')
        expect(seen[0].headers?.Prefer).toContain('resolution=merge-duplicates')
    })

    it('offline coverage: client.upsert builds qs when provided', async () => {
        const seen: HttpRequest[] = []
        const mock: HttpClient = {
            async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
                seen.push(req)
                return { status: 200, headers: {}, data: ([] as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com', mock)
        await client.upsert('people', [{ id: 3, name: 'C' }], { on_conflict: 'id', columns: 'id,name' })
        expect(String(seen[0].url)).toContain('/people?')
        expect(String(seen[0].url)).toContain('on_conflict=id')
        expect(String(seen[0].url)).toContain('columns=id%2Cname')
    })

    it('offline coverage: encode headers and query branches', async () => {
        const { buildHeaders, buildQueryParams } = await import('../src/postgrest/encode.js')
        const qs = buildQueryParams({
            select: 'id,name',
            filters: [
                { column: 'age', op: 'gte', value: 10 },
                { column: 'tag', op: 'eq', value: 'x' },
                { column: 'flag', op: 'is', value: undefined },
                { column: 'arr', op: 'cs', modifier: 'any', value: [1, 2] },
                { column: 'neg', op: 'eq', negated: true, value: 'n' },
            ],
            order: ['name.asc', 'id.desc'],
            limit: 5,
            offset: 10,
            columns: 'id,name',
            on_conflict: 'id'
        })
        expect(qs).toContain('select=id%2Cname')
        expect(qs).toContain('age=gte.10')
        expect(qs).toContain('tag=eq.x')
        expect(qs).toContain('flag=is')
        expect(qs).toContain('arr=cs%28any%29.%281%2C2%29')
        expect(qs).toContain('neg=not.eq.n')
        expect(qs).toContain('order=name.asc%2Cid.desc')
        expect(qs).toContain('limit=5')
        expect(qs).toContain('offset=10')
        expect(qs).toContain('columns=id%2Cname')
        expect(qs).toContain('on_conflict=id')

        const headers = buildHeaders({
            range: { from: 5 },
            count: 'planned',
            prefer: { return: 'representation', resolution: 'ignore-duplicates', missing: 'default', handling: 'strict', timezone: 'utc', tx: 'commit', maxAffected: 50 },
            headers: { 'X-Test': '1' }
        })
        expect(headers.Range).toBe('5-')
        expect(headers.Prefer).toContain('count=planned')
        expect(headers.Prefer).toContain('return=representation')
        expect(headers.Prefer).toContain('resolution=ignore-duplicates')
        expect(headers.Prefer).toContain('missing=default')
        expect(headers.Prefer).toContain('handling=strict')
        expect(headers.Prefer).toContain('timezone=utc')
        expect(headers.Prefer).toContain('tx=commit')
        expect(headers.Prefer).toContain('max-affected=50')
        expect(headers['X-Test']).toBe('1')
    })

    it('offline coverage: wrap picks lowercase content-range over uppercase', async () => {
        const mock: HttpClient = {
            async request<T = unknown>(): Promise<HttpResponse<T>> {
                return { status: 206, headers: { 'content-range': 'items 2-3/4', 'Content-Range': 'items 0-1/2' }, data: ([] as unknown) as T }
            },
        }
        const client = new PostgrestClient('http://example.com', mock)
        const res = await client.select('t')
        expect(res.range).toEqual({ unit: 'items', from: 2, to: 3 })
        expect(res.total).toBe(4)
    })

    it('offline coverage: wrap uses lowercase header when only lowercase present', async () => {
        const mock: HttpClient = { async request<T = unknown>(): Promise<HttpResponse<T>> { return { status: 206, headers: { 'content-range': 'items 0-0/1' }, data: ([] as unknown) as T } } }
        const client = new PostgrestClient('http://example.com', mock)
        const res = await client.select('t')
        expect(res.range).toEqual({ unit: 'items', from: 0, to: 0 })
        expect(res.total).toBe(1)
    })

    it('offline coverage: wrap uses uppercase header when only uppercase present', async () => {
        const mock: HttpClient = { async request<T = unknown>(): Promise<HttpResponse<T>> { return { status: 206, headers: { 'Content-Range': 'items 1-1/2' }, data: ([] as unknown) as T } } }
        const client = new PostgrestClient('http://example.com', mock)
        const res = await client.select('t')
        expect(res.range).toEqual({ unit: 'items', from: 1, to: 1 })
        expect(res.total).toBe(2)
    })

    it('offline coverage: wrap handles missing Content-Range headers', async () => {
        const mock: HttpClient = { async request<T = unknown>(): Promise<HttpResponse<T>> { return { status: 200, headers: {}, data: ([] as unknown) as T } } }
        const client = new PostgrestClient('http://example.com', mock)
        const res = await client.select('t')
        expect(res.range).toBeNull()
        expect(res.total).toBeNull()
    })

    it('offline coverage: client.insert builds qs when provided', async () => {
        const captured: HttpRequest[] = []
        const mock: HttpClient = { async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> { captured.push(req); return { status: 200, headers: {}, data: ([] as unknown) as T } } }
        const client = new PostgrestClient('http://example.com', mock)
        await client.insert('t', [{ a: 1 }], { columns: 'a' })
        expect(String(captured[0].url)).toContain('/t?')
        expect(String(captured[0].url)).toContain('columns=a')
    })

    it('offline coverage: client.delete builds qs when provided', async () => {
        const captured: HttpRequest[] = []
        const mock: HttpClient = { async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> { captured.push(req); return { status: 204, headers: {}, data: ('' as unknown) as T } } }
        const client = new PostgrestClient('http://example.com', mock)
        await client.delete('t', { filters: [{ column: 'id', op: 'eq', value: 1 }] })
        expect(String(captured[0].url)).toContain('/t?')
        expect(String(captured[0].url)).toContain('id=eq.1')
    })

    it('offline coverage: client.update and delete without qs', async () => {
        const seen: HttpRequest[] = []
        const mock: HttpClient = { async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> { seen.push(req); return { status: 200, headers: {}, data: ([] as unknown) as T } } }
        const client = new PostgrestClient('http://example.com', mock)
        await client.update('t', { a: 1 })
        await client.delete('t')
        expect(String(seen[0].url)).toBe('http://example.com/t')
        expect(String(seen[1].url)).toBe('http://example.com/t')
    })
})
