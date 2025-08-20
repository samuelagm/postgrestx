import { describe, expect, it } from 'vitest'
import { buildHeaders, buildQueryParams, parseContentRange } from '../src/postgrest/encode'

describe('encode helpers', () => {
  it('buildQueryParams covers filters, order array, pagination and write-specific', () => {
    const qs = buildQueryParams({
      select: 'id,name',
      filters: [
        { column: 'age', op: 'gte', value: 18 },
        { column: 'tags', op: 'cs', modifier: 'any', value: ['a', 'b'] },
        { column: 'labels', op: 'cs', modifier: 'all', value: ['a"b'] },
        { column: 'deleted_at', op: 'is', negated: true },
      ],
      order: ['id.asc', 'name.desc'],
      limit: 10,
      offset: 20,
      // write-specific
      columns: 'id,name',
      on_conflict: 'name',
    })

    expect(qs).toContain('select=id%2Cname')
    expect(qs).toContain('age=gte.18')
  expect(qs).toContain('tags=cs%28any%29.%28%22a%22%2C%22b%22%29')
  // escaped quote inside string value in array
  expect(qs).toContain('labels=cs%28all%29.%28%22a%5C%22b%22%29')
    expect(qs).toContain('deleted_at=not.is')
    expect(qs).toContain('order=id.asc%2Cname.desc')
    expect(qs).toContain('limit=10')
    expect(qs).toContain('offset=20')
    expect(qs).toContain('columns=id%2Cname')
    expect(qs).toContain('on_conflict=name')
  })

  it('buildHeaders covers range open-ended, count, prefer fields and merges additional headers', () => {
    const headers = buildHeaders({
      range: { from: 50, to: undefined as unknown as number },
      count: 'exact',
      prefer: {
        return: 'representation',
        resolution: 'merge-duplicates',
        missing: 'default',
        handling: 'strict',
        timezone: 'UTC',
        tx: 'commit',
        maxAffected: 100,
      },
      headers: { Accept: 'application/json' },
    })

  expect(headers['Range-Unit']).toBe('items')
  expect(headers.Range).toBe('50-')
  expect(headers.Prefer).toContain('count=exact')
  expect(headers.Prefer).toContain('return=representation')
  expect(headers.Prefer).toContain('resolution=merge-duplicates')
  expect(headers.Prefer).toContain('missing=default')
  expect(headers.Prefer).toContain('handling=strict')
  expect(headers.Prefer).toContain('timezone=UTC')
  expect(headers.Prefer).toContain('tx=commit')
  expect(headers.Prefer).toContain('max-affected=100')
  expect(headers.Accept).toBe('application/json')
  })

  it('buildHeaders covers range with explicit to number', () => {
    const headers = buildHeaders({ range: { from: 0, to: 10 } })
  expect(headers['Range-Unit']).toBe('items')
  expect(headers.Range).toBe('0-10')
  expect(headers.Prefer).toBeUndefined()
  })

  it('parseContentRange supports numeric totals, star totals, and invalid returns null', () => {
    expect(parseContentRange('items 0-24/357')).toEqual({ unit: 'items', from: 0, to: 24, total: 357 })
    expect(parseContentRange('items 0-9/*')).toEqual({ unit: 'items', from: 0, to: 9, total: null })
    expect(parseContentRange('bytes 0-1')).toBeNull()
    expect(parseContentRange(null)).toBeNull()
  })
})
