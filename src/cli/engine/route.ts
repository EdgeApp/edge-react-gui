/**
 * A single API call: one typed function, its cleaners, and the prose above it.
 *
 * The JSDoc comment on each `route(…)` call is the documentation source. The
 * `query` / `body` cleaners validate the request *and* describe it — the
 * documented shape is the enforced shape, so the two cannot disagree. The
 * `returns` cleaner does the same for the response.
 *
 * `scripts/buildApiDocs.ts` reads these declarations with the TypeScript
 * compiler API: the resolved cleaner types render the request and response
 * shapes, and the JSDoc supplies the prose.
 */
import type { Cleaner } from 'cleaners'

import { engineError } from './errors'
import { requireBodyObject, type RouteContext, type Router } from './router'

export type HttpMethod = 'GET' | 'POST'

/** How a CLI flag differs from the field it carries. */
export interface CliFlagSpec {
  /** Request field this flag supplies, when the names differ. */
  maps?: string
  /** Repeatable; collected into an array. */
  repeat?: boolean
  /** Sends the inverse of the named boolean field. */
  invert?: boolean
  doc?: string
}

/** A flag with no request counterpart — purely client-side behaviour. */
export interface CliExtraSpec {
  kind: 'string' | 'boolean' | 'boolstr' | 'repeat'
  required?: boolean
  /** Required whenever this request field is present. */
  requiredWith?: string
  doc?: string
}

export interface CliSpec {
  command: string
  /** Request field taken as the bare positional argument. */
  positional?: string
  /** Overrides for flags whose name is not the kebab-cased field name. */
  flags?: Record<string, CliFlagSpec>
  /** Client-only flags. */
  extra?: Record<string, CliExtraSpec>
  /** Fields sent at fixed values, for commands that preset part of a body. */
  preset?: Record<string, unknown>
  /** Flag carrying the entire body as one JSON argument. */
  bodyFlag?: string
  /** Exit codes for a streaming command. */
  exits?: Record<string, number>
  /** Behaviour the request shape cannot express. */
  notes?: string
  /**
   * Hand-written because the command does something the request shape cannot
   * describe — writing files, storing a session, holding a stream open.
   * Everything else is generated from this spec.
   */
  custom?: boolean
}

export interface StreamSpec {
  scope: 'context' | 'session' | 'wallet'
  /** Event type names this stream can emit. */
  frames: string[]
}

export interface RouteSpec<Q = unknown, B = unknown, R = unknown> {
  /** The `edge-core-js` call this fronts, or null with a `coreNote`. */
  core: string | null
  coreNote?: string
  method: HttpMethod
  path: string
  /** Command name, a spec, or several when one route backs more than one. */
  cli?: string | CliSpec | CliSpec[] | null
  query?: Cleaner<Q>
  body?: Cleaner<B>
  /** Response shape. Omit for a `204`. */
  returns?: Cleaner<R>
  /** Codes raised indirectly; directly-thrown ones are read from the handler. */
  errors?: string[]
  /** Set when the stream is served outside the router. */
  stream?: StreamSpec
  handler: (ctx: TypedContext<Q, B>) => Promise<unknown> | unknown
}

/** A `RouteContext` whose query and body have been through their cleaners. */
export interface TypedContext<Q, B> extends Omit<RouteContext, 'body'> {
  query: URLSearchParams & { valid: Q }
  body: B
}

const registry: Array<RouteSpec<any, any, any>> = []

export function route<Q, B, R>(spec: RouteSpec<Q, B, R>): RouteSpec<Q, B, R> {
  registry.push(spec)
  return spec
}

export function allRoutes(): Array<RouteSpec<any, any, any>> {
  return registry
}

/** Turn a cleaner failure into a `400` instead of a `500`. */
function clean<T>(cleaner: Cleaner<T>, raw: unknown, what: string): T {
  try {
    return cleaner(raw)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw engineError('BAD_REQUEST', `Invalid ${what}: ${message}`, 400)
  }
}

/** Query strings are all strings; coerce to what the cleaner expects. */
function queryToObject(query: URLSearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of query.entries()) {
    if (value === '') continue
    out[key] = value
  }
  return out
}

export function registerRoute(
  router: Router,
  spec: RouteSpec<any, any, any>
): void {
  if (spec.stream != null) return // served directly by the HTTP handler
  router.add(spec.method, spec.path, async ctx => {
    if (spec.query != null) {
      const parsed = clean(spec.query, queryToObject(ctx.query), 'query')
      ;(ctx.query as any).valid = parsed
    }
    if (spec.body != null) {
      const raw = spec.method === 'GET' ? {} : requireBodyObject(ctx.body)
      ctx.body = clean(spec.body, raw, 'body')
    }
    return await spec.handler(ctx as any)
  })
}
