import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import http from 'node:http'
import React from 'react'
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { PostgrestProvider, useInsert, useList, useUpdate, useDelete, useInfiniteList } from '../src'

function waitForReady(url: string, timeoutMs = 30000, intervalMs = 500): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.request(url, { method: 'GET' }, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          res.resume()
          resolve()
        } else {
          res.resume()
          if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ready: ${res.statusCode}`))
          else setTimeout(tryOnce, intervalMs)
        }
      })
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Timeout waiting for ready'))
        else setTimeout(tryOnce, intervalMs)
      })
      req.end()
    }
    tryOnce()
  })
}

function App() {
  const { data: listData } = useList<{ id: number; name: string }>('people', { select: 'id,name', order: 'id.asc' })
  const insert = useInsert<{ id: number; name: string; age: number }, { name: string; age: number }>('people')
  const update = useUpdate<{ id: number; name: string; age: number }, number, { age: number }>('people')
  const del = useDelete<number>('people')

  React.useEffect(() => {
    ; (async () => {
      const row = await insert.mutateAsync({ name: 'Eve', age: 31 })
      const id = (row as { id: number }).id
      await update.mutateAsync({ pk: id, patch: { age: 32 } })
      await del.mutateAsync({ pk: id })
    })()
  }, [])

  return React.createElement('div', null, listData ? `count:${listData.total ?? listData.data.length}` : 'loading')
}

describe('@postgrestx/tanstack e2e', () => {
  let httpBase = 'http://localhost'
  let adminBase = 'http://localhost'
  let haveEndpoints = false

  beforeAll(async () => {
    const envApi = process.env.PGX_API_URL
    const envAdmin = process.env.PGX_ADMIN_URL
    if (envApi && envAdmin) {
      httpBase = envApi
      adminBase = envAdmin
      await waitForReady(`${adminBase}/ready`)
      haveEndpoints = true
    }
  }, 120_000)

  afterAll(() => { })

  it('lists people and performs insert/update/delete mutations', async () => {
    if (!haveEndpoints) return
    const queryClient = new QueryClient()
    const { getByText } = render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(PostgrestProvider, { client: new PostgrestClient(httpBase, createFetchHttpClient()), children: React.createElement(App) })
      )
    )

    await waitFor(() => {
      expect(getByText(/count:/)).toBeTruthy()
    }, { timeout: 30_000 })
  })

  it('supports useInfiniteList pagination', async () => {
    if (!haveEndpoints) return
    function InfApp() {
      const q = useInfiniteList<{ id: number; name: string }>('people', { select: 'id,name', order: 'id.asc', pageSize: 2 })
      const [called, setCalled] = React.useState(false)
      React.useEffect(() => {
        if (q.isSuccess && !called) {
          setCalled(true)
          q.fetchNextPage()
        }
      }, [q.isSuccess, called])
      const pages = (q.data as InfiniteData<{ items: { id: number; name: string }[]; nextFrom?: number }> | undefined)?.pages ?? []
      const totalItems = pages.reduce((acc: number, p) => acc + p.items.length, 0)
      return React.createElement('div', null, q.isPending ? 'inf:loading' : `infCount:${totalItems}`)
    }

    const queryClient = new QueryClient()
    const { getByText } = render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(PostgrestProvider, { client: new PostgrestClient(httpBase, createFetchHttpClient()), children: React.createElement(InfApp) })
      )
    )

    // After fetching first page (2) and next page (1), we expect 3 items from seed
    await waitFor(() => {
      expect(getByText('infCount:3')).toBeTruthy()
    }, { timeout: 30_000 })
  })
})
