import { describe, expect, it } from 'vitest'
import { buildHeaders, buildQueryParams } from '../src/postgrest/encode'

describe('encode additional branches', () => {
    it('buildQueryParams encodes scalar string values', () => {
        const qs = buildQueryParams({
            filters: [{ column: 'name', op: 'eq', value: 'John' }],
        })
        expect(qs).toContain('name=eq.John')
    })

    it('buildHeaders encodes Prefer count option from prefer object', () => {
        const headers = buildHeaders({ prefer: { count: 'planned' } })
        expect(headers.Prefer).toContain('count=planned')
    })

    it('buildQueryParams accepts order as string', () => {
        const qs = buildQueryParams({ order: 'id.desc' })
        expect(qs).toContain('order=id.desc')
    })

    it('buildQueryParams encodes numeric array values without quotes', () => {
        const qs = buildQueryParams({ filters: [{ column: 'ids', op: 'in', value: [1, 2, 3] }] })
        expect(qs).toContain('ids=in.%281%2C2%2C3%29')
    })

    it('buildQueryParams returns empty string when opts undefined', () => {
        const qs = buildQueryParams(undefined as unknown as undefined)
        expect(qs).toBe('')
    })

    it('buildHeaders returns empty object when opts undefined', () => {
        const headers = buildHeaders(undefined as unknown as undefined)
        expect(Object.keys(headers).length).toBe(0)
    })
})
