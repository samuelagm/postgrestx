/**
 * Public entry for @postgrestx/core
 */
export { PostgrestClient } from './postgrest/client.js'
export { createFetchHttpClient } from './postgrest/http.js'
export type { HttpClient, HttpRequest, HttpResponse, FetchClientOptions } from './postgrest/http.js'
export { PostgrestError, normalizeError } from './postgrest/errors.js'
export type { PostgrestErrorPayload } from './postgrest/errors.js'
export type {
  Operator,
  Filter,
  FilterValue,
  QueryOptions,
  Pagination,
  CountStrategy,
  QueryResult,
  PreferenceOptions,
  ReturnPreference,
  ResolutionPreference,
  HandlingPreference,
  WriteOptions,
} from './postgrest/types.js'

