/**
 * Encoding helpers for PostgREST URL & headers
 */

import type { Filter, FilterValue, PreferenceOptions, QueryOptions, WriteOptions } from './types'

function encodeValue(v: FilterValue): string {
  if (Array.isArray(v)) {
    const inner = v
      .map((x) => (typeof x === 'string' ? `"${x.replace(/"/g, '\\"')}"` : String(x)))
      .join(',')
    return `(${inner})`
  }
  return typeof v === 'string' ? v : String(v)
}

function encodeFilter(f: Filter): [key: string, value: string] {
  const baseOp = f.op
  const op = f.modifier && ['any', 'all'].includes(f.modifier) ? `${baseOp}(${f.modifier})` : baseOp
  const prefix = f.negated ? 'not.' : ''
  const key = f.column
  const value = f.value === undefined ? `${prefix}${op}` : `${prefix}${op}.${encodeValue(f.value)}`
  return [key, value]
}

export function buildQueryParams(opts: QueryOptions | WriteOptions | undefined): string {
  if (!opts) return ''
  const params = new URLSearchParams()
  if (opts.select) params.set('select', opts.select)
  if (opts.filters) {
    for (const f of opts.filters) {
      const [k, v] = encodeFilter(f)
      params.append(k, v)
    }
  }
  if (opts.order) params.set('order', Array.isArray(opts.order) ? opts.order.join(',') : opts.order)
  if (typeof opts.limit === 'number') params.set('limit', String(opts.limit))
  if (typeof opts.offset === 'number') params.set('offset', String(opts.offset))
  // Write-specific
  const w = opts as WriteOptions
  if (w.columns) params.set('columns', w.columns)
  if (w.on_conflict) params.set('on_conflict', w.on_conflict)
  return params.toString()
}

export function buildHeaders(opts: QueryOptions | WriteOptions | undefined): Record<string, string> {
  const headers: Record<string, string> = {}
  // Range-based pagination
  if (opts?.range) {
  headers['Range-Unit'] = 'items'
    const { from, to } = opts.range
  headers.Range = typeof to === 'number' ? `${from}-${to}` : `${from}-`
  }
  // Prefer header assembly
  const preferParts: string[] = []
  if (opts?.count) preferParts.push(`count=${opts.count}`)
  const prefer = opts?.prefer
  if (prefer) preferParts.push(...encodePrefer(prefer))
  if (preferParts.length) headers.Prefer = preferParts.join(', ')
  // Merge additional headers
  if (opts?.headers) Object.assign(headers, opts.headers)
  return headers
}

export function parseContentRange(value: string | null): { from: number; to: number | null; total: number | null; unit: string } | null {
  if (!value) return null
  // Format: items 0-24/357
  const m = /^(\w+)\s+(\d+)-(\d+)\/(\*|\d+)$/.exec(value)
  if (!m) return null
  const unit = m[1]
  const from = Number(m[2])
  const to = Number(m[3])
  const total = m[4] === '*' ? null : Number(m[4])
  return { unit, from, to, total }
}

function encodePrefer(p: PreferenceOptions): string[] {
  const parts: string[] = []
  if (p.return) parts.push(`return=${p.return}`)
  if (p.resolution) parts.push(`resolution=${p.resolution}`)
  if (p.missing) parts.push(`missing=${p.missing}`)
  if (p.count) parts.push(`count=${p.count}`)
  if (p.handling) parts.push(`handling=${p.handling}`)
  if (p.timezone) parts.push(`timezone=${p.timezone}`)
  if (p.tx) parts.push(`tx=${p.tx}`)
  if (typeof p.maxAffected === 'number') parts.push(`max-affected=${p.maxAffected}`)
  return parts
}
