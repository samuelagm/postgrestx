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

## Type generator (MVP)

Generate basic table interfaces and operator helpers from a PostgREST OpenAPI JSON.

```sh
pnpm -w build
pnpm --filter @postgrestx/core exec postgrestx-generate --input ./openapi.json --out ./packages/core/src/types/generated
```

Inputs supported:
- Local file path (JSON)
- HTTP/HTTPS URL (GETs JSON)
- Stdin by passing `--input -` (pipe JSON in)
- Data URL (e.g., `data:application/json;base64,eyJvcGVuYXBpIjoiMy4wLjAifQ==`)

Outputs:
- `tables.d.ts` — interfaces per table/view
- `operators.d.ts` — primitive-based operator types (placeholder)
- `metadata.json` — table/column/primary key summary

## Contributing: CLI test hooks

For robust coverage of the CLI’s I/O branches, tests use a few opt-in globals to shim behavior without spinning up complex infrastructure:

- `globalThis.__PGX_HTTP_GET__?: (url: string) => Promise<string>`
  - If set, `httpGet` returns this Promise result instead of making a network call.
- `globalThis.__PGX_READ_STDIN__?: () => Promise<string>`
  - If set, the CLI will read stdin from this hook instead of `process.stdin`.
- `globalThis.__PGX_HTTPS_AGENT__?: unknown`
  - If set when fetching an `https://` URL, it will be passed as the `agent` to the HTTPS request (useful to exercise the custom-agent branch in tests).
- `globalThis.__PGX_REQUEST_SHIM__?: { httpRequest?: typeof http.request; httpsRequest?: typeof https.request }`
  - If set, the CLI will call these functions instead of Node’s built-in `http.request` / `https.request`. This lets tests simulate success and error responses for both HTTP and HTTPS, with or without agent, and cover all branches deterministically.

These hooks are only inspected at runtime by the CLI and are never set in production code. They exist solely to improve testability and coverage.

Run tests with coverage from the repo root:

```sh
pnpm -w test
```
