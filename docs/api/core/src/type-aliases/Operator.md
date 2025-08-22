[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / Operator

# Type Alias: Operator

> **Operator** = `"eq"` \| `"gt"` \| `"gte"` \| `"lt"` \| `"lte"` \| `"neq"` \| `"like"` \| `"ilike"` \| `"match"` \| `"imatch"` \| `"in"` \| `"is"` \| `"isdistinct"` \| `"fts"` \| `"plfts"` \| `"phfts"` \| `"wfts"` \| `"cs"` \| `"cd"` \| `"ov"` \| `"sl"` \| `"sr"` \| `"nxr"` \| `"nxl"` \| `"adj"` \| `"not"` \| `"or"` \| `"and"` \| `"any"` \| `"all"`

Defined in: [packages/core/src/postgrest/types.ts:15](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L15)

Core types for PostgREST client.

Use these to build advanced queries.

## Example

```ts
const filters: Filter[] = [
  { column: 'status', op: 'eq', value: 'active' },
  { column: 'age', op: 'gte', value: 18 },
]
```
