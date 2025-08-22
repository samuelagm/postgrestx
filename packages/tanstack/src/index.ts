// Axios adapter export
export { createAxiosHttpClient } from './http/axiosHttpClient'
/**
 * Public entry for @postgrestx/tanstack
 */

import type { QueryOptions, WriteOptions } from '@postgrestx/core'
import type { PostgrestClient } from '@postgrestx/core'
import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  type UseMutationOptions,
  type UseQueryOptions,
  type QueryFunctionContext,
  QueryClient,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query'
import { pgKey } from './keys'
export { pgKey, stableStringify } from './keys'
import { usePostgrestClient } from './context'
export { PostgrestProvider } from './context'

export interface TableQueryParams extends Omit<QueryOptions, 'headers'> {
  resource: string
}

export interface RpcQueryParams extends Omit<QueryOptions, 'headers'> {
  fnName: string
  args?: Record<string, unknown>
  method?: 'GET' | 'POST'
}

/**
 * Factory producing basic query functions suitable for use with TanStack Query's `queryFn`.
 *
 * When / Why:
 * - Need to compose additional behaviors (retry, staleTime) without wrapping our provided hooks.
 * - Building domain-specific hooks (e.g. `useActiveUsers`) while centralizing selection & encoding.
 * - Sharing a single `PostgrestClient` across many query functions without recreating closures each render.
 *
 * @example Basic
 * ```ts
 * const fns = createQueryFns(client)
 * const usersQuery = useQuery({
 *   queryKey: pgKey.table('users', { select: 'id,name' }),
 *   queryFn: fns.select<User>({ resource: 'users', select: 'id,name' })
 * })
 * ```
 * @example RPC custom hook
 * ```ts
 * function useSearch(term: string) {
 *   const fns = React.useMemo(() => createQueryFns(client), [client])
 *   return useQuery({
 *     queryKey: pgKey.rpc('search_users', { term }),
 *     queryFn: fns.rpc<User[]>({ fnName: 'search_users', args: { term } })
 *   })
 * }
 * ```
 */
export const createQueryFns = (client: PostgrestClient) => {
  return {
    select<T = unknown>({ resource, ...options }: TableQueryParams) {
      return async () => {
        const res = await client.select<T>(resource, options)
        return res.data
      }
    },
    rpc<T = unknown>({ fnName, args, method, ...options }: RpcQueryParams) {
      return async () => {
        const res = await client.rpc<T>(fnName, args, { ...options, method })
        return res.data
      }
    },
  }
}

/**
 * Factory for building infinite query functions based on a page size.
 * Handles `Content-Range` parsing and next page calculation.
 *
 * When / Why:
 * - Need infinite list but want custom composition (e.g. dynamic pageSize, merging pages differently).
 * - Building specialized infinite hooks that pre-fill filters.
 *
 * @example Basic
 * ```ts
 * const fns = createInfiniteQueryFns(client)
 * const products = useInfiniteQuery({
 *   queryKey: pgKey.table('products', { pageSize: 25 }),
 *   queryFn: fns.select<Product>({ resource: 'products', pageSize: 25, select: 'id,name,price' }),
 *   initialPageParam: 0,
 *   getNextPageParam: (last) => last.nextFrom
 * })
 * ```
 */
export const createInfiniteQueryFns = (client: PostgrestClient) => {
  return {
    select<T = unknown>(
      params: TableQueryParams & { initialFrom?: number; pageSize: number },
    ) {
      return async ({
        pageParam,
      }: QueryFunctionContext): Promise<{ items: T; nextFrom?: number }> => {
        const from =
          (pageParam as number | undefined) ?? params.initialFrom ?? 0
        const to = from + params.pageSize - 1
        const res = await client.select<T>(params.resource, {
          ...params,
          range: { from, to },
        })
        const total = res.total ?? null
        const nextFrom = total !== null && to + 1 >= total ? undefined : to + 1
        return { items: res.data, nextFrom }
      }
    },
  }
}

/**
 * Factory for building reusable mutation functions wrapping PostgREST operations.
 *
 * When / Why:
 * - Centralize mutation options (e.g. always request representation, logging).
 * - Build domain-level abstractions (e.g. `mutations.insertUser`).
 * - Avoid recreating inline mutation functions inside components.
 *
 * @example Insert helper
 * ```ts
 * const { insert } = createMutationFns(client)
 * const addUser = useMutation({ mutationFn: insert<User>('users') })
 * ```
 */
export const createMutationFns = (client: PostgrestClient) => {
  return {
    insert<T = unknown>(resource: string, options?: WriteOptions) {
      return async (body: unknown) =>
        (await client.insert<T>(resource, body, options)).data
    },
    update<T = unknown>(resource: string, options?: WriteOptions) {
      return async (body: unknown) =>
        (await client.update<T>(resource, body, options)).data
    },
    upsert<T = unknown>(resource: string, options?: WriteOptions) {
      return async (body: unknown) =>
        (await client.upsert<T>(resource, body, options)).data
    },
    delete<T = unknown>(resource: string, options?: QueryOptions) {
      return async () => (await client.delete<T>(resource, options)).data
    },
    rpc<T = unknown>(
      fnName: string,
      args?: Record<string, unknown>,
      options?: QueryOptions & { method?: 'GET' | 'POST' },
    ) {
      return async () => (await client.rpc<T>(fnName, args, options)).data
    },
  }
}

// Invalidation helpers
/**
 * Invalidate every query for a given table (all variants of args).
 *
 * Call after mutations to keep cached data fresh.
 *
 * @example
 * ```ts
 * await mutateAsync(newRow)
 * invalidateTable(queryClient, 'users')
 * ```
 */
export function invalidateTable(queryClient: QueryClient, tableName: string) {
  return queryClient.invalidateQueries({ queryKey: pgKey.table(tableName) })
}

/** Invalidate all queries generated by an RPC function name. */
export function invalidateRpc(queryClient: QueryClient, fnName: string) {
  return queryClient.invalidateQueries({ queryKey: pgKey.rpc(fnName) })
}

// Hook signatures per requested API
export type PrimaryKey = string | number
export type SelectInput = string | undefined

export interface ListArgs extends Omit<QueryOptions, 'headers'> {
  select?: SelectInput
  profile?: string
}

export interface ListResult<Table> {
  data: Table[]
  total: number | null
  range: { from: number; to: number | null; unit: string } | null
}

function mapProfileHeaders(args?: {
  profile?: string
}): Record<string, string> | undefined {
  if (!args?.profile) return undefined
  return { 'Accept-Profile': args.profile }
}

/**
 * Fetch a list of rows with optional filtering, ordering and pagination hints.
 * Returns data plus `total` and `range` metadata when the server provides `Content-Range`.
 *
 * @typeParam Table Row shape (defaults to unknown) – supply for strong typing.
 *
 * @example Basic
 * ```ts
 * const query = useList<User>('users', { select: 'id,name', limit: 20 })
 * ```
 *
 * @example With profile header
 * ```ts
 * useList<User>('users', { profile: 'tenant_a', select: 'id,name' })
 * ```
 */
export function useList<Table = unknown>(
  tableName: string,
  args?: ListArgs,
  options?: UseQueryOptions<ListResult<Table>, unknown, ListResult<Table>>,
) {
  const client = usePostgrestClient()
  const key = pgKey.table(tableName, args)
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await client.select<Table[]>(tableName, {
        ...args,
        headers: mapProfileHeaders(args),
      })
      return { data: res.data, total: res.total, range: res.range }
    },
    ...options,
  })
}

/**
 * Fetch a single row by primary key.
 *
 * Internally performs a SELECT with `limit: 1` and returns `null` if no row found.
 * The primary key column defaults to `id` but can be overridden with `pkColumn`.
 * Additional filters can be merged (e.g. tenant scoping) – they are appended after the pk filter.
 *
 * @typeParam Table Row shape.
 *
 * @example Basic
 * ```ts
 * const user = useItem<User>('users', 42)
 * ```
 *
 * @example Custom primary key column
 * ```ts
 * useItem<User>('users', '1b2c', { pkColumn: 'uuid', select: 'uuid,name' })
 * ```
 *
 * @example With filters
 * ```ts
 * useItem<User>('users', 42, { filters: [{ column: 'tenant_id', op: 'eq', value: currentTenant }] })
 * ```
 *
 * @example Strong typing
 * ```ts
 * interface User { id: number; name: string }
 * const q = useItem<User>('users', 1)
 * q.data?.name // typed as string | undefined
 * ```
 */
export function useItem<Table = unknown>(
  tableName: string,
  pk: PrimaryKey,
  args?: { select?: SelectInput; profile?: string; pkColumn?: string } & Pick<
    QueryOptions,
    'filters'
  >,
  options?: UseQueryOptions<Table | null, unknown, Table | null>,
) {
  const client = usePostgrestClient()
  const { pkColumn = 'id', ...rest } = args ?? {}
  const key = pgKey.table(tableName, { ...rest, pk, pkColumn })
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await client.select<Table[]>(tableName, {
        ...rest,
        headers: mapProfileHeaders(rest),
        limit: 1,
        filters: [
          { column: pkColumn, op: 'eq', value: pk },
          ...(rest?.filters ?? []),
        ],
      })
      const row =
        Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null
      return row
    },
    ...options,
  })
}

/**
 * Insert row(s) into a table as a mutation hook.
 *
 * @example
 * ```ts
 * const insertUser = useInsert<User, NewUser>('users', { onSuccess: () => invalidateTable(qc, 'users') })
 * insertUser.mutate({ name: 'Ada' })
 * ```
 */
export function useInsert<Inserted = unknown, InsertInput = unknown>(
  tableName: string,
  options?: UseMutationOptions<Inserted, unknown, InsertInput>,
) {
  const client = usePostgrestClient()
  return useMutation<Inserted, unknown, InsertInput>({
    mutationFn: async (input) =>
      (await client.insert<Inserted>(tableName, input)).data,
    ...options,
  })
}

/**
 * Update rows by primary key (single row convenience) using a patch object.
 *
 * @example
 * ```ts
 * const updateUser = useUpdate<User>('users')
 * updateUser.mutate({ pk: 1, patch: { name: 'Grace' } })
 * ```
 */
export function useUpdate<
  Updated = unknown,
  PK extends PrimaryKey = PrimaryKey,
  Table = unknown,
>(
  tableName: string,
  options?: UseMutationOptions<
    Updated,
    unknown,
    { pk: PK; patch: Partial<Table>; pkColumn?: string }
  >,
) {
  const client = usePostgrestClient()
  return useMutation<
    Updated,
    unknown,
    { pk: PK; patch: Partial<Table>; pkColumn?: string }
  >({
    mutationFn: async (vars) => {
      const col = vars.pkColumn ?? 'id'
      const res = await client.update<Updated>(tableName, vars.patch, {
        filters: [{ column: col, op: 'eq', value: vars.pk }],
      })
      return res.data
    },
    ...options,
  })
}

/**
 * Delete a single row by primary key.
 *
 * @example
 * ```ts
 * const del = useDelete('users')
 * del.mutate({ pk: 3 })
 * ```
 */
export function useDelete<PK extends PrimaryKey = PrimaryKey>(
  tableName: string,
  options?: UseMutationOptions<void, unknown, { pk: PK; pkColumn?: string }>,
) {
  const client = usePostgrestClient()
  return useMutation<void, unknown, { pk: PK; pkColumn?: string }>({
    mutationFn: async (vars) => {
      const col = vars.pkColumn ?? 'id'
      await client.delete(tableName, {
        filters: [{ column: col, op: 'eq', value: vars.pk }],
      })
    },
    ...options,
  })
}

/**
 * Upsert (insert or merge) row(s) as a mutation.
 * Useful for idempotent create/update flows.
 */
export function useUpsert<Upserted = unknown, UpsertInput = unknown>(
  tableName: string,
  options?: UseMutationOptions<Upserted, unknown, UpsertInput>,
) {
  const client = usePostgrestClient()
  return useMutation<Upserted, unknown, UpsertInput>({
    mutationFn: async (input) =>
      (await client.upsert<Upserted>(tableName, input)).data,
    ...options,
  })
}

/**
 * Execute a PostgREST RPC function as a mutation.
 *
 * @example
 * ```ts
 * const runSearch = useRpc<{ id: number }[], { term: string }>('search_users')
 * runSearch.mutate({ term: 'ada' })
 * ```
 */
export function useRpc<
  RpcReturn = unknown,
  RpcArgs extends Record<string, unknown> = Record<string, unknown>,
>(
  functionName: string,
  options?: UseMutationOptions<RpcReturn, unknown, RpcArgs>,
) {
  const client = usePostgrestClient()
  return useMutation<RpcReturn, unknown, RpcArgs>({
    mutationFn: async (args) =>
      (await client.rpc<RpcReturn>(functionName, args)).data,
    ...options,
  })
}

/**
 * Infinite scrolling list helper built on `useInfiniteQuery`.
 * Computes `nextFrom` based on total count / Content-Range.
 *
 * @example
 * ```ts
 * const products = useInfiniteList<Product>('products', { pageSize: 50, select: 'id,name,price' }, {
 *   getNextPageParam: (last) => last.nextFrom
 * })
 * ```
 */
export function useInfiniteList<Table = unknown>(
  tableName: string,
  params: ListArgs & { pageSize: number; initialFrom?: number },
  options?: UseInfiniteQueryOptions<
    { items: Table[]; nextFrom?: number },
    unknown
  >,
) {
  const client = usePostgrestClient()
  const key = pgKey.table(tableName, params)
  return useInfiniteQuery({
    queryKey: key,
    initialPageParam: params.initialFrom ?? 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number
      const to = from + params.pageSize - 1
      const res = await client.select<Table[]>(tableName, {
        ...params,
        headers: mapProfileHeaders(params),
        range: { from, to },
      })
      const total = res.total ?? null
      const nextFrom = total !== null && to + 1 >= total ? undefined : to + 1
      return { items: res.data, nextFrom }
    },
    getNextPageParam: (lastPage) => lastPage.nextFrom,
    ...options,
  })
}
