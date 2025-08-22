/**
 * Core types for PostgREST client.
 *
 * Use these to build advanced queries.
 *
 * @example Building filters
 * ```ts
 * const filters: Filter[] = [
 *   { column: 'status', op: 'eq', value: 'active' },
 *   { column: 'age', op: 'gte', value: 18 }
 * ]
 * ```
 */

export type Operator =
  | 'eq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'neq'
  | 'like'
  | 'ilike'
  | 'match'
  | 'imatch'
  | 'in'
  | 'is'
  | 'isdistinct'
  | 'fts'
  | 'plfts'
  | 'phfts'
  | 'wfts'
  | 'cs'
  | 'cd'
  | 'ov'
  | 'sl'
  | 'sr'
  | 'nxr'
  | 'nxl'
  | 'adj'
  | 'not'
  | 'or'
  | 'and'
  | 'any'
  | 'all'

export type Primitive = string | number | boolean | null
export type FilterValue = Primitive | Primitive[]

export interface Filter {
  column: string
  op: Operator
  value?: FilterValue
  /** eq(any) / like(all) */
  modifier?: 'any' | 'all'
  /** prefix filter with not. */
  negated?: boolean
}

export type CountStrategy = 'exact' | 'planned' | 'estimated'

export interface Pagination {
  from: number
  to?: number
}

export interface QueryOptions {
  select?: string
  filters?: Filter[]
  order?: string | string[]
  limit?: number
  offset?: number
  range?: Pagination
  count?: CountStrategy
  /** Additional headers to send with the request */
  headers?: Record<string, string>
  /** Preferences to include in the Prefer header */
  prefer?: PreferenceOptions
}

export interface QueryResult<T> {
  data: T
  /** Parsed from Content-Range if available; null if unknown */
  total: number | null
  /** Range as echoed by server; null if absent */
  range: { from: number; to: number | null; unit: string } | null
  /** Raw response status code */
  status: number
}

/** Prefer header options as per PostgREST docs (RFC 7240) */
export type ReturnPreference = 'minimal' | 'headers-only' | 'representation'
export type ResolutionPreference = 'merge-duplicates' | 'ignore-duplicates'
export type HandlingPreference = 'strict' | 'lenient'

export interface PreferenceOptions {
  return?: ReturnPreference
  resolution?: ResolutionPreference
  missing?: 'default'
  count?: CountStrategy
  handling?: HandlingPreference
  timezone?: string
  tx?: 'commit' | 'rollback'
  maxAffected?: number
}

export interface WriteOptions extends QueryOptions {
  /** Limit inserted keys to these columns */
  columns?: string
  /** Upsert conflict target, e.g., "name" or a composite key "(col1,col2)" */
  on_conflict?: string
}
