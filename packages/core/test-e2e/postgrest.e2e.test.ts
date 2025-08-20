import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import http from 'node:http'
import { PostgrestClient, createFetchHttpClient } from '../src/index.js'

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
})
