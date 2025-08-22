[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / invalidateTable

# Function: invalidateTable()

> **invalidateTable**(`queryClient`, `tableName`): `Promise`\<`void`\>

Defined in: [packages/tanstack/src/index.ts:152](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L152)

Invalidate every query for a given table (all variants of args).

Call after mutations to keep cached data fresh.

## Parameters

### queryClient

`QueryClient`

### tableName

`string`

## Returns

`Promise`\<`void`\>

## Example

```ts
await mutateAsync(newRow)
invalidateTable(queryClient, 'users')
```
