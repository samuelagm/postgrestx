[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useUpdate

# Function: useUpdate()

> **useUpdate**\<`Updated`, `PK`, `Table`\>(`tableName`, `options?`): `UseMutationResult`\<`Updated`, `unknown`, \{ `pk`: `PK`; `patch`: `Partial`\<`Table`\>; `pkColumn?`: `string`; \}, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:299](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L299)

Update rows by primary key (single row convenience) using a patch object.

## Type Parameters

### Updated

`Updated` = `unknown`

### PK

`PK` _extends_ [`PrimaryKey`](../type-aliases/PrimaryKey.md) = [`PrimaryKey`](../type-aliases/PrimaryKey.md)

### Table

`Table` = `unknown`

## Parameters

### tableName

`string`

### options?

`UseMutationOptions`\<`Updated`, `unknown`, \{ `pk`: `PK`; `patch`: `Partial`\<`Table`\>; `pkColumn?`: `string`; \}, `unknown`\>

## Returns

`UseMutationResult`\<`Updated`, `unknown`, \{ `pk`: `PK`; `patch`: `Partial`\<`Table`\>; `pkColumn?`: `string`; \}, `unknown`\>

## Example

```ts
const updateUser = useUpdate<User>('users')
updateUser.mutate({ pk: 1, patch: { name: 'Grace' } })
```
