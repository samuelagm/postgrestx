import type { AnySpec } from './loadSpec'

export interface ColumnSpec {
  name: string
  type: string
  required: boolean
}

export interface TableSpec {
  name: string
  schema?: string
  columns: ColumnSpec[]
  primaryKey?: string | string[]
}

export interface RpcSpec {
  name: string
  args: Record<string, string>
  returns?: string
}

export interface Introspection {
  tables: TableSpec[]
  rpcs: RpcSpec[]
}

/**
 * Minimal introspection from a PostgREST OpenAPI spec.
 * Supports Swagger v2 (`definitions`) and OpenAPI v3 (`components.schemas`).
 */
export function introspectSpec(spec: AnySpec): Introspection {
  const schemas: Record<string, any> =
    spec.definitions ?? spec.components?.schemas ?? {}

  const tables: TableSpec[] = []
  const rpcs: RpcSpec[] = []

  for (const [name, def] of Object.entries(schemas)) {
    if (!def || typeof def !== 'object') continue

    const props: Record<string, any> = def.properties ?? {}
    const req: string[] = def.required ?? []

    // Heuristic: treat objects with properties as tables/views
    if (def.type === 'object' && Object.keys(props).length > 0) {
      const columns: ColumnSpec[] = Object.entries(props).map(([col, p]) => ({
        name: col,
        type: resolveType(p),
        required: req.includes(col),
      }))

      const pk = extractPrimaryKey(def)

      tables.push({ name, columns, primaryKey: pk })
      continue
    }

    // Heuristic for RPC: PostgREST may include function schemas; here we skip until
    // we have a reliable discriminator; left for future enhancement.
  }

  return { tables, rpcs }
}

function resolveType(p: any): string {
  if (!p) return 'unknown'
  if (p.$ref) return refName(p.$ref)
  if (p.type === 'array') return `${resolveType(p.items)}[]`
  if (p.format) {
    // Prefer native TS types; formats can be useful for operators later
    return mapPrimitive(p.type)
  }
  return mapPrimitive(p.type)
}

function refName(ref: string): string {
  const parts = ref.split('/')
  return parts[parts.length - 1]
}

function mapPrimitive(t: string | undefined): string {
  switch (t) {
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
    case 'object':
      return 'Record<string, any>'
    default:
      return 'any'
  }
}

function extractPrimaryKey(def: any): string | string[] | undefined {
  // PostgREST may expose vendor extensions; placeholder for future use.
  // For now, attempt to infer a conventional 'id' if marked required.
  const req: string[] = def.required ?? []
  if (req.includes('id')) return 'id'
  return undefined
}
