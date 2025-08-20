import { describe, expect, it } from 'vitest'
import { pgKey, stableStringify } from '../src/keys'

describe('keys', () => {
    it('stableStringify sorts keys and preserves arrays', () => {
        expect(stableStringify({ b: 2, a: 1 })).toBe('{"a":1,"b":2}')
        expect(stableStringify([3, 1, 2])).toBe('[3,1,2]')
    })

    it('pgKey.table and pgKey.rpc produce stable keys with/without params', () => {
        const k1 = pgKey.table('people')
        const k2 = pgKey.table('people', undefined)
        expect(k1).toEqual(k2)

        const r1 = pgKey.rpc('fn', { b: 2, a: 1 }, { z: 3, y: 2 })
        const r2 = pgKey.rpc('fn', { a: 1, b: 2 }, { y: 2, z: 3 })
        expect(r1).toEqual(r2)
    })
})
