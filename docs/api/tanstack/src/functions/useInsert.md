[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useInsert

# Function: useInsert()

> **useInsert**\<`Inserted`, `InsertInput`\>(`tableName`, `options?`): `UseMutationResult`\<`Inserted`, `unknown`, `InsertInput`, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:279](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L279)

Insert row(s) into a table as a mutation hook.

## Type Parameters

### Inserted

`Inserted` = `unknown`

### InsertInput

`InsertInput` = `unknown`

## Parameters

### tableName

`string`

### options?

`UseMutationOptions`\<`Inserted`, `unknown`, `InsertInput`, `unknown`\>

## Returns

`UseMutationResult`\<`Inserted`, `unknown`, `InsertInput`, `unknown`\>

## Example

```ts
const insertUser = useInsert<User, NewUser>('users', {
  onSuccess: () => invalidateTable(qc, 'users'),
})
insertUser.mutate({ name: 'Ada' })
```
