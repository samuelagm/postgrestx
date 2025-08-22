[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useDelete

# Function: useDelete()

> **useDelete**\<`PK`\>(`tableName`, `options?`): `UseMutationResult`\<`void`, `unknown`, \{ `pk`: `PK`; `pkColumn?`: `string`; \}, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:323](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L323)

Delete a single row by primary key.

## Type Parameters

### PK

`PK` _extends_ [`PrimaryKey`](../type-aliases/PrimaryKey.md) = [`PrimaryKey`](../type-aliases/PrimaryKey.md)

## Parameters

### tableName

`string`

### options?

`UseMutationOptions`\<`void`, `unknown`, \{ `pk`: `PK`; `pkColumn?`: `string`; \}, `unknown`\>

## Returns

`UseMutationResult`\<`void`, `unknown`, \{ `pk`: `PK`; `pkColumn?`: `string`; \}, `unknown`\>

## Example

```ts
const del = useDelete('users')
del.mutate({ pk: 3 })
```
