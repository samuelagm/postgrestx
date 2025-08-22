# PostgRESTX <img src="docs/public/favicon.svg" alt="PostgRESTX Icon" height="32" align="top" />

[![CI](https://github.com/samuelagm/postgrestx/actions/workflows/ci.yml/badge.svg)](https://github.com/samuelagm/postgrestx/actions/workflows/ci.yml) [![License](https://img.shields.io/github/license/samuelagm/postgrestx?style=flat-square)](https://github.com/samuelagm/postgrestx/blob/master/LICENSE) [![Core npm](https://img.shields.io/npm/v/@postgrestx/core?style=flat-square)](https://www.npmjs.com/package/@postgrestx/core) [![TanStack npm](https://img.shields.io/npm/v/@postgrestx/tanstack?style=flat-square)](https://www.npmjs.com/package/@postgrestx/tanstack) [![Docs](https://img.shields.io/badge/docs-vitepress-blue?style=flat-square)](https://samuelagm.github.io/postgrestx/)

TypeScript SDK & React adapters for PostgREST.

👉 **Full documentation & guides:** https://samuelagm.github.io/postgrestx/

---

## Packages

| Package                | Description                            | Docs                                                                                                                                   |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `@postgrestx/core`     | Framework‑agnostic PostgREST client    | [Core Guide](https://samuelagm.github.io/postgrestx/core) / [API](https://samuelagm.github.io/postgrestx/api/core/src/README)          |
| `@postgrestx/tanstack` | React + TanStack Query hooks & helpers | [React Guide](https://samuelagm.github.io/postgrestx/tanstack) / [API](https://samuelagm.github.io/postgrestx/api/tanstack/src/README) |

---

## Install (snippet)

```bash
pnpm add @postgrestx/core
# React usage
pnpm add @postgrestx/tanstack @tanstack/react-query react react-dom
```

## Quick Example

```ts
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'
const client = new PostgrestClient(
  'https://example.com',
  createFetchHttpClient(),
)
await client.select('users', { select: 'id,name', limit: 10 })
```

For React hooks (`useList`, `useItem`, mutations, infinite queries) see the React guide.

---

## Contributing

PRs welcome. Please see the docs for architecture notes. Run tests with:

```bash
pnpm -w test
```

---

## License

MIT © Contributors — see [LICENSE](./LICENSE)
