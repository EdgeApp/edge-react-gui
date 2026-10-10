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

import { engineError, errorMessage } from './errors'
import { requireBodyObject, type RouteContext, type Router } from './router'

type HttpMethod = 'GET' | 'POST'

/** How a CLI flag differs from the field it carries. */
export interface CliFlagSpec {
  /** Request field this flag supplies, when the names differ. */
  maps?: string
  /** Repeatable; collected into an array. */
  repeat?: boolean
  /**
   * What the value looks like on the command line, when the field's type
   * does not say.
   *
   * `valueForm` derives the placeholder from the cleaner, and for a
   * structured field that is `'<json>'`. A `custom: true` command may parse
   * the same field some other way: `change-enabled-token-ids` takes
   * `asArray(asRequestTokenId)` and the hand-written command splits the raw
   * value on commas, so the reference published `--token-ids='<json>'` while
   * the documented spelling came back `404 TOKEN_NOT_FOUND Unknown token:
   * ["…"]` — the program's own `UsageError` printed the real form.
   */
  valueForm?: string
  /**
   * Whether the *command* requires it, when that differs from the route.
   *
   * `usageFor` and the parameter table both read optionality from the
   * request field, which is right for a generated command — its parser is
   * built from the same declaration. A `custom: true` command can differ:
   * `create-account` publishes all three credentials as optional, because
   * over REST omitting them creates a light account, while the hand-written
   * command refuses `create-account` with no `--password` and no `--pin`. So
   * three surfaces disagreed — the reference bracketed them, the parameter
   * table said `optional: true`, and the command's own refusal printed them
   * unbracketed. This overrides the published CLI form only; the REST schema
   * is untouched.
   */
  cliRequired?: boolean
  doc?: string
}

/** A flag with no request counterpart — purely client-side behaviour. */
interface CliExtraSpec {
  kind: 'string' | 'boolean' | 'boolstr' | 'repeat'
  required?: boolean
  /** Required whenever this request field is present. */
  requiredWith?: string
  doc?: string
}

export interface CliSpec {
  command: string
  /**
   * Request field taken as the bare positional argument.
   *
   * A positional also decides the REST path: it becomes the final path
   * segment, so `<objectId>` on the command line and `{objectId}` in the URL
   * are the same value declared once. `routePath` derives that, which is why
   * `path` must not spell the parameter out itself.
   *
   * Only base58 identifiers qualify. A value that can contain `/`, `?` or `#`
   * — a base64 wallet id, a free-text username — cannot be a path segment
   * without percent-encoding that callers forget, so it travels as a named
   * argument in the query or the body instead.
   */
  positional?: string
  /** Overrides for flags whose name is not the kebab-cased field name. */
  flags?: Record<string, CliFlagSpec>
  /** Client-only flags. */
  extra?: Record<string, CliExtraSpec>
  /**
   * Fields sent at fixed values, for commands that preset part of a body.
   *
   * Booleans only, because that is all the pipeline carries:
   * `extractRoutes` reads the literal and keeps an entry only when its text
   * is `true` or `false`, and `asCommandSpec` cleans the persisted field as
   * `asObject(asBoolean)`. Declared as `unknown` this invited
   * `preset: { kind: 'swap' }`, which type-checks, passes all five
   * documentation gates and emits a command that sends no preset at all.
   */
  preset?: Record<string, boolean>
  /** Exit codes for a streaming command. */
  exits?: Record<string, number>
  /** Behaviour the request shape cannot express. */
  notes?: string
  /**
   * The whole usage line, for a `custom: true` command whose grammar the
   * field list cannot express.
   *
   * `usageFor` assembles one argument per field, which assumes every field
   * is passed alongside every other. `change-wallet-states` has two
   * mutually exclusive forms — a single wallet by flags, or the whole
   * `walletStates` map as JSON — and the assembled line read as "pass
   * `--wallet-states` *and* `--wallet-id`", which the command refuses in so
   * many words. `customUsage.test.ts` holds this against the flags the
   * hand-written command actually parses.
   */
  usage?: string
  /**
   * This binding's own one-line summary.
   *
   * Two commands on one route otherwise share the route's JSDoc first line,
   * so `spend` and `spend-max` were both published as "Send funds."
   */
  summary?: string
  /**
   * Hand-written because the command does something the request shape cannot
   * describe — writing files, storing a session, holding a stream open.
   * Everything else is generated from this spec.
   */
  custom?: boolean
}

/**
 * A route that holds a stream open rather than answering once.
 *
 * `extractRoutes` records only *whether* `stream` is present, and its one
 * consumer is `buildCliCommands`, which skips the route. The reference's
 * "Event stream" heading is not derived from it at all: it is the
 * hand-written group in `docs/api/groups.ts`, so a second stream route needs
 * an entry added there or it publishes unmarked. Either way the fields below
 * reach no generated output. The frame list a reader
 * sees is the `@note` on the route's own JSDoc, which is also where the
 * scoping rules are written, because the scope comes from the query string
 * and so cannot be a constant here.
 *
 * Declared all the same, because the shape is part of the declaration format
 * and an empty marker would read as an oversight. A field that described the
 * stream would be worse than none: it would look like it reached the
 * reference, and the scope it stated would go stale the first time the route
 * read the query string differently.
 */
export interface StreamSpec {
  /** Present to mark the route as a stream; nothing reads the value. */
  marker: true
}

export interface RouteSpec<Q = unknown, B = unknown, R = unknown> {
  /** The `edge-core-js` call this fronts, or null with a `coreNote`. */
  core: string | null
  coreNote?: string
  /**
   * Request fields the core call has no parameter for, and why.
   *
   * The API is core's signature in another representation, so a field core
   * does not know about is either a deliberate convenience or a mistake.
   * Writing the reason is what tells the two apart: `currency-wallets` once
   * carried a `waitForAll` that core has no parameter for — waiting is a
   * separate method — and nothing caught it.
   *
   * `checkCoreAlignment` resolves the real signature and fails on a
   * difference that is not listed here, or a listing that is no longer true.
   */
  coreExtra?: Record<string, string>
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

/**
 * Declare a route, and register it.
 *
 * The registration is this call's side effect, and dispatch reads
 * `allRoutes()`, so nothing needs the declaration's name: a route works
 * whether or not its `const` is exported, and `scripts/extractRoutes.ts`
 * walks every `ts.isVariableStatement` without consulting the export
 * modifier.
 *
 * Every route is nonetheless written `export const <name> = route({…})`, and
 * that is the convention rather than a statement about dependencies: about
 * half have an importer — a test, or a sibling route reusing a helper — and
 * the rest do not, and making the spelling depend on that would mean editing
 * a declaration to write a test about it. The uniform form is also what the
 * generator's `export const` scan and the reviewer's eye both read as "one
 * route, one declaration".
 */
export function route<Q, B, R>(spec: RouteSpec<Q, B, R>): RouteSpec<Q, B, R> {
  registry.push(spec)
  return spec
}

export function allRoutes(): Array<RouteSpec<any, any, any>> {
  return registry
}

/**
 * How hard a response that fails its own `returns` cleaner should land.
 *
 * A mismatch is a documentation bug: the reference says one shape and the
 * engine sends another. It is never the caller's fault, so the default is to
 * log it and send the response through untouched rather than fail a request
 * that would otherwise have worked. Tests set `strict` to turn drift into a
 * failure, and `off` skips the check.
 */
type ResponseCheckMode = 'warn' | 'strict' | 'off'

function responseCheckMode(): ResponseCheckMode {
  const raw = process.env.EDGE_CLI_CHECK_RESPONSES
  if (raw === 'strict' || raw === '1') return 'strict'
  if (raw === 'off' || raw === '0') return 'off'
  return 'warn'
}

/**
 * Confirms a response matches the cleaner that documents it.
 *
 * The cleaned value is discarded. Response cleaners strip unknown keys, so
 * returning it would quietly delete fields the engine means to send — the
 * check exists to report drift, not to reshape anything.
 *
 * Exported for its test. `warn` is what production uses and what both
 * offline suites once ran without asserting — they set
 * `EDGE_CLI_CHECK_RESPONSES=strict` now, so a shape that drifts from the
 * published reference fails them, and `routeChecks.test.ts` covers all three
 * modes directly.
 */
export function checkResponse(
  spec: RouteSpec<any, any, any>,
  ctx: RouteContext,
  response: unknown
): void {
  if (spec.returns == null) return
  const mode = responseCheckMode()
  if (mode === 'off') return
  try {
    spec.returns(response)
  } catch (error: unknown) {
    const message = errorMessage(error)
    const detail = `${spec.method} ${spec.path} response does not match its documented type: ${message}`
    if (mode === 'strict') throw engineError('INTERNAL_ERROR', detail, 500)
    ctx.state.logger.warn('Response type mismatch', {
      route: `${spec.method} ${spec.path}`,
      message
    })
  }
}

/** Turn a cleaner failure into a `400` instead of a `500`. */
function clean<T>(cleaner: Cleaner<T>, raw: unknown, what: string): T {
  try {
    return cleaner(raw)
  } catch (error: unknown) {
    const message = errorMessage(error)
    throw engineError('BAD_REQUEST', `Invalid ${what}: ${message}`, 400)
  }
}

/**
 * Query strings are all strings; coerce to what the cleaner expects.
 *
 * `?x=` means the parameter is absent, and this is the one layer that decides
 * that — so a required field reports as missing rather than arriving as `''`,
 * and `asOptional`'s fallback applies. Downstream code must not re-interpret
 * `''`: three such branches existed and none of them could fire.
 *
 * Exported for its test. The function itself is on the router's hot path —
 * every handler invocation goes through it, and `cleanSseQuery` calls it too
 * — but the *empty-value branch above* is unreachable from the CLI, because
 * `commandArgs.ts` refuses `--flag=` before a request is built, so only a
 * raw REST call can exercise it and the raw calls in the offline suites
 * touch three routes.
 */
export function queryToObject(query: URLSearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of query.entries()) {
    if (value === '') continue
    out[key] = value
  }
  return out
}

/**
 * The URL a route actually answers on.
 *
 * `path` carries the scope — the account, the wallet, the handle — and the
 * command. A positional argument is appended to it, so the REST path reads in
 * the same order the command does: `account/{sessionId}/sign-tx/{objectId}`
 * for `sign-tx <objectId>`. Named arguments stay in the query or the body —
 * including every wallet id, for the percent-encoding reason `positional`
 * gives above.
 */
export function routePath(spec: RouteSpec<any, any, any>): string {
  const positional = positionalParam(spec)
  return positional == null ? spec.path : `${spec.path}/{${positional}}`
}

/** The field a route carries on the path, or null when it takes none. */
function positionalParam(spec: RouteSpec<any, any, any>): string | null {
  const cli = spec.cli
  if (cli == null || typeof cli === 'string' || Array.isArray(cli)) return null
  if (cli.positional == null) return null
  return cli.positional
}

export function registerRoute(
  router: Router,
  spec: RouteSpec<any, any, any>
): void {
  if (spec.stream != null) return // served directly by the HTTP handler
  const positional = positionalParam(spec)
  router.add(spec.method, routePath(spec), async ctx => {
    // The positional arrives as a path segment, but it is declared as an
    // ordinary field, so it is folded back in before the cleaner runs. The
    // handler reads it from the same place whichever transport it came over.
    const fromPath = (raw: Record<string, unknown>): Record<string, unknown> =>
      positional == null
        ? raw
        : { ...raw, [positional]: ctx.params[positional] }

    if (spec.query != null) {
      const parsed = clean(
        spec.query,
        fromPath(queryToObject(ctx.query)),
        'query'
      )
      ;(ctx.query as any).valid = parsed
    }
    if (spec.body != null) {
      // A POST whose every field rides on the path has nothing left to send,
      // so an absent body means an empty one. A body that is present but not
      // an object is still a bad request, and the cleaner reports any field
      // that is genuinely missing.
      const raw =
        spec.method === 'GET' || ctx.body == null
          ? {}
          : requireBodyObject(ctx.body)
      ctx.body = clean(spec.body, fromPath(raw), 'body')
    }
    const response = await spec.handler(ctx as any)
    checkResponse(spec, ctx, response)
    return response
  })
}
