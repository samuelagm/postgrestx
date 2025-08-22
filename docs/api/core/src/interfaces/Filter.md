[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / Filter

# Interface: Filter

Defined in: [packages/core/src/postgrest/types.ts:50](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L50)

## Properties

### column

> **column**: `string`

Defined in: [packages/core/src/postgrest/types.ts:51](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L51)

---

### op

> **op**: [`Operator`](../type-aliases/Operator.md)

Defined in: [packages/core/src/postgrest/types.ts:52](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L52)

---

### value?

> `optional` **value**: [`FilterValue`](../type-aliases/FilterValue.md)

Defined in: [packages/core/src/postgrest/types.ts:53](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L53)

---

### modifier?

> `optional` **modifier**: `"any"` \| `"all"`

Defined in: [packages/core/src/postgrest/types.ts:55](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L55)

eq(any) / like(all)

---

### negated?

> `optional` **negated**: `boolean`

Defined in: [packages/core/src/postgrest/types.ts:57](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L57)

prefix filter with not.
