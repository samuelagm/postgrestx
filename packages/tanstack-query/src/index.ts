/**
 * Public entry for @postgrestx/tanstack-query
 */

import type { QueryOptions, WriteOptions } from '@postgrestx/core'
import type { PostgrestClient } from '@postgrestx/core'
import { useMutation, useQuery, useInfiniteQuery, type UseMutationOptions, type UseQueryOptions, type QueryFunctionContext, QueryClient, type UseInfiniteQueryOptions } from '@tanstack/react-query'
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

export const createInfiniteQueryFns = (client: PostgrestClient) => {
  return {
    select<T = unknown>(params: TableQueryParams & { initialFrom?: number; pageSize: number }) {
      return async ({ pageParam }: QueryFunctionContext): Promise<{ items: T; nextFrom?: number }> => {
        const from = (pageParam as number | undefined) ?? params.initialFrom ?? 0
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

export const createMutationFns = (client: PostgrestClient) => {
  return {
    insert<T = unknown>(resource: string, options?: WriteOptions) {
      return async (body: unknown) => (await client.insert<T>(resource, body, options)).data
    },
    update<T = unknown>(resource: string, options?: WriteOptions) {
      return async (body: unknown) => (await client.update<T>(resource, body, options)).data
    },
    upsert<T = unknown>(resource: string, options?: WriteOptions) {
      return async (body: unknown) => (await client.upsert<T>(resource, body, options)).data
    },
    delete<T = unknown>(resource: string, options?: QueryOptions) {
      return async () => (await client.delete<T>(resource, options)).data
    },
    rpc<T = unknown>(fnName: string, args?: Record<string, unknown>, options?: QueryOptions & { method?: 'GET' | 'POST' }) {
      return async () => (await client.rpc<T>(fnName, args, options)).data
    },
  }
}

// Invalidation helpers
export function invalidateTable(queryClient: QueryClient, tableName: string) {
  return queryClient.invalidateQueries({ queryKey: pgKey.table(tableName) })
}

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

function mapProfileHeaders(args?: { profile?: string }): Record<string, string> | undefined {
  if (!args?.profile) return undefined
  return { 'Accept-Profile': args.profile }
}

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
      const res = await client.select<Table[]>(tableName, { ...args, headers: mapProfileHeaders(args) })
      return { data: res.data, total: res.total, range: res.range }
    },
    ...options,
  })
}

export function useItem<Table = unknown>(
  tableName: string,
  pk: PrimaryKey,
  args?: { select?: SelectInput; profile?: string; pkColumn?: string } & Pick<QueryOptions, 'filters'>,
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
        filters: [{ column: pkColumn, op: 'eq', value: pk }, ...(rest?.filters ?? [])],
      })
      const row = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null
      return row
    },
    ...options,
  })
}

export function useInsert<Inserted = unknown, InsertInput = unknown>(
  tableName: string,
  options?: UseMutationOptions<Inserted, unknown, InsertInput>,
) {
  const client = usePostgrestClient()
  return useMutation<Inserted, unknown, InsertInput>({
    mutationFn: async (input) => (await client.insert<Inserted>(tableName, input)).data,
    ...options,
  })
}

export function useUpdate<Updated = unknown, PK extends PrimaryKey = PrimaryKey, Table = unknown>(
  tableName: string,
  options?: UseMutationOptions<Updated, unknown, { pk: PK; patch: Partial<Table>; pkColumn?: string }>,
) {
  const client = usePostgrestClient()
  return useMutation<Updated, unknown, { pk: PK; patch: Partial<Table>; pkColumn?: string }>({
    mutationFn: async (vars) => {
      const col = vars.pkColumn ?? 'id'
      const res = await client.update<Updated>(tableName, vars.patch, { filters: [{ column: col, op: 'eq', value: vars.pk }] })
      return res.data
    },
    ...options,
  })
}

export function useDelete<PK extends PrimaryKey = PrimaryKey>(
  tableName: string,
  options?: UseMutationOptions<void, unknown, { pk: PK; pkColumn?: string }>,
) {
  const client = usePostgrestClient()
  return useMutation<void, unknown, { pk: PK; pkColumn?: string }>({
    mutationFn: async (vars) => {
      const col = vars.pkColumn ?? 'id'
      await client.delete(tableName, { filters: [{ column: col, op: 'eq', value: vars.pk }] })
    },
    ...options,
  })
}

export function useUpsert<Upserted = unknown, UpsertInput = unknown>(
  tableName: string,
  options?: UseMutationOptions<Upserted, unknown, UpsertInput>,
) {
  const client = usePostgrestClient()
  return useMutation<Upserted, unknown, UpsertInput>({
    mutationFn: async (input) => (await client.upsert<Upserted>(tableName, input)).data,
    ...options,
  })
}

export function useRpc<RpcReturn = unknown, RpcArgs extends Record<string, unknown> = Record<string, unknown>>(
  functionName: string,
  options?: UseMutationOptions<RpcReturn, unknown, RpcArgs>,
) {
  const client = usePostgrestClient()
  return useMutation<RpcReturn, unknown, RpcArgs>({
    mutationFn: async (args) => (await client.rpc<RpcReturn>(functionName, args)).data,
    ...options,
  })
}

export function useInfiniteList<Table = unknown>(
  tableName: string,
  params: ListArgs & { pageSize: number; initialFrom?: number },
  options?: UseInfiniteQueryOptions<{ items: Table[]; nextFrom?: number }, unknown>,
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

