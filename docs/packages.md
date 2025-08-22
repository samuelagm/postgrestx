# Packages

## Core (`@postgrestx/core`)

Low-level PostgREST client: request construction, encoding, errors, metadata utilities.

## TanStack (`@postgrestx/tanstack`)

React integration layer providing hooks & context for TanStack Query.

| Hook              | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `useList`         | Paginated table reads                      |
| `useItem`         | Single row fetch                           |
| `useInfiniteList` | Infinite scrolling lists via Content-Range |
| `useInsert`       | Insert row(s)                              |
| `useUpdate`       | Update row(s)                              |
| `useDelete`       | Delete row(s)                              |
| `useUpsert`       | Upsert row(s)                              |
| `useRpc`          | Call PostgREST RPC function                |
