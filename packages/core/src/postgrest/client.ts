import { buildHeaders, buildQueryParams, parseContentRange } from './encode'
import { normalizeError } from './errors'
import type { HttpClient, HttpResponse } from './http'
import type { QueryOptions, QueryResult, WriteOptions } from './types'

/**
 * High-level PostgREST client exposing convenience CRUD + RPC helpers.
 *
 * All helpers return a {@link QueryResult} which includes paging metadata parsed
 * from the `Content-Range` header when available.
 *
 * Errors are normalized into {@link PostgrestError} via {@link normalizeError}.
 *
 * @example Creating a client
 * ```ts
 * import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'
 * const http = createFetchHttpClient()
 * const client = new PostgrestClient('https://example.com', http)
 * ```
 *
 * @example Selecting rows
 * ```ts
 * const { data, total } = await client.select('users', { select: 'id,name', limit: 20 })
 * ```
 *
 * @example Filtering
 * ```ts
 * const { data } = await client.select('users', {
 *   select: '*',
 *   filters: [ { column: 'status', op: 'eq', value: 'active' } ],
 *   order: 'created_at.desc'
 * })
 * ```
 *
 * @example Insert
 * ```ts
 * await client.insert('users', { name: 'Ada' }, { prefer: { return: 'representation' } })
 * ```
 *
 * @example RPC (GET if no args else POST)
 * ```ts
 * const { data } = await client.rpc('search_users', { term: 'ada' })
 * ```
 */

export class PostgrestClient {
  readonly baseUrl: string
  readonly http: HttpClient

  constructor(baseUrl: string, http: HttpClient) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.http = http
  }

  /**
   * Perform a SELECT query against a table or view.
   * @param resource Table or view name.
   * @param options Query modifiers (filters/order/range/etc).
   */
  async select<T = unknown>(
    resource: string,
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = buildHeaders(options)
    const res = await this.http.request<T>({ method: 'GET', url, headers })
    if (res.status >= 400)
      throw normalizeError(res as unknown as HttpResponse<unknown>)
    return this.wrap<T>(res)
  }

  /** Insert row(s) into a table.
   * When `prefer.return` includes `representation` the inserted rows are returned.
   */
  async insert<T = unknown>(
    resource: string,
    body: unknown,
    options?: WriteOptions,
  ): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = {
      'Content-Type': 'application/json',
      ...buildHeaders(options),
    }
    const res = await this.http.request<T>({
      method: 'POST',
      url,
      headers,
      body,
    })
    if (res.status >= 400)
      throw normalizeError(res as unknown as HttpResponse<unknown>)
    return this.wrap<T>(res)
  }

  /** Update row(s) using filters / range options provided. */
  async update<T = unknown>(
    resource: string,
    body: unknown,
    options?: WriteOptions,
  ): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = {
      'Content-Type': 'application/json',
      ...buildHeaders(options),
    }
    const res = await this.http.request<T>({
      method: 'PATCH',
      url,
      headers,
      body,
    })
    if (res.status >= 400)
      throw normalizeError(res as unknown as HttpResponse<unknown>)
    return this.wrap<T>(res)
  }

  /** Delete row(s) matching supplied filters */
  async delete<T = unknown>(
    resource: string,
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const headers = buildHeaders(options)
    const res = await this.http.request<T>({ method: 'DELETE', url, headers })
    if (res.status >= 400)
      throw normalizeError(res as unknown as HttpResponse<unknown>)
    return this.wrap<T>(res)
  }

  /** Upsert (insert or merge) row(s); defaults resolution to merge-duplicates unless overridden. */
  async upsert<T = unknown>(
    resource: string,
    body: unknown,
    options?: WriteOptions,
  ): Promise<QueryResult<T>> {
    const qs = buildQueryParams(options)
    const url = `${this.baseUrl}/${resource}${qs ? `?${qs}` : ''}`
    const prefer = {
      ...options?.prefer,
      resolution: options?.prefer?.resolution ?? 'merge-duplicates',
    }
    const headers = {
      'Content-Type': 'application/json',
      ...buildHeaders({ ...options, prefer }),
    }
    const res = await this.http.request<T>({
      method: 'POST',
      url,
      headers,
      body,
    })
    return this.wrap<T>(res)
  }

  /** Call a PostgREST RPC function. GET when no args provided, otherwise POST. */
  async rpc<T = unknown>(
    fnName: string,
    args?: Record<string, unknown>,
    options?: QueryOptions & { method?: 'GET' | 'POST' },
  ): Promise<QueryResult<T>> {
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
    if (res.status >= 400)
      throw normalizeError(res as unknown as HttpResponse<unknown>)
    return this.wrap<T>(res)
  }

  private wrap<T>(res: HttpResponse<T>): QueryResult<T> {
    const cr = parseContentRange(
      res.headers['content-range'] ?? res.headers['Content-Range'] ?? null,
    )
    return {
      data: res.data,
      total: cr?.total ?? null,
      range: cr ? { from: cr.from, to: cr.to, unit: cr.unit } : null,
      status: res.status,
    }
  }
}
