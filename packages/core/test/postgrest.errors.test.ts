import { describe, expect, it } from 'vitest'
import { PostgrestClient } from '../src/postgrest/client'
import type { HttpClient, HttpRequest, HttpResponse } from '../src/postgrest/http'
import { PostgrestError } from '../src/postgrest/errors'

class MockHttp implements HttpClient {
  constructor(private responder: (req: HttpRequest) => HttpResponse<unknown> | Promise<HttpResponse<unknown>>) {}
  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    return (await this.responder(req)) as HttpResponse<T>
  }
}

describe('PostgrestClient error normalization', () => {
  it('throws PostgrestError with fields from JSON body on 4xx', async () => {
    const http = new MockHttp(() => ({
      status: 400,
      headers: {},
      data: { code: 'PGRST123', message: 'Bad request', details: { field: 'age' }, hint: 'check input' },
    }))
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.select('people')).rejects.toBeInstanceOf(PostgrestError)
    await expect(client.select('people')).rejects.toMatchObject({
      status: 400,
      code: 'PGRST123',
      message: 'Bad request',
      details: { field: 'age' },
      hint: 'check input',
    })
  })

  it('uses `error` field as message when `message` is absent', async () => {
    const http = new MockHttp(() => ({
      status: 404,
      headers: {},
      data: { error: 'Not found' },
    }))
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.delete('things')).rejects.toMatchObject({ status: 404, message: 'Not found' })
  })

  it('uses text body as message on 5xx', async () => {
    const http = new MockHttp(() => ({ status: 500, headers: {}, data: 'Internal Server Error' }))
    const client = new PostgrestClient('https://example.com', http)
    await expect(client.insert('people', {})).rejects.toMatchObject({ status: 500, message: 'Internal Server Error' })
  })
})
