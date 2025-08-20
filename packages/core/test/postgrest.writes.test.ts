import { describe, expect, it } from 'vitest'
import { PostgrestClient } from '../src/postgrest/client'
import type { HttpClient, HttpRequest, HttpResponse } from '../src/postgrest/http'

class MockHttp implements HttpClient {
  constructor(private responder: (req: HttpRequest) => HttpResponse<unknown> | Promise<HttpResponse<unknown>>) { }
  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    return (await this.responder(req)) as HttpResponse<T>
  }
}

describe('PostgrestClient writes and rpc', () => {
  it('insert: builds query, content-type and Prefer headers', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('POST')
      expect(req.url).toContain('/people')
      expect(req.url).toContain('columns=id%2Cname')
      expect(req.headers?.['Content-Type']).toBe('application/json')
      const prefer = req.headers?.Prefer ?? ''
      expect(prefer).toContain('return=representation')
      expect(prefer).toContain('missing=default')
      return { status: 201, headers: {}, data: [{ id: 1, name: 'John' }] }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.insert<{ id: number; name: string }[]>('people', [{ id: 1, name: 'John' }], {
      columns: 'id,name',
      prefer: { return: 'representation', missing: 'default' },
    })
    expect(res.status).toBe(201)
    expect(Array.isArray(res.data)).toBe(true)
  })

  it('upsert: sets resolution=merge-duplicates and on_conflict', async () => {
    const http = new MockHttp((_req) => {
      expect(_req.method).toBe('POST')
      expect(_req.url).toContain('/employees')
      expect(_req.url).toContain('on_conflict=name')
      const prefer = _req.headers?.Prefer ?? ''
      expect(prefer).toContain('resolution=merge-duplicates')
      return { status: 201, headers: {}, data: [] }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.upsert('employees', [{ name: 'Old employee 1', salary: 1 }], {
      on_conflict: 'name',
    })
    expect(res.status).toBe(201)
  })

  it('upsert: respects provided prefer.resolution (branch of ??)', async () => {
    const http = new MockHttp((_req) => {
      expect(_req.method).toBe('POST')
      const prefer = _req.headers?.Prefer ?? ''
      expect(prefer).toContain('resolution=merge-duplicates')
      return { status: 201, headers: {}, data: [] }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.upsert('employees', [{ name: 'X' }], { prefer: { resolution: 'merge-duplicates' } })
    expect(res.status).toBe(201)
  })

  it('update: PATCH with filters and return headers-only', async () => {
    const http = new MockHttp((_req) => {
      expect(_req.method).toBe('PATCH')
      expect(_req.url).toContain('/people')
      expect(_req.url).toContain('id=eq.1')
      const prefer = _req.headers?.Prefer ?? ''
      expect(prefer).toContain('return=headers-only')
      return { status: 204, headers: {}, data: null }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.update('people', { name: 'Jane' }, {
      filters: [{ column: 'id', op: 'eq', value: 1 }],
      prefer: { return: 'headers-only' },
    })
    expect(res.status).toBe(204)
  })

  it('delete: DELETE with filters', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('DELETE')
      expect(req.url).toContain('/people')
      expect(req.url).toContain('active=is.false')
      return { status: 204, headers: {}, data: null }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.delete('people', { filters: [{ column: 'active', op: 'is', value: 'false' as unknown as string }] })
    expect(res.status).toBe(204)
  })

  it('update: throws on error status', async () => {
    const http = new MockHttp((_req) => { void _req; return { status: 409, headers: {}, data: { message: 'conflict' } } })
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.update('people', { name: 'X' })).rejects.toMatchObject({ status: 409, message: 'conflict' })
  })

  it('delete: throws on error status', async () => {
    const http = new MockHttp((_req) => { void _req; return { status: 400, headers: {}, data: { error: 'bad' } } })
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.delete('people')).rejects.toMatchObject({ status: 400, message: 'bad' })
  })

  it('insert: throws on error status', async () => {
    const http = new MockHttp((_req) => { void _req; return { status: 422, headers: {}, data: { message: 'invalid' } } })
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.insert('people', { name: 'x' })).rejects.toMatchObject({ status: 422, message: 'invalid' })
  })

  it('rpc: POST with body args', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('POST')
      expect(req.url).toContain('/rpc/add_them')
      expect(req.headers?.['Content-Type']).toBe('application/json')
      return { status: 200, headers: {}, data: 3 }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.rpc<number>('add_them', { a: 1, b: 2 })
    expect(res.data).toBe(3)
  })

  it('rpc: POST with options query string appends to URL', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('POST')
      expect(req.url).toBe('https://example.com/rpc/add_them?select=id')
      expect(req.headers?.['Content-Type']).toBe('application/json')
      return { status: 200, headers: {}, data: 3 }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.rpc<number>('add_them', { a: 1, b: 2 }, { method: 'POST', select: 'id' })
    expect(res.data).toBe(3)
  })

  it('rpc: GET with query args', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('GET')
      expect(req.url).toContain('/rpc/add_them')
      expect(req.url).toContain('a=1')
      expect(req.url).toContain('b=2')
      return { status: 200, headers: {}, data: 3 }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.rpc<number>('add_them', { a: 1, b: 2 }, { method: 'GET' })
    expect(res.data).toBe(3)
  })

  it('rpc: throws on error status', async () => {
    const http = new MockHttp((_req) => { void _req; return { status: 500, headers: {}, data: 'boom' } })
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.rpc('broken', { x: 1 })).rejects.toMatchObject({ status: 500, message: 'boom' })
  })

  it('rpc: POST without args sets empty body and content-type', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('POST')
      expect(req.url).toBe('https://example.com/rpc/noop')
      expect(req.headers?.['Content-Type']).toBe('application/json')
      return { status: 200, headers: {}, data: 'ok' }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.rpc<string>('noop', undefined, { method: 'POST' })
    expect(res.data).toBe('ok')
  })

  it('rpc: POST with options and no args still sets content-type', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('POST')
      expect(req.url).toBe('https://example.com/rpc/opt')
      expect(req.headers?.['Content-Type']).toBe('application/json')
      return { status: 200, headers: {}, data: 'ok' }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.rpc<string>('opt', undefined, { method: 'POST' })
    expect(res.data).toBe('ok')
  })

  it('rpc: GET without args falls back to base URL', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('GET')
      expect(req.url).toBe('https://example.com/rpc/ping')
      return { status: 200, headers: {}, data: 'ok' }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.rpc<string>('ping')
    expect(res.data).toBe('ok')
  })

  it('rpc: GET without args but with options query string', async () => {
    const http = new MockHttp((req) => {
      expect(req.method).toBe('GET')
      expect(req.url).toBe('https://example.com/rpc/ping?select=id')
      return { status: 200, headers: {}, data: 'ok' }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.rpc<string>('ping', undefined, { method: 'GET', select: 'id' })
    expect(res.data).toBe('ok')
  })
})
