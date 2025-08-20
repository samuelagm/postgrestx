# @postgrestx/tanstack

React utilities and hooks to use PostgREST (via `@postgrestx/core`) with TanStack Query v5.

## Install

Peer deps you must have in your app:

- `react`, `react-dom`
- `@tanstack/react-query`
- `@postgrestx/core`


## Setup

Wrap your app with both providers:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostgrestProvider, createAxiosHttpClient } from '@postgrestx/tanstack'
import { PostgrestClient } from '@postgrestx/core'
import axios from 'axios'

const client = new PostgrestClient({
	baseUrl: 'https://your-postgrest.example.com',
	http: createAxiosHttpClient(axios), // <-- use axios as HTTP client
})

export function AppProviders({ children }: { children: React.ReactNode }) {
	const [qc] = React.useState(() => new QueryClient())
	return (
		<QueryClientProvider client={qc}>
			<PostgrestProvider client={client}>{children}</PostgrestProvider>
		</QueryClientProvider>
	)
}
```

Or, to use the default fetch client:

```tsx
import { createFetchHttpClient } from '@postgrestx/core'
// ...
const client = new PostgrestClient({
	baseUrl: 'https://your-postgrest.example.com',
	http: createFetchHttpClient(),
})
```
## Using Axios as HTTP Client

You can use [axios](https://axios-http.com/) as a drop-in replacement for fetch by importing and using `createAxiosHttpClient`:

```tsx
import { createAxiosHttpClient } from '@postgrestx/tanstack'
import axios from 'axios'

const client = new PostgrestClient({
	baseUrl: 'https://your-postgrest.example.com',
	http: createAxiosHttpClient(axios),
})
```

This enables all axios features (interceptors, advanced config, etc) while maintaining fetch compatibility.


## Hooks

- Queries
	- `useList(table, args?, options?)`
	- `useItem(table, pk, { select?, profile?, pkColumn?, filters? }, options?)`
	- `useInfiniteList(table, { pageSize, initialFrom?, ...args }, options?)`
- Mutations
	- `useInsert(table, options?)`
	- `useUpdate(table, options?)`
	- `useDelete(table, options?)`
	- `useUpsert(table, options?)`
	- `useRpc(functionName, options?)`

Helpers:

- Keys: `pgKey.table(...)`, `pgKey.rpc(...)`, `stableStringify(...)`
- Invalidation: `invalidateTable(queryClient, tableName)`, `invalidateRpc(queryClient, fnName)`

## useInfiniteList quickstart

`useInfiniteList` pages through a table using Content-Range. Provide a `pageSize` and (optionally) `initialFrom`.

```tsx
import { useInfiniteList } from '@postgrestx/tanstack'

function People() {
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteList<{ id: number; name: string }>('people', {
		pageSize: 20,
		select: 'id,name',
		order: [{ column: 'id', ascending: true }],
	})

	const items = (data?.pages ?? []).flatMap((p) => p.items)

	return (
		<div>
			{items.map((p) => (
				<div key={p.id}>{p.name}</div>
			))}
			<button disabled={!hasNextPage || isFetchingNextPage} onClick={() => fetchNextPage()}>
				{isFetchingNextPage ? 'Loading…' : hasNextPage ? 'Load more' : 'No more'}
			</button>
		</div>
	)
}
```

Notes:

- The hook returns pages of shape `{ items: T[]; nextFrom?: number }` and wires `getNextPageParam` for you.
- It respects typical `ListArgs` options like `select`, `order`, `filters`, and `profile`.

## Invalidation helpers

```ts
import { invalidateTable, invalidateRpc } from '@postgrestx/tanstack'

await invalidateTable(queryClient, 'people')
await invalidateRpc(queryClient, 'add_todo')
```

## SSR

Follow TanStack Query v5 SSR guides (prefetch, dehydrate, hydrate). Keys from `pgKey` are stable and serializable.

## Exports

- Hooks: `useList`, `useItem`, `useInfiniteList`, `useInsert`, `useUpdate`, `useDelete`, `useUpsert`, `useRpc`
- Provider: `PostgrestProvider`
- Keys & helpers: `pgKey`, `stableStringify`, `invalidateTable`, `invalidateRpc`

Refer to the samples for end-to-end usage.
