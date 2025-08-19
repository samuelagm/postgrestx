/**
 * Query key factory for PostgREST queries
 */

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

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
  if (v && typeof v === 'object') return sortObject(v as Record<string, unknown>)
  return v
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

export const pgKey = {
  table(resource: string, params?: unknown) {
    return ['postgrest', 'table', resource, params ? stableStringify(params) : undefined].filter(Boolean)
  },
  rpc(fnName: string, args?: unknown, params?: unknown) {
    return ['postgrest', 'rpc', fnName, args ? stableStringify(args) : undefined, params ? stableStringify(params) : undefined].filter(Boolean)
  },
}

export type PgKey = Json[]
