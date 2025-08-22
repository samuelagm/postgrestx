/**
 * Query key utilities for PostgRESTX TanStack integration.
 *
 * Provides deterministic, stable keys for table and RPC queries. Keys are
 * structured arrays beginning with a namespace segment (`postgrest`).
 *
 * Why:
 * - Prevent accidental key collisions.
 * - Stable ordering of object properties via {@link stableStringify} ensures
 *   equivalent parameter objects produce identical keys.
 * - Enables broad invalidation (e.g. invalidate all table queries) by only
 *   matching the prefix.
 *
 * @example Table key
 * ```ts
 * const key = pgKey.table('users', { select: 'id,name', limit: 20 })
 * // ['postgrest','table','users','{"limit":20,"select":"id,name"}']
 * ```
 *
 * @example RPC key
 * ```ts
 * const key = pgKey.rpc('search_users', { term: 'ada' })
 * // ['postgrest','rpc','search_users','{"term":"ada"}']
 * ```
 *
 * @example Invalidation by prefix
 * ```ts
 * queryClient.invalidateQueries({ queryKey: pgKey.table('users') })
 * ```
 */

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json }

function sortObject<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  const keys = Object.keys(obj).sort()
  for (const k of keys) {
    const v = obj[k]
    out[k] = sortValue(v)
  }
  return out as T
}

function sortArray(arr: unknown[]): unknown[] {
  return arr.map(sortValue)
}

function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return sortArray(v)
  if (v && typeof v === 'object')
    return sortObject(v as Record<string, unknown>)
  return v
}

/**
 * Deterministic JSON stringify: sorts object keys deeply so structurally
 * equivalent objects with different key insertion order produce identical
 * serialized strings. Used internally by {@link pgKey}.
 *
 * @example
 * ```ts
 * stableStringify({ b: 1, a: 2 }) === stableStringify({ a: 2, b: 1 }) // true
 * ```
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

/**
 * Factory which builds stable TanStack Query keys for PostgREST resources.
 *
 * Key format:
 * - Table: `[ 'postgrest', 'table', resource, <params?> ]`
 * - RPC: `[ 'postgrest', 'rpc', fnName, <args?>, <params?> ]`
 *
 * Undefined trailing segments are stripped for brevity. Internally stringifies
 * params with {@link stableStringify} so order of keys does not matter.
 */
export const pgKey = {
  /**
   * Build a table/list key. Pass any shape for params (filters, pagination, etc).
   *
   * @example Basic
   * ```ts
   * pgKey.table('users')
   * // ['postgrest','table','users']
   * ```
   * @example With filters + pagination
   * ```ts
   * pgKey.table('users', { filters: [{ column: 'status', op: 'eq', value: 'active' }], limit: 20, offset: 40 })
   * ```
   * @example Deterministic ordering
   * ```ts
   * const a = pgKey.table('users', { b: 1, a: 2 })
   * const b = pgKey.table('users', { a: 2, b: 1 })
   * JSON.stringify(a) === JSON.stringify(b) // true
   * ```
   */
  table(resource: string, params?: unknown) {
    return [
      'postgrest',
      'table',
      resource,
      params ? stableStringify(params) : undefined,
    ].filter(Boolean)
  },
  /**
   * Build an RPC key containing function name + optionally args & metadata.
   *
   * @example Simple RPC
   * ```ts
   * pgKey.rpc('health')
   * // ['postgrest','rpc','health']
   * ```
   * @example With args
   * ```ts
   * pgKey.rpc('search_users', { term: 'ada' })
   * ```
   * @example Args & extra params (e.g. pagination meta)
   * ```ts
   * pgKey.rpc('search_users', { term: 'ada' }, { limit: 10 })
   * ```
   */
  rpc(fnName: string, args?: unknown, params?: unknown) {
    return [
      'postgrest',
      'rpc',
      fnName,
      args ? stableStringify(args) : undefined,
      params ? stableStringify(params) : undefined,
    ].filter(Boolean)
  },
}

export type PgKey = Json[]
