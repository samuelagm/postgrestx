 
import { describe, expect, it, vi } from 'vitest'
import { createQueryFns, createMutationFns, pgKey, stableStringify } from '../src'
import type { PostgrestClient, QueryResult, QueryOptions, WriteOptions } from '@postgrestx/core'

function mockClient(overrides: Partial<PostgrestClient> = {}): PostgrestClient {
  const client: Partial<PostgrestClient> = {
    baseUrl: 'http://example',
    http: { request: vi.fn() },
  select<T = unknown>(_: string, __?: QueryOptions): Promise<QueryResult<T>> {
      return Promise.resolve({ data: [{ id: 1 }] as unknown as T, total: 10, range: { from: 0, to: 0, unit: 'items' }, status: 200 })
    },
  insert<T = unknown>(_: string, __: unknown, ___?: WriteOptions): Promise<QueryResult<T>> {
      return Promise.resolve({ data: { ok: true } as unknown as T, total: null, range: null, status: 201 })
    },
  update<T = unknown>(_: string, __: unknown, ___?: WriteOptions): Promise<QueryResult<T>> {
      return Promise.resolve({ data: { ok: true } as unknown as T, total: null, range: null, status: 200 })
    },
  upsert<T = unknown>(_: string, __: unknown, ___?: WriteOptions): Promise<QueryResult<T>> {
      return Promise.resolve({ data: { ok: true } as unknown as T, total: null, range: null, status: 201 })
    },
  delete<T = unknown>(_: string, __?: QueryOptions): Promise<QueryResult<T>> {
      return Promise.resolve({ data: { ok: true } as unknown as T, total: null, range: null, status: 204 })
    },
  rpc<T = unknown>(_: string, __?: Record<string, unknown>, ___?: QueryOptions & { method?: 'GET' | 'POST' }): Promise<QueryResult<T>> {
      return Promise.resolve({ data: 3 as unknown as T, total: null, range: null, status: 200 })
    },
    ...overrides,
  }
  return client as PostgrestClient
}

describe('@postgrestx/tanstack-query', () => {
  it('pgKey produces stable keys', () => {
    const k1 = pgKey.table('people', { order: ['a', 'b'], filters: { id: 1, name: 'x' } })
    const k2 = pgKey.table('people', { filters: { name: 'x', id: 1 }, order: ['a', 'b'] })
    expect(k1).toEqual(k2)
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
  })

  it('createQueryFns.select returns data', async () => {
    const client = mockClient()
    const fns = createQueryFns(client)
    const fn = fns.select<{ id: number }[]>({ resource: 'people', select: 'id' })
    const data = await fn()
    expect(Array.isArray(data)).toBe(true)
  })

  it('createMutationFns.insert returns data', async () => {
    const client = mockClient()
    const m = createMutationFns(client)
    const mutate = m.insert('people')
    const data = await mutate({ id: 1 })
    expect(data).toEqual({ ok: true })
  })
})
