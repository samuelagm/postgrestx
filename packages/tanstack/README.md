# @postgrestx/tanstack

React + TanStack Query hooks for PostgREST.

👉 Full React guide: https://samuelagm.github.io/postgrestx/tanstack • API: https://samuelagm.github.io/postgrestx/api/tanstack/src/README

---

## Install

```bash
pnpm add @postgrestx/tanstack @postgrestx/core @tanstack/react-query react react-dom
```

## Minimal Setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostgrestProvider } from '@postgrestx/tanstack'
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'

const client = new PostgrestClient(
  'https://example.com',
  createFetchHttpClient(),
)
const qc = new QueryClient()

export function App({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <PostgrestProvider value={{ client }}>{children}</PostgrestProvider>
    </QueryClientProvider>
  )
}
```

## Example Hook

```tsx
import { useList } from '@postgrestx/tanstack'

function Users() {
  const q = useList('users', { select: 'id,name', limit: 10 })
  if (q.isLoading) return <p>Loading…</p>
  return (
    <ul>
      {q.data?.data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}
```

Included hooks: `useList`, `useItem`, `useInfiniteList`, `useInsert`, `useUpdate`, `useDelete`, `useUpsert`, `useRpc` plus `pgKey`, `invalidateTable`, `invalidateRpc`.

See docs for infinite queries, mutations, custom factories, cache keys.

---

## License

MIT
