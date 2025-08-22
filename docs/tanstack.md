# React + TanStack Guide

Comprehensive React integration for PostgREST built on TanStack Query v5. Provides declarative data fetching, mutations, cache keys and invalidation helpers.

## At a Glance

| Hook / Utility           | Purpose                           | Returns / Notes                                                         |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------------- |
| `useList`                | Fetch list + total/range metadata | `query.data` → `{ data: T[]; total?: number; range?: [number,number] }` |
| `useInfiniteList`        | Infinite scroll pagination        | Pages array: `{ items: T[]; nextFrom: number \| null }`                 |
| `useItem`                | Single row by primary key         | `T \| null`                                                             |
| `useInsert`              | Insert rows                       | Mutation (inserted rows if representation)                              |
| `useUpdate`              | Patch by primary key              | Mutation                                                                |
| `useDelete`              | Delete by primary key             | Mutation (void)                                                         |
| `useUpsert`              | Upsert rows                       | Mutation                                                                |
| `useRpc`                 | Execute RPC (mutation form)       | Mutation (RPC result)                                                   |
| `invalidateTable`        | Invalidate all queries for table  | Utility                                                                 |
| `invalidateRpc`          | Invalidate RPC queries            | Utility                                                                 |
| `pgKey`                  | Cache key builder                 | Stable namespaced keys                                                  |
| `createQueryFns`         | Factory for custom queryFns       | Build query fns                                                         |
| `createInfiniteQueryFns` | Infinite query page loaders       | Build infinite query fns                                                |
| `createMutationFns`      | Mutation function factory         | Build mutation fns                                                      |

## Provider Setup

Wrap your app with `PostgrestProvider` and a TanStack `QueryClientProvider`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostgrestProvider } from '@postgrestx/tanstack'
import { createFetchHttpClient, PostgrestClient } from '@postgrestx/core'

const queryClient = new QueryClient()
const http = createFetchHttpClient()
const client = new PostgrestClient('https://api.example.com', http)

export function App({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PostgrestProvider value={{ client }}>{children}</PostgrestProvider>
    </QueryClientProvider>
  )
}
```

## Typing Rows

Provide generic row interfaces to each hook for strict typing:

```ts
interface User {
  id: number
  name: string
  status: string
}
const users = useList<User>('users', { select: 'id,name,status', limit: 20 })
```

---

## `useList`

Fetch multiple rows with optional select, filters, ordering, pagination or count strategy.

```tsx
const query = useList<User>('users', {
  select: 'id,name,status',
  limit: 20,
  offset: 0,
  order: 'created_at.desc',
  filters: [{ column: 'status', op: 'eq', value: 'active' }],
  count: 'exact',
})

if (query.isLoading) return <Spinner />
return (
  <div>
    <p>Total: {query.data?.total ?? '—'}</p>
    <ul>
      {query.data?.data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  </div>
)
```

With a PostgREST profile header (multischema / RLS contexts):

```ts
useList<User>('users', { profile: 'tenant_a', select: 'id,name' })
```

### Pagination Patterns

- Offset pagination: supply `limit` & `offset` (compute next offset from length or `range`).
- Range pagination: use `range: { from, to }` manually for fine control.

---

## `useInfiniteList`

Infinite scrolling using `pageSize` + Content-Range total.

```tsx
const products = useInfiniteList<Product>(
  'products',
  { select: 'id,name,price', pageSize: 50 },
  {
    getNextPageParam: (last) => last.nextFrom,
  },
)

const all = products.data?.pages.flatMap((p) => p.items) ?? []
```

Load more trigger:

```tsx
<button
  disabled={!products.hasNextPage || products.isFetchingNextPage}
  onClick={() => products.fetchNextPage()}
>
  {products.isFetchingNextPage
    ? 'Loading...'
    : products.hasNextPage
      ? 'More'
      : 'End'}
</button>
```

---

## `useItem`

Fetch a single row by primary key (default pk column: `id`). Returns `null` if not found.

```tsx
const user = useItem<User>('users', 42)
console.log(user.data) // User | null
```

Custom primary key column:

```ts
useItem<User>('users', 'uuid-123', { pkColumn: 'uuid', select: 'uuid,name' })
```

Tenant-scoped single row:

```ts
useItem<User>('users', 42, {
  filters: [{ column: 'tenant_id', op: 'eq', value: currentTenant }],
})
```

---

## Mutations (`useInsert`, `useUpdate`, `useDelete`, `useUpsert`)

### Insert

```tsx
const insertUser = useInsert<User, Pick<User, 'name'>>('users', {
  onSuccess: () => invalidateTable(queryClient, 'users'),
})
insertUser.mutate({ name: 'Ada' })
```

### Update (patch by pk)

```tsx
const updateUser = useUpdate<User>('users')
updateUser.mutate({ pk: 1, patch: { name: 'Grace' } })
```

### Delete

```tsx
const del = useDelete('users', {
  onSuccess: () => invalidateTable(queryClient, 'users'),
})
del.mutate({ pk: 5 })
```

### Upsert

```tsx
const upsertUser = useUpsert<User>('users')
upsertUser.mutate({ id: 1, name: 'Grace' })
```

#### Mutation Error Handling

```tsx
const insertUser = useInsert<User, { name: string }>('users', {
  onError: (err) => {
    // Could be PostgrestError if server responded with error JSON
    console.error(err)
  },
})
```

---

## `useRpc`

Execute a PostgREST RPC as a mutation (fire-and-forget or returning data):

```tsx
interface SearchResult {
  id: number
  name: string
}
const runSearch = useRpc<SearchResult[], { term: string }>('search_users')
runSearch.mutate({ term: 'ada' })
```

Refetch dependent table queries upon success:

```ts
const run = useRpc('recompute_stats', {
  onSuccess: () => invalidateTable(queryClient, 'stats'),
})
```

---

## Invalidation Helpers

```ts
invalidateTable(queryClient, 'users') // All users list / item queries
invalidateRpc(queryClient, 'search_users') // All search_users RPC queries
```

Call inside mutation `onSuccess` to keep cache fresh.

---

## Cache Keys (`pgKey`)

`pgKey` provides stable, namespaced array keys to eliminate collisions and enable broad prefix invalidation.

### Why not just `['users', params]`?

| Concern                           | Ad‑hoc Key          | `pgKey`                                    |
| --------------------------------- | ------------------- | ------------------------------------------ |
| Collision risk with other libs    | Higher              | Namespaced (`postgrest`)                   |
| Param ordering stability          | Need manual sort    | Built-in deep sort via `stableStringify`   |
| Partial invalidation (all tables) | Hard (no namespace) | Invalidate by prefix `'postgrest','table'` |

### Forms

```ts
pgKey.table('users', {
  limit: 20,
  filters: [{ column: 'status', op: 'eq', value: 'active' }],
})
pgKey.rpc('search_users', { term: 'ada' })
```

Internally the param object is deterministically stringified so these produce identical keys:

```ts
pgKey.table('users', { a: 1, b: 2 })
pgKey.table('users', { b: 2, a: 1 }) // same serialized segment
```

### Invalidation Patterns

```ts
// Invalidate every users query (any params)
queryClient.invalidateQueries({ queryKey: pgKey.table('users') })

// Invalidate a specific RPC variant
queryClient.invalidateQueries({
  queryKey: pgKey.rpc('search_users', { term: 'ada' }),
})

// Broad: all PostgREST table queries
queryClient.invalidateQueries({ queryKey: ['postgrest', 'table'] })
```

### Anti‑Patterns

- Mutating the params object after passing to a hook (breaks referential stability); build a new object instead.
- Encoding large transient objects (functions, DOM nodes) – only include serialisable data used by the server.

See full API: [pgKey](./api/tanstack/src/variables/pgKey.md)

---

## Custom Factories

Custom factories let you compose _hook-like ergonomics_ without locking into the provided hooks, enabling:

- Domain-specific hooks (`useActiveUsers`, `useTenantUsers`)
- Centralized concern injection (logging, metrics, auth headers) once
- Reduced inline function churn (perf micro-optimisation)

### Choosing Between Built-in Hooks vs Factories

| Scenario                                                | Use Hook              | Use Factory                          |
| ------------------------------------------------------- | --------------------- | ------------------------------------ |
| Simple list / item                                      | ✅                    |                                      |
| Need custom staleTime / select transform in many places | ❌ (repeated options) | ✅ build wrapper                     |
| RPC with dynamic composite key                          | ✅ (useRpc + pgKey)   | ✅ if you want query (GET) semantics |
| Complex infinite pagination logic                       |                       | ✅ extend `createInfiniteQueryFns`   |

### `createQueryFns`

Returns small closures producing `queryFn`s for `useQuery`.

```ts
const fns = createQueryFns(client)
export function useActiveUsers(limit = 50) {
  return useQuery({
    queryKey: pgKey.table('users', { status: 'active', limit }),
    queryFn: fns.select<User>({
      resource: 'users',
      select: 'id,name',
      filters: [{ column: 'status', op: 'eq', value: 'active' }],
      limit,
    }),
  })
}
```

Add projection transforms:

```ts
const userNames = useQuery({
  queryKey: pgKey.table('users', { namesOnly: true }),
  queryFn: async () =>
    (await fns.select<User>({ resource: 'users', select: 'id,name' })()).map(
      (u) => u.name,
    ),
})
```

### `createInfiniteQueryFns`

Build custom infinite list hooks with baked-in filters / page size.

```ts
const inf = createInfiniteQueryFns(client)
export function useExpensiveProducts(minPrice: number) {
  return useInfiniteQuery({
    queryKey: pgKey.table('products', { minPrice, pageSize: 30 }),
    queryFn: inf.select<Product>({
      resource: 'products',
      pageSize: 30,
      select: 'id,name,price',
      filters: [{ column: 'price', op: 'gt', value: minPrice }],
    }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextFrom,
  })
}
```

### `createMutationFns`

Compose domain mutation sets once.

```ts
const mut = createMutationFns(client)
export function useUserMutations() {
  const insertUser = useMutation({ mutationFn: mut.insert<User>('users') })
  const updateUser = useMutation({ mutationFn: mut.update<User>('users') })
  return { insertUser, updateUser }
}
```

Inject global mutation behavior:

```ts
const mut = createMutationFns(client)
function withLog<TInput, TOut>(fn: (input: TInput) => Promise<TOut>) {
  return async (input: TInput) => {
    console.time('mutation')
    try {
      return await fn(input)
    } finally {
      console.timeEnd('mutation')
    }
  }
}
const insertLogged = () => withLog(mut.insert<User>('users'))
useMutation({ mutationFn: insertLogged() })
```

### Anti‑Patterns

- Re-creating factory objects every render (wrap in `useMemo` if inside components).
- Passing unstable inline objects to `pgKey.*` each render without memoization _when_ objects are large (small literals are fine).

---

## Patterns & Best Practices

### Co-locate Filters

Keep filters in component state or derived from props so cache keys change automatically.

### Narrow Select Lists

Select only needed columns to reduce payloads (e.g. `select: 'id,name'`).

### Handling Not Found

`useItem` returns `null` not an error for missing rows – check `data === null`.

### Error Surfaces

- Network / fetch errors: appear as `query.error`.
- PostgREST JSON errors: normalized into `PostgrestError` (inspect `code`, `hint`).

### Optimistic Updates

Implement via TanStack Query standard patterns; keys provided by `pgKey` make invalidation straightforward.

---

## Troubleshooting

| Symptom                   | Cause                                       | Fix                                                             |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| `total` is null           | Server omitted `Content-Range`              | Add `count=exact` or enable counting in PostgREST config        |
| Mutation result missing   | Prefer header not requesting representation | Use `prefer: { return: 'representation' }` in core client usage |
| Stale list after mutation | Missing invalidation                        | Call `invalidateTable(queryClient, 'table')` in `onSuccess`     |

---

## See Also

- API Reference: [Hooks](./api/tanstack/src/README.md)
- Core Client Guide: [Core](./core)
- Cache Keys Reference: [pgKey](./api/tanstack/src/variables/pgKey.md)

---

Need more patterns? Open an issue or PR!
