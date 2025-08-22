# Getting Started

## Install

```bash
pnpm add @postgrestx/core axios
# React usage
pnpm add @postgrestx/tanstack @tanstack/react-query react react-dom
```

## Basic Client (Fetch)

```ts
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'

const http = createFetchHttpClient()
const client = new PostgrestClient('https://example.com', http)
const users = await client.select('users', { select: '*' })
```

## Using Axios Instead of Fetch

If you already standardize on Axios (interceptors, retries, tracing), wrap it with the Axios adapter.

```ts
import axios from 'axios'
import { PostgrestClient } from '@postgrestx/core'
import { createAxiosHttpClient } from '@postgrestx/tanstack'

const axiosInstance = axios.create({ baseURL: 'https://example.com' })
// Optional interceptors
axiosInstance.interceptors.response.use(
  (r) => r,
  (err) => {
    // global logging / transform
    return Promise.reject(err)
  },
)

const http = createAxiosHttpClient(axiosInstance)
const client = new PostgrestClient('https://example.com', http)
const { data } = await client.select('users', { select: 'id,name' })
```

## JWT Auth Example

### 1. Fetch Client (in-memory token)

```ts
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'
// Simple in-memory token store (could be replaced by a context or reactive signal)
let accessToken: string | undefined
export function setAccessToken(token?: string) {
  accessToken = token
}
export function getAccessToken() {
  return accessToken
}

function authFetch() {
  return async (input: RequestInfo, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {})
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(input, { ...init, headers })
  }
}

const http = createFetchHttpClient({ fetch: authFetch() })
const client = new PostgrestClient(import.meta.env.VITE_API_URL, http)
```

### 2. Axios Client (in-memory token)

```ts
import axios from 'axios'
import { PostgrestClient } from '@postgrestx/core'
import { createAxiosHttpClient } from '@postgrestx/tanstack'

const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL })
axiosInstance.interceptors.request.use((cfg) => {
  const token = getAccessToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

const http = createAxiosHttpClient(axiosInstance)
const client = new PostgrestClient(import.meta.env.VITE_API_URL, http)
```

// For cookie auth omit Authorization header and enable credentials / CORS server-side.

## React + TanStack

```tsx
import { PostgrestProvider } from '@postgrestx/tanstack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function App({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PostgrestProvider value={{ client }}>{children}</PostgrestProvider>
    </QueryClientProvider>
  )
}
```

## Hooks Example

```tsx
import { useList, pgKey } from '@postgrestx/tanstack'

function Users() {
  const usersQuery = useList('users', {
    select: 'id,name',
    filters: [{ column: 'status', op: 'eq', value: 'active' }],
  })
  if (usersQuery.isLoading) return <p>Loading...</p>
  return (
    <ul>
      {usersQuery.data?.data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}
```
