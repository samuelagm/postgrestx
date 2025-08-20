import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { PostgrestProvider } from '../src'
import { usePostgrestClient } from '../src/context'
import type { PostgrestClient, QueryResult } from '@postgrestx/core'

function makeClient(): PostgrestClient {
    const baseUrl = 'http://example'
    const http = { request: async () => ({ status: 200, headers: {}, data: [] }) }
    const dummy = async <T,>(): Promise<QueryResult<T>> => ({ data: undefined as unknown as T, total: null, range: null, status: 200 })
    return {
        baseUrl,
        http,
        select: dummy,
        insert: dummy,
        update: dummy,
        upsert: dummy,
        delete: dummy,
        rpc: dummy,
    } as unknown as PostgrestClient
}

describe('context', () => {
    it('provides client via PostgrestProvider', () => {
        const client = makeClient()
        function Child() {
            const c = usePostgrestClient()
            return React.createElement('div', null, c.baseUrl)
        }
        const { getByText } = render(
            React.createElement(PostgrestProvider, { client, children: React.createElement(Child) })
        )
        expect(getByText('http://example')).toBeTruthy()
    })

    it('throws without provider', () => {
        function Child() {
            usePostgrestClient()
            return React.createElement('div')
        }
        expect(() => render(React.createElement(Child))).toThrow('PostgrestProvider is missing')
    })
})
