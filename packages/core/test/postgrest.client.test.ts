import { describe, expect, it } from 'vitest'
import { PostgrestClient } from '../src/postgrest/client'
import type { HttpClient, HttpResponse } from '../src/postgrest/http'

class MockHttp implements HttpClient {
  constructor(private responder: (url: string) => HttpResponse<unknown> | Promise<HttpResponse<unknown>>) { }
  async request<T>(req: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' | 'HEAD'; url: string; headers?: Record<string, string> }): Promise<HttpResponse<T>> {
    return (await this.responder(req.url)) as HttpResponse<T>
  }
}

describe('PostgrestClient.select', () => {
  it('builds URL with filters and select, parses Content-Range total', async () => {
    const http = new MockHttp((_url) => {
      expect(_url).toContain('/people?select=id%2Cname')
      expect(_url).toContain('age=gte.18')
      return {
        status: 206,
        headers: { 'content-range': 'items 0-24/321' },
        data: [{ id: 1, name: 'a' }],
      }
    })

    const client = new PostgrestClient('https://example.com', http)
    const res = await client.select<{ id: number; name: string }[]>('people', {
      select: 'id,name',
      filters: [{ column: 'age', op: 'gte', value: 18 }],
      count: 'exact',
      range: { from: 0, to: 24 },
    })

    expect(res.status).toBe(206)
    expect(res.total).toBe(321)
    expect(res.range).toEqual({ from: 0, to: 24, unit: 'items' })
    expect(Array.isArray(res.data)).toBe(true)
  })

  it('parses uppercase Content-Range header as fallback', async () => {
    const http = new MockHttp(() => {
      return {
        status: 206,
        headers: { 'Content-Range': 'items 10-19/100' },
        data: [{ id: 11, name: 'b' }],
      }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.select('people')
    expect(res.total).toBe(100)
    expect(res.range).toEqual({ from: 10, to: 19, unit: 'items' })
  })

  it('returns null total and range when Content-Range header is absent', async () => {
    const http = new MockHttp(() => ({ status: 200, headers: {}, data: [{ id: 1 }] }))
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.select('people')
    expect(res.total).toBeNull()
    expect(res.range).toBeNull()
  })

  it('select: throws on error status', async () => {
    const http = new MockHttp(() => ({ status: 401, headers: {}, data: { error: 'unauthorized' } }))
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.select('people')).rejects.toMatchObject({ status: 401, message: 'unauthorized' })
  })

  it('normalizes baseUrl by removing trailing slash', async () => {
    const http = new MockHttp((url) => {
      expect(url).toBe('https://example.com/people')
      return { status: 200, headers: {}, data: [] }
    })
    const client = new PostgrestClient('https://example.com/', http)
    const res = await client.select('people')
    expect(res.status).toBe(200)
  })

  it('prefers lowercase content-range over uppercase when both present', async () => {
    const http = new MockHttp(() => {
      return {
        status: 206,
        headers: { 'content-range': 'items 0-9/10', 'Content-Range': 'items 0-4/5' },
        data: [],
      }
    })
    const client = new PostgrestClient('https://example.com', http)
    const res = await client.select('people')
    expect(res.total).toBe(10)
    expect(res.range).toEqual({ unit: 'items', from: 0, to: 9 })
  })
})
