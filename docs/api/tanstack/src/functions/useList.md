[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useList

# Function: useList()

> **useList**\<`Table`\>(`tableName`, `args?`, `options?`): `UseQueryResult`\<[`ListResult`](../interfaces/ListResult.md)\<`Table`\>, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:197](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L197)

Fetch a list of rows with optional filtering, ordering and pagination hints.
Returns data plus `total` and `range` metadata when the server provides `Content-Range`.

## Type Parameters

### Table

`Table` = `unknown`

Row shape (defaults to unknown) – supply for strong typing.

## Parameters

### tableName

`string`

### args?

[`ListArgs`](../interfaces/ListArgs.md)

### options?

`UseQueryOptions`\<[`ListResult`](../interfaces/ListResult.md)\<`Table`\>, `unknown`, [`ListResult`](../interfaces/ListResult.md)\<`Table`\>, readonly `unknown`[]\>

## Returns

`UseQueryResult`\<[`ListResult`](../interfaces/ListResult.md)\<`Table`\>, `unknown`\>

## Examples

```ts
const query = useList<User>('users', { select: 'id,name', limit: 20 })
```

```ts
useList<User>('users', { profile: 'tenant_a', select: 'id,name' })
```
