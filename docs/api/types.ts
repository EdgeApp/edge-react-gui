/**
 * The shape of one documented API call.
 *
 * One `Endpoint` describes a single engine route *and* the `edge-cli`
 * command(s) that drive it, so the CLI and REST forms can never drift apart in
 * the docs: they are the same record. `scripts/verifyApiDocs.ts` diffs these
 * records against `src/cli/engine/routes/` and `src/cli/commands/`.
 */
import type { Schema } from './schema'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Where a CLI flag lands in the HTTP request. */
export type FlagTarget = 'query' | 'body' | 'path' | 'client'

export interface CliFlag {
  /** The flag as typed, e.g. `--token-id=<id>`. */
  flag: string
  /** The REST parameter or body field it becomes. */
  maps: string
  target: FlagTarget
  doc?: string
}

export interface CliBinding {
  /** Command name as registered in `src/cli/commands/`. */
  command: string
  usage: string
  /** What this command does, when it differs from the endpoint summary. */
  summary?: string
  flags?: CliFlag[]
  example?: string
  /** Client-side behavior with no REST equivalent (file writes, polling, …). */
  notes?: string
}

export interface QueryParam {
  name: string
  schema: Schema
  required?: boolean
  /** Engine default when the parameter is omitted. Verified against the code. */
  default?: string
  doc?: string
}

export interface PathParam {
  name: string
  schema: Schema
  doc?: string
}

export interface SuccessResponse {
  status: 200 | 204
  schema?: Schema
  doc?: string
}

export interface Endpoint {
  /** Stable anchor id, also the OpenAPI operationId. */
  id: string
  /**
   * The `edge-core-js` call this route fronts, e.g. `context.forgetAccount`.
   * `null` means there is none — engine lifecycle, or GUI code the CLI reuses
   * — and `coreNote` must then say what it is instead.
   */
  coreCall: string | null
  /** Why `coreCall` is null, or how a composite maps onto several core calls. */
  coreNote?: string
  summary: string
  description?: string
  method: HttpMethod
  path: string
  /** Implementing file, relative to the repo root. */
  source: string
  /**
   * CLI commands that call this route. An empty array means REST-only, and the
   * drift checker asserts that no command actually hits the route.
   */
  cli: CliBinding[]
  pathParams?: PathParam[]
  query?: QueryParam[]
  body?: Schema
  bodyDoc?: string
  success: SuccessResponse
  /** Error codes beyond the always-possible ones for this path shape. */
  errors?: string[]
  /** Anything a caller would get wrong from the schema alone. */
  notes?: string[]
}

export interface EndpointGroup {
  /** Section title in the rendered docs. */
  title: string
  /** Anchor / OpenAPI tag. */
  id: string
  doc?: string
  endpoints: Endpoint[]
}

export function endpoint(e: Endpoint): Endpoint {
  return e
}

export function group(g: EndpointGroup): EndpointGroup {
  return g
}
