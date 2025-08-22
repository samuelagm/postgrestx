# Core Client

Low-level building blocks for type‑safe PostgREST interactions. The **Core** package focuses on: HTTP abstraction, query construction, error normalization, range metadata and preference handling. Higher-level React hooks live in the TanStack adapter.

---

## Architecture Overview

| Layer             | Responsibility                                                      |
| ----------------- | ------------------------------------------------------------------- |
| `HttpClient`      | Minimal fetch abstraction returning `{ status, headers, data }`     |
| `PostgrestClient` | Composes queries (select / insert / update / delete / upsert / rpc) |
| `encode.ts`       | Builds query parameters, headers, and parses `Content-Range`        |
| `errors.ts`       | Normalizes server JSON into `PostgrestError`                        |

---

## Creating a Client

```ts
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'

const http = createFetchHttpClient() // optionally pass custom fetch
const client = new PostgrestClient('https://example.com', http)
```

Custom fetch (for SSR / polyfill / auth):

```ts
import fetch from 'cross-fetch'
const client = new PostgrestClient(
  process.env.API_URL!,
  createFetchHttpClient({ fetch }),
)
```

---

## Performing Reads (SELECT)

```ts
const { data, total, range } = await client.select<User[]>('users', {
  select: 'id,name,status',
  filters: [{ column: 'status', op: 'eq', value: 'active' }],
  order: 'created_at.desc',
  limit: 50,
  count: 'exact',
})
```

`total` is parsed from `Content-Range` if PostgREST returns it (when `count` preference requested).

### Filter Helpers

Filters are objects `{ column, op, value, modifier?, negated? }` enabling complex server-side filtering.

```ts
const filters = [
  { column: 'age', op: 'gte', value: 18 },
  { column: 'status', op: 'eq', value: 'active' },
]
await client.select('users', { filters })
```

### Ordering

Use PostgREST order syntax: `'created_at.desc.nullslast'` or pass array for multiple orderings.

### Ranging & Pagination

Either:

```ts
await client.select('users', { limit: 20, offset: 40 }) // offset style
```

or provide an explicit range:

```ts
await client.select('users', { range: { from: 40, to: 59 } })
```

---

## Mutations

### Insert

```ts
const inserted = await client.insert<User[]>(
  'users',
  { name: 'Ada' },
  { prefer: { return: 'representation' } },
)
```

### Update

```ts
await client.update(
  'users',
  { status: 'inactive' },
  { filters: [{ column: 'id', op: 'eq', value: 42 }] },
)
```

### Upsert

```ts
await client.upsert(
  'users',
  { id: 1, name: 'Grace' },
  { prefer: { resolution: 'merge-duplicates', return: 'representation' } },
)
```

### Delete

```ts
await client.delete('users', {
  filters: [{ column: 'id', op: 'eq', value: 5 }],
})
```

---

## RPC Calls

GET when no args; POST otherwise (or override via `method`).

```ts
await client.rpc('health') // GET
await client.rpc('search_users', { term: 'ada' }) // POST
```

Optional query options integrate filters / headers / count just like SELECT.

---

## Preferences (`Prefer` Header)

Control response body & upsert behavior:
| Option | Purpose |
| ------ | ------- |
| `return` | `minimal` / `headers-only` / `representation` |
| `resolution` | Upsert conflict handling (`merge-duplicates` / `ignore-duplicates`) |
| `count` | Counting strategy (`exact`, `planned`, `estimated`) |
| `handling` | `strict` vs `lenient` error reporting |
| `timezone` | Set timezone for timestamptz conversions |

Example:

```ts
await client.insert(
  'users',
  { name: 'New' },
  { prefer: { return: 'representation' } },
)
```

---

## Error Handling

All non-2xx/3xx responses become a `PostgrestError` with `code`, `message`, `details`, `hint`, `status`.

```ts
try {
  await client.insert('users', { name: 'Duplicate Name' })
} catch (e) {
  if (e instanceof PostgrestError) {
    console.error(e.status, e.code, e.message)
  }
}
```

---

## Type Safety Strategy

Generate table & RPC types from your PostgREST schema, then map generics:

```ts
type User = { id: number; name: string; status: string }
const res = await client.select<User[]>('users', { select: 'id,name,status' })
```

Combine with a higher-level generated enum of table names if desired.

---

## Performance Tips

| Tip                                    | Benefit                              |
| -------------------------------------- | ------------------------------------ |
| Narrow `select` lists                  | Smaller payloads & faster parsing    |
| Use `count='estimated'` for big tables | Lower DB cost than exact             |
| Avoid large `offset` on deep pages     | Consider keyset / range approach     |
| Reuse a single `HttpClient` instance   | Prevent redundant closure allocation |

---

## Debugging

Log raw responses by wrapping `fetch`:

```ts
const http = createFetchHttpClient({
  fetch: async (...a) => {
    const res = await fetch(...a)
    console.debug('[postgrestx]', res.status, res.url)
    return res
  },
})
```

---

## Quick Reference

| Action | Method                            |
| ------ | --------------------------------- |
| Read   | `select`                          |
| Insert | `insert`                          |
| Update | `update`                          |
| Upsert | `upsert` (POST + resolution pref) |
| Delete | `delete`                          |
| RPC    | `rpc`                             |

See API docs for full type signatures.
