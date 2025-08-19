import { describe, expect, it } from 'vitest'
import { PostgrestClient } from '../src/postgrest/client'
import type { HttpClient, HttpResponse } from '../src/postgrest/http'

class MockHttp implements HttpClient {
  constructor(private responder: (url: string) => HttpResponse<unknown> | Promise<HttpResponse<unknown>>) {}
  async request<T>(req: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' | 'HEAD'; url: string; headers?: Record<string, string> }): Promise<HttpResponse<T>> {
    return (await this.responder(req.url)) as HttpResponse<T>
  }
}

describe('PostgrestClient.select', () => {
  it('builds URL with filters and select, parses Content-Range total', async () => {
  const http = new MockHttp((url) => {
      expect(url).toContain('/people?select=id%2Cname')
      expect(url).toContain('age=gte.18')
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
})
