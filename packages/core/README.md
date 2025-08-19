# @postgrestx/core

Minimal PostgREST client with pluggable HTTP, typed options, and error normalization.

## Install

```sh
pnpm add @postgrestx/core
```

## Usage

```ts
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'

const http = createFetchHttpClient()
const client = new PostgrestClient('https://your-postgrest.example.com', http)

// Select
const res = await client.select<{ id: number; name: string }[]>('people', {
  select: 'id,name',
  filters: [{ column: 'age', op: 'gte', value: 18 }],
  count: 'exact',
  range: { from: 0, to: 24 },
})
console.log(res.status, res.total, res.range, res.data)

// Insert with preferences
await client.insert('people', [{ id: 1, name: 'John' }], {
  columns: 'id,name',
  prefer: { return: 'representation', missing: 'default' },
})

// Upsert with conflict target
await client.upsert('employees', [{ name: 'Jane', salary: 100 }], {
  on_conflict: 'name',
})

// RPC (POST)
const sum = await client.rpc<number>('add_them', { a: 1, b: 2 })
console.log(sum.data)

// RPC (GET)
const sum2 = await client.rpc<number>('add_them', { a: 1, b: 2 }, { method: 'GET' })
console.log(sum2.data)
```

## Error handling

All non-2xx responses throw a normalized `PostgrestError` with common fields.

```ts
import { PostgrestError } from '@postgrestx/core'

try {
  await client.update('people', { name: 'Jane' }, {
    filters: [{ column: 'id', op: 'eq', value: 99999 }],
    prefer: { return: 'headers-only' },
  })
} catch (e) {
  if (e instanceof PostgrestError) {
    console.error('status', e.status)
    console.error('code', e.code)
    console.error('message', e.message)
    console.error('details', e.details)
  }
}
```

## HTTP client

By default we provide a `createFetchHttpClient` that uses `globalThis.fetch`. You can implement and pass your own `HttpClient` (Axios, etc.).

```ts
import type { HttpClient, HttpRequest, HttpResponse } from '@postgrestx/core'

const axiosClient: HttpClient = {
  async request<T>(req: HttpRequest): Promise<HttpResponse<T>> {
    // example only – map axios response to HttpResponse
    const { default: axios } = await import('axios')
    const res = await axios({ url: req.url, method: req.method, headers: req.headers, data: req.body })
    return { status: res.status, headers: res.headers as Record<string, string>, data: res.data as T }
  },
}
```
