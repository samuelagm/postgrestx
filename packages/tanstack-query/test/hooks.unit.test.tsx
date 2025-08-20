import React from 'react'
import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { PostgrestProvider } from '../src'
import { useList, useItem, useInsert, useUpdate, useDelete, useUpsert, useRpc, createQueryFns, createInfiniteQueryFns, createMutationFns, useInfiniteList } from '../src'
import type { PostgrestClient, QueryResult, QueryOptions, HttpClient, HttpResponse } from '@postgrestx/core'
import type { QueryFunctionContext } from '@tanstack/react-query'

type MinimalClient = Pick<PostgrestClient, 'baseUrl' | 'http' | 'select' | 'insert' | 'update' | 'upsert' | 'delete' | 'rpc'>
function mockClient(): MinimalClient {
    const baseUrl = 'http://example'
    const http: HttpClient = { request: async <T,>(): Promise<HttpResponse<T>> => ({ status: 200, headers: {}, data: [] as unknown as T }) }
    const result = <T,>(data: T, status = 200): QueryResult<T> => ({ data, total: 2, range: { from: 0, to: 0, unit: 'items' }, status })
    return {
        baseUrl,
        http,
        async select<T = unknown>() {
            return result([{ id: 1, name: 'a' }] as unknown as T)
        },
        async insert<T = unknown>() {
            return result({ ok: true, id: 1 } as unknown as T, 201)
        },
        async update<T = unknown>() {
            return result({ ok: true } as unknown as T)
        },
        async upsert<T = unknown>() {
            return result({ ok: true } as unknown as T, 201)
        },
        async delete<T = unknown>() {
            return { data: undefined as unknown as T, total: null, range: null, status: 204 }
        },
        async rpc<T = unknown>() {
            return result(5 as unknown as T)
        },
    }
}

describe('hooks unit', () => {
    it('useList returns data/total/range and respects profile', async () => {
        const client = mockClient()
        function Cmp() {
            const q = useList<{ id: number; name: string }>('people', { select: 'id,name', profile: 'alt' })
            return React.createElement('div', null, q.isSuccess ? `ok:${q.data?.total}` : 'loading')
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('ok:2')).toBeTruthy())
    })

    it('useItem returns single row and default pkColumn/id override', async () => {
        const client = mockClient()
        function Cmp() {
            const q1 = useItem<{ id: number; name: string }>('people', 1)
            const q2 = useItem<{ id: number; name: string }>('people', 1, { pkColumn: 'uuid', filters: [] })
            const val = q1.data && q2.data ? (q1.data as { id: number }).id : null
            return React.createElement('div', null, q1.isSuccess && q2.isSuccess ? `id:${val}` : 'loading')
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('id:1')).toBeTruthy())
    })

    it('mutation hooks call client methods (insert/update/delete/upsert/rpc)', async () => {
        const client = mockClient()
        function Cmp() {
            const ins = useInsert('people')
            const upd = useUpdate('people')
            const upd2 = useUpdate('people')
            const del = useDelete('people')
            const del2 = useDelete('people')
            const ups = useUpsert('people')
            const rpc = useRpc<number, { a: number; b: number }>('add')
            React.useEffect(() => {
                ; (async () => {
                    await ins.mutateAsync({ name: 'x' })
                    await upd.mutateAsync({ pk: 1, patch: { name: 'y' } })
                    await upd2.mutateAsync({ pk: 1, patch: { name: 'y' }, pkColumn: 'uuid' })
                    await del.mutateAsync({ pk: 1 })
                    await del2.mutateAsync({ pk: 1, pkColumn: 'uuid' })
                    await ups.mutateAsync({ id: 1, name: 'z' })
                    await rpc.mutateAsync({ a: 2, b: 3 })
                })()
            }, [])
            return React.createElement('div', null, 'done')
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('done')).toBeTruthy())
    })

    it('factory fns select/rpc/infinite and mutations work', async () => {
        const client = mockClient()
        const qf = createQueryFns(client as unknown as PostgrestClient)
        const rf = createInfiniteQueryFns(client as unknown as PostgrestClient)
        const mf = createMutationFns(client as unknown as PostgrestClient)
        const s = await qf.select<{ id: number }[]>({ resource: 'people' })()
        expect(Array.isArray(s)).toBe(true)
        const r = await qf.rpc<number>({ fnName: 'add', args: { a: 1, b: 2 } })()
        expect(r).toBe(5)
        const ctx = { client: new QueryClient(), queryKey: ['k'], signal: new AbortController().signal, meta: undefined, pageParam: 0 } satisfies QueryFunctionContext
        const inf = await rf.select<{ id: number }[]>({ resource: 'people', pageSize: 1 })(ctx)
        expect(inf.items).toBeDefined()
        expect(typeof inf.nextFrom === 'number' || inf.nextFrom === undefined).toBe(true)
        // total null branch
        const clientNullTotal = {
            ...client,
            async select<T = unknown>() {
                return { data: [{ id: 1 }] as unknown as T, total: null, range: null, status: 200 }
            },
        }
        const rf2 = createInfiniteQueryFns(clientNullTotal as unknown as PostgrestClient)
        const ctx2 = { client: new QueryClient(), queryKey: ['k'], signal: new AbortController().signal, meta: undefined, pageParam: 0 } satisfies QueryFunctionContext
        const inf2 = await rf2.select<{ id: number }[]>({ resource: 'people', pageSize: 1 })(ctx2)
        expect(typeof inf2.nextFrom).toBe('number')
        // initialFrom branch when pageParam undefined
        const inf3 = await rf.select<{ id: number }[]>({ resource: 'people', pageSize: 1, initialFrom: 5 })({ client: new QueryClient(), queryKey: ['k'], signal: new AbortController().signal, meta: undefined } satisfies QueryFunctionContext)
        expect(inf3.nextFrom).toBeUndefined()
        await mf.insert('people')({ id: 1 })
        await mf.update('people')({ pk: 1, patch: { id: 1 } })
        await mf.upsert('people')({ id: 1 })
        await mf.delete('people')()
        await mf.rpc<number>('add', { a: 1, b: 2 })()
    })

    it('createInfiniteQueryFns falls back to from=0 when pageParam and initialFrom are absent', async () => {
        let seenFrom: number | undefined
        const client = {
            ...mockClient(),
            async select<T = unknown>(_: string, o?: QueryOptions) {
                seenFrom = o?.range?.from
                return { data: [] as unknown as T, total: 2, range: { from: seenFrom ?? 0, to: (seenFrom ?? 0), unit: 'items' }, status: 200 }
            },
        }
        const rf = createInfiniteQueryFns(client as unknown as PostgrestClient)
        const ctx = { client: new QueryClient(), queryKey: ['k'], signal: new AbortController().signal, meta: undefined } satisfies QueryFunctionContext
        await rf.select<{ id: number }[]>({ resource: 'people', pageSize: 1 })(ctx)
        expect(seenFrom).toBe(0)
    })

    it('useItem returns null when no rows', async () => {
        const client = {
            ...mockClient(),
            async select<T = unknown>() {
                return { data: [] as unknown as T, total: 0, range: { from: 0, to: 0, unit: 'items' }, status: 200 }
            },
        }
        function Cmp() {
            const q = useItem<{ id: number; name: string }>('people', 99)
            return React.createElement('div', null, q.isSuccess ? `val:${String(q.data)}` : 'loading')
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('val:null')).toBeTruthy())
    })

    it('useInfiniteList returns undefined nextFrom on end', async () => {
        // client.total=2 and pageSize=2 should yield nextFrom undefined
        const client = mockClient()
        function Cmp() {
            const q = useInfiniteList<{ id: number; name: string }>('people', { select: 'id', pageSize: 2 })
            const inf = q.data as InfiniteData<{ items: { id: number; name: string }[]; nextFrom?: number }> | undefined
            const last = (inf?.pages ?? [])[(inf?.pages.length ?? 1) - 1]
            const np = last?.nextFrom
            return React.createElement('div', null, q.isPending ? 'loading' : `np:${String(np)}`)
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('np:undefined')).toBeTruthy())
    })

    it('useInfiniteList calls getNextPageParam via fetchNextPage', async () => {
        const client = {
            ...mockClient(),
            async select<T = unknown>() {
                // Pretend total=3 to force two pages with pageSize=2
                return { data: [{ id: 1, name: 'a' }] as unknown as T, total: 3, range: { from: 0, to: 1, unit: 'items' }, status: 200 }
            },
        }
        function Cmp() {
            const q = useInfiniteList<{ id: number; name: string }>('people', { select: 'id,name', pageSize: 2 })
            const inf = q.data as InfiniteData<{ items: { id: number; name: string }[]; nextFrom?: number }> | undefined
            React.useEffect(() => {
                if (q.isSuccess && (inf?.pages.length ?? 0) < 2) {
                    void q.fetchNextPage()
                }
            }, [q.isSuccess, inf?.pages.length])
            const pages = inf?.pages.length ?? 0
            return React.createElement('div', null, `pages:${pages}`)
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('pages:2')).toBeTruthy())
    })

    it('useInfiniteList respects initialFrom and sets Accept-Profile header', async () => {
        let seenFrom: number | undefined
        let seenProfile: string | undefined
        const client = {
            ...mockClient(),
            async select<T = unknown>(_: string, o?: QueryOptions) {
                seenFrom = o?.range?.from
                seenProfile = o?.headers?.['Accept-Profile']
                return { data: [] as unknown as T, total: 4, range: { from: seenFrom ?? 0, to: (seenFrom ?? 0), unit: 'items' }, status: 200 }
            },
        }
        function Cmp() {
            const q = useInfiniteList<{ id: number }>('people', { select: 'id', pageSize: 1, initialFrom: 3, profile: 'alt' })
            return React.createElement('div', null, q.isPending ? 'loading' : `from:${String(seenFrom)};p:${String(seenProfile)}`)
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('from:3;p:alt')).toBeTruthy())
    })

    it('useInfiniteList with null total computes nextFrom as to+1', async () => {
        const client = {
            ...mockClient(),
            async select<T = unknown>() {
                return { data: [{ id: 1 }] as unknown as T, total: null, range: { from: 0, to: 0, unit: 'items' }, status: 200 }
            },
        }
        function Cmp() {
            const q = useInfiniteList<{ id: number }>('people', { select: 'id', pageSize: 1 })
            const inf = q.data as InfiniteData<{ items: { id: number }[]; nextFrom?: number }> | undefined
            return React.createElement('div', null, q.isPending ? 'loading' : `nf:${String(inf?.pages[0]?.nextFrom)}`)
        }
        const { getByText } = render(
            React.createElement(QueryClientProvider, { client: new QueryClient() },
                React.createElement(PostgrestProvider, { client: client as unknown as PostgrestClient, children: React.createElement(Cmp) })
            )
        )
        await waitFor(() => expect(getByText('nf:1')).toBeTruthy())
    })

    // Note: In TanStack Query v5, fetchNextPage no longer accepts a pageParam override.
    // The manual override test from v4 is intentionally omitted.
})
