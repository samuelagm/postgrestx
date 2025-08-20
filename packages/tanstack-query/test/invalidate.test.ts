import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { invalidateRpc, invalidateTable, pgKey } from '../src'

describe('invalidate helpers', () => {
    it('invalidateTable and invalidateRpc call QueryClient.invalidateQueries with the right keys', async () => {
        const qc = new QueryClient()
        const spy = vi.spyOn(qc, 'invalidateQueries').mockResolvedValue(undefined)

        await invalidateTable(qc, 'people')
        await invalidateRpc(qc, 'add_them')

        expect(spy).toHaveBeenCalledWith({ queryKey: pgKey.table('people') })
        expect(spy).toHaveBeenCalledWith({ queryKey: pgKey.rpc('add_them') })
    })
})
