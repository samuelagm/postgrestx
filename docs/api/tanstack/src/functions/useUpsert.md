[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useUpsert

# Function: useUpsert()

> **useUpsert**\<`Upserted`, `UpsertInput`\>(`tableName`, `options?`): `UseMutationResult`\<`Upserted`, `unknown`, `UpsertInput`, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:341](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L341)

Upsert (insert or merge) row(s) as a mutation.
Useful for idempotent create/update flows.

## Type Parameters

### Upserted

`Upserted` = `unknown`

### UpsertInput

`UpsertInput` = `unknown`

## Parameters

### tableName

`string`

### options?

`UseMutationOptions`\<`Upserted`, `unknown`, `UpsertInput`, `unknown`\>

## Returns

`UseMutationResult`\<`Upserted`, `unknown`, `UpsertInput`, `unknown`\>
