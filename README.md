# PostgRESTX — TypeScript SDK & React adapters for PostgREST

[![CI](https://github.com/samuelagm/postgrestx/actions/workflows/ci.yml/badge.svg)](https://github.com/samuelagm/postgrestx/actions/workflows/ci.yml)

PostgRESTX provides a TypeScript-first SDK to interact with PostgREST servers, plus React utilities that integrate PostgREST with TanStack Query (React Query v5).


Why this project exists

- Make PostgREST easier to consume from modern TypeScript applications.
- Provide strongly-typed request helpers, encoding/decoding and consistent error handling.
- Offer React hooks and providers which wire PostgREST semantics into TanStack Query's caching and pagination features.


Key features

- TypeScript-first client and helpers for building PostgREST requests.
- React hooks: `useList`, `useItem`, `useInfiniteList`, `useInsert`, `useUpdate`, `useDelete`, `useUpsert`, `useRpc`.
- Infinite list pagination using Content-Range headers.
- Cache keys and invalidation helpers for TanStack Query (`pgKey`, `invalidateTable`, `invalidateRpc`).
- SSR-friendly keys and serialisable cache data.

Packages in this workspace

- `packages/core` — Framework-agnostic PostgREST client and low-level HTTP helpers.
- `packages/tanstack-query` — React + TanStack Query integration: providers, hooks and helpers.


Quickstart (developer)

1. Install dependencies (requires pnpm):

```bash
pnpm install
```

2. Run tests (Vitest):

```bash
pnpm -w test
```

3. Build packages (tsup):

```bash
pnpm -w build
```

How to use the React adapter (short)

1. Create a `PostgrestClient` from `@postgrestx/core` and an HTTP implementation (e.g. `createFetchHttpClient`).
2. Wrap your app with TanStack's `QueryClientProvider` and `PostgrestProvider` from `@postgrestx/tanstack-query`.

See `packages/tanstack-query/README.md` for full examples and the available hooks.

Development notes & conventions

- Package manager: pnpm (workspaces enabled).
- Build tool: tsup per-package.
- Tests: Vitest with configs in each package.
- Linting: ESLint with TypeScript rules.

Contributing

- Open issues or PRs for bugs and feature requests.
- Keep PRs small and add tests for behavior changes.
- Consider adding or updating package READMEs with practical examples.

License

- MIT — see [LICENSE](./LICENSE).