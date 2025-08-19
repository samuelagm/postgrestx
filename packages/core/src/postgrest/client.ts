import { buildHeaders, buildQueryParams, parseContentRange } from './encode'
import { normalizeError } from './errors'
import type { HttpClient, HttpResponse } from './http'
import type { QueryOptions, QueryResult, WriteOptions } from './types'

export class PostgrestClient {
  readonly baseUrl: string
  readonly http: HttpClient

  constructor(baseUrl: string, http: HttpClient) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.http = http
  }

  async select<T = unknown>(resource: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = buildHeaders(options)
  const res = await this.http.request<T>({ method: 'GET', url, headers })
  if (res.status >= 400) throw normalizeError(res as unknown as HttpResponse<unknown>)
  return this.wrap<T>(res)
  }

  async insert<T = unknown>(resource: string, body: unknown, options?: WriteOptions): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = { 'Content-Type': 'application/json', ...buildHeaders(options) }
  const res = await this.http.request<T>({ method: 'POST', url, headers, body })
  if (res.status >= 400) throw normalizeError(res as unknown as HttpResponse<unknown>)
  return this.wrap<T>(res)
  }

  async update<T = unknown>(resource: string, body: unknown, options?: WriteOptions): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = { 'Content-Type': 'application/json', ...buildHeaders(options) }
  const res = await this.http.request<T>({ method: 'PATCH', url, headers, body })
  if (res.status >= 400) throw normalizeError(res as unknown as HttpResponse<unknown>)
  return this.wrap<T>(res)
  }

  async delete<T = unknown>(resource: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = buildHeaders(options)
  const res = await this.http.request<T>({ method: 'DELETE', url, headers })
  if (res.status >= 400) throw normalizeError(res as unknown as HttpResponse<unknown>)
  return this.wrap<T>(res)
  }

  async upsert<T = unknown>(resource: string, body: unknown, options?: WriteOptions): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const prefer = { ...options?.prefer, resolution: options?.prefer?.resolution ?? 'merge-duplicates' }
    const headers = { 'Content-Type': 'application/json', ...buildHeaders({ ...options, prefer }) }
    const res = await this.http.request<T>({ method: 'POST', url, headers, body })
    return this.wrap<T>(res)
  }

  async rpc<T = unknown>(fnName: string, args?: Record<string, unknown>, options?: QueryOptions & { method?: 'GET' | 'POST' }): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const base = `${this.baseUrl}/rpc/${fnName}`
    const method = options?.method ?? (args ? 'POST' : 'GET')
    let url = base
    let body: unknown = undefined
    const headers = { ...buildHeaders(options) }
    if (method === 'GET') {
      const qp = new URLSearchParams(qs)
      if (args) {
        for (const [k, v] of Object.entries(args)) qp.append(k, String(v))
      }
      const s = qp.toString()
      url = `${base}${s ? `?${s}` : ''}`
    } else {
      url = `${base}${qs ? `?${qs}` : ''}`
      headers['Content-Type'] = 'application/json'
      body = args ?? {}
    }
  const res = await this.http.request<T>({ method, url, headers, body })
  if (res.status >= 400) throw normalizeError(res as unknown as HttpResponse<unknown>)
  return this.wrap<T>(res)
  }

  private wrap<T>(res: HttpResponse<T>): QueryResult<T> {
    const cr = parseContentRange(res.headers['content-range'] ?? res.headers['Content-Range'] ?? null)
    return {
      data: res.data,
      total: cr?.total ?? null,
      range: cr ? { from: cr.from, to: cr.to, unit: cr.unit } : null,
      status: res.status,
    }
  }
}
