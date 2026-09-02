/**
 * A tiny structural schema DSL.
 *
 * This is the single source of truth for every request and response shape in
 * the Edge CLI API docs. It exists because the engine returns plain objects
 * assembled from edge-core-js types rather than `cleaners`-validated values,
 * so there was no existing runtime schema to point the documentation at.
 *
 * The node shape is deliberately close to JSON Schema so `toJsonSchema` stays
 * trivial, and close enough to a `cleaners` shape that `asSchema()` (a runtime
 * validator used to assert real engine responses in tests) can be added later
 * without touching any endpoint definition.
 */

export type Schema =
  | { kind: 'string'; enum?: string[]; format?: string; example?: string }
  | { kind: 'number'; integer?: boolean; example?: number }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'unknown'; note?: string }
  | { kind: 'array'; items: Schema }
  | { kind: 'object'; fields: Field[]; open?: boolean }
  | { kind: 'map'; values: Schema }
  | { kind: 'ref'; name: string }
  | { kind: 'union'; of: Schema[] }
  /** A core type passed straight through by the engine, documented by name. */
  | { kind: 'core'; name: string; note?: string }

export interface Field {
  name: string
  schema: Schema
  optional?: boolean
  nullable?: boolean
  doc?: string
}

/** A named schema that endpoints `$ref` instead of repeating. */
export interface NamedSchema {
  name: string
  doc: string
  schema: Schema
  /** Where the engine builds this shape, for the drift checker and readers. */
  source?: string
}

export const s = {
  string(
    opts: { enum?: string[]; format?: string; example?: string } = {}
  ): Schema {
    return { kind: 'string', ...opts }
  },
  number(opts: { integer?: boolean; example?: number } = {}): Schema {
    return { kind: 'number', ...opts }
  },
  int(example?: number): Schema {
    return { kind: 'number', integer: true, example }
  },
  boolean(): Schema {
    return { kind: 'boolean' }
  },
  null(): Schema {
    return { kind: 'null' }
  },
  unknown(note?: string): Schema {
    return { kind: 'unknown', note }
  },
  array(items: Schema): Schema {
    return { kind: 'array', items }
  },
  object(fields: Field[], opts: { open?: boolean } = {}): Schema {
    return { kind: 'object', fields, ...opts }
  },
  map(values: Schema): Schema {
    return { kind: 'map', values }
  },
  ref(name: string): Schema {
    return { kind: 'ref', name }
  },
  union(...of: Schema[]): Schema {
    return { kind: 'union', of }
  },
  core(name: string, note?: string): Schema {
    return { kind: 'core', name, note }
  },
  /** ISO-8601 date-time string, how the engine serializes every `Date`. */
  date(): Schema {
    return { kind: 'string', format: 'date-time' }
  },
  /** A decimal amount string. The engine never emits float amounts. */
  amount(example?: string): Schema {
    return { kind: 'string', example }
  },
  /** `EdgeTokenId`: a token contract id, or `null` for the native asset. */
  tokenId(): Schema {
    return { kind: 'union', of: [{ kind: 'string' }, { kind: 'null' }] }
  }
}

/** Field builders. */
export function f(name: string, schema: Schema, doc?: string): Field {
  return { name, schema, doc }
}
export function opt(name: string, schema: Schema, doc?: string): Field {
  return { name, schema, optional: true, doc }
}
export function nul(name: string, schema: Schema, doc?: string): Field {
  return { name, schema, nullable: true, doc }
}
export function optNul(name: string, schema: Schema, doc?: string): Field {
  return { name, schema, optional: true, nullable: true, doc }
}
