[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / createFetchHttpClient

# Function: createFetchHttpClient()

> **createFetchHttpClient**(`opts`): [`HttpClient`](../interfaces/HttpClient.md)

Defined in: [packages/core/src/postgrest/http.ts:49](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/http.ts#L49)

Create an [HttpClient](../interfaces/HttpClient.md) backed by the Fetch API.

Automatically JSON-stringifies non-string bodies and parses JSON responses
when the `Content-Type` header includes `application/json`.

## Parameters

### opts

[`FetchClientOptions`](../interfaces/FetchClientOptions.md) = `{}`

## Returns

[`HttpClient`](../interfaces/HttpClient.md)

## Examples

```ts
import { createFetchHttpClient } from '@postgrestx/core'
const http = createFetchHttpClient({})
const res = await http.request({ method: 'GET', url: 'https://api.test/users' })
console.log(res.status, res.data)
```

```ts
import fetch from 'cross-fetch'
const http = createFetchHttpClient({ fetch })
```
