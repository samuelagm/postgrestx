[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useItem

# Function: useItem()

> **useItem**\<`Table`\>(`tableName`, `pk`, `args?`, `options?`): `UseQueryResult`\<`NoInfer`\<`null` \| `Table`\>, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:245](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L245)

Fetch a single row by primary key.

Internally performs a SELECT with `limit: 1` and returns `null` if no row found.
The primary key column defaults to `id` but can be overridden with `pkColumn`.
Additional filters can be merged (e.g. tenant scoping) – they are appended after the pk filter.

## Type Parameters

### Table

`Table` = `unknown`

Row shape.

## Parameters

### tableName

`string`

### pk

[`PrimaryKey`](../type-aliases/PrimaryKey.md)

### args?

`object` & `Pick`\<[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md), `"filters"`\>

### options?

`UseQueryOptions`\<`null` \| `Table`, `unknown`, `null` \| `Table`, readonly `unknown`[]\>

## Returns

`UseQueryResult`\<`NoInfer`\<`null` \| `Table`\>, `unknown`\>

## Examples

```ts
const user = useItem<User>('users', 42)
```

```ts
useItem<User>('users', '1b2c', { pkColumn: 'uuid', select: 'uuid,name' })
```

```ts
useItem<User>('users', 42, {
  filters: [{ column: 'tenant_id', op: 'eq', value: currentTenant }],
})
```

```ts
interface User {
  id: number
  name: string
}
const q = useItem<User>('users', 1)
q.data?.name // typed as string | undefined
```
