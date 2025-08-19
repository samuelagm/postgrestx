/**
 * Minimal HTTP client interface for PostgREST
 */

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' | 'HEAD'
  url: string
  headers?: Record<string, string>
  body?: unknown
}

export interface HttpResponse<T = unknown> {
  status: number
  headers: Record<string, string>
  data: T
}

export interface HttpClient {
  request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>>
}

export interface FetchClientOptions {
  fetch?: typeof fetch
}

export function createFetchHttpClient(opts: FetchClientOptions = {}): HttpClient {
  const f = opts.fetch ?? globalThis.fetch
  return {
    async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
      const res = await f(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body && typeof req.body !== 'string' ? JSON.stringify(req.body) : (req.body as string | undefined),
      })
      const headers: Record<string, string> = {}
      res.headers.forEach((v, k) => (headers[k] = v))
      const ct = res.headers.get('content-type') ?? ''
      const isJson = ct.includes('application/json')
  const data = (isJson ? await res.json() : await res.text()) as T
  return { status: res.status, headers, data }
    },
  }
}
