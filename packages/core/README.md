# @postgrestx/core

Minimal PostgREST client: typed options, preferences, error normalization.

👉 Full docs: https://samuelagm.github.io/postgrestx/core • API: https://samuelagm.github.io/postgrestx/api/core/src/README

---

## Install

```bash
pnpm add @postgrestx/core
```

## Tiny Example

```ts
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'
const client = new PostgrestClient(
  'https://example.com',
  createFetchHttpClient(),
)
const { data } = await client.select('people', { select: 'id,name', limit: 10 })
```

See docs for filters, ranges, mutations, RPC, preferences, and type generation.

---

## Type Generation (CLI)

```bash
pnpm --filter @postgrestx/core exec postgrestx-generate --input openapi.json --out packages/core/src/types/generated
```

More usage & testing hooks in the documentation.

---

## License

MIT
