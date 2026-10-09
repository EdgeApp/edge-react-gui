/**
 * The HTTP layer: one handler, two listeners.
 *
 * It owns everything that happens to a request before and after a route:
 * the TCP transport's authentication, the shutting-down gate, the SSE
 * special case — which bypasses the router because an event stream is not a
 * request/response — the body size limits, the content-type gate, the
 * session's in-flight hold, and turning whatever a handler throws into the
 * published error envelope.
 *
 * It does *not* decide what a route means. Path matching is `router.ts`,
 * validation is the cleaners on each `route()`, and the core→HTTP error
 * mapping is `errors.ts`.
 */
import fs from 'fs'
import http, { type IncomingMessage, type ServerResponse } from 'http'

import { API_VERSION, API_VERSION_HEADER } from './apiVersion'
import { EngineError, engineError, errorMessage, toErrorBody } from './errors'
import { readJsonBody, stringifyJson } from './json'
import { consoleReporter, type EngineReporter } from './logger'
import { queryToObject } from './route'
import type { EngineState, Router } from './router'
import { engineEvents } from './routes/events'
import { redactSessionId } from './sessions'
import { checkTcpRequest, type TcpGuard } from './transportAuth'

/** Drop connections that never finish sending headers or a body. */
const HEADERS_TIMEOUT_MS = 20_000
const REQUEST_TIMEOUT_MS = 120_000

function setCommonHeaders(res: ServerResponse): void {
  res.setHeader(API_VERSION_HEADER, API_VERSION)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  setCommonHeaders(res)
  res.statusCode = status
  if (body === undefined || status === 204) {
    res.end()
    return
  }
  res.end(stringifyJson(body))
}

/**
 * One request line, with every credential in it reduced to its name.
 *
 * The path's second segment is the session id on the 74 account routes, and
 * truncating it was all this did — on the claim that "a query string cannot
 * carry one", which the branch's own routes deny. `/engine/events` declares
 * `sessionId` as a query field and `subscribe --session-id=…` sends it, so a
 * stale id went into the log whole; and three other routes carry secrets
 * there that are not session ids at all — `admin-repo-get` and
 * `admin-repo-list` take `dataKey`, which with the `syncKey` in the path is
 * full offline read of an account repo, `check-password-rules` takes
 * `password`, and `fetch-recovery-questions` takes `recoveryKey`.
 *
 * So the rule is the other way round: every query *value* is replaced and
 * only the names are kept. The names are what identify the request, which is
 * why the line is logged at all, and a route that adds a secret field cannot
 * leak it by default. A `sessionId` keeps its truncated prefix, so a line can
 * still be correlated with a session.
 *
 * Exported for its test: the exposure is a file, not a response, so nothing
 * a caller sees would have shown it.
 */
export function redactUrl(url: string): string {
  const [path, query] = splitOnce(url, '?')
  const parts = path.split('/')
  // ['', 'account', '<id>', …]
  if (parts[1] === 'account' && parts[2] != null && parts[2] !== '') {
    parts[2] = redactSessionId(parts[2])
  }
  // The admin routes carry their secret in the path, not the query: five of
  // them take a `syncKey` as the positional, two a `lobbyId` and one an
  // `objectId`. A `syncKey` with the `dataKey` from the query is full offline
  // read of an account repo — the pair this function's own threat model
  // names — and it was going into `engine-<profile>.log` whole, for seven
  // days, in the file an operator pastes into a bug report. Truncated like a
  // session id, so a line still correlates with a request.
  //
  // The *last* segment, not segment 3: `routePath` appends the positional
  // after the whole command path, and `admin-lobby-handle-delete` is
  // `/admin/lobby-handle/delete/{objectId}` — two segments of command. Fixing
  // on segment 3 truncated the literal word `delete` and logged that id
  // whole. An admin route with no positional is `/admin/<command>`, which is
  // why the length test is for a fourth segment; a future two-segment command
  // with no positional loses the tail of its own name to this and keeps
  // enough to correlate, which is the safe direction for a rule about
  // credentials.
  if (parts[1] === 'admin' && parts.length > 3) {
    const last = parts.length - 1
    if (parts[last] !== '') parts[last] = redactSessionId(parts[last])
  }
  const safePath = parts.join('/')
  if (query == null) return safePath
  const fields = query
    .split('&')
    .filter(pair => pair !== '')
    .map(pair => {
      const [name, value] = splitOnce(pair, '=')
      if (value == null || value === '') return name
      // A session id keeps its prefix, for the same reason the path's does.
      if (name === 'sessionId') return `${name}=${redactSessionId(value)}`
      return `${name}=<redacted>`
    })
  return fields.length === 0 ? safePath : `${safePath}?${fields.join('&')}`
}

/** `text` up to the first `sep`, and whatever follows it. */
function splitOnce(text: string, sep: string): [string, string | undefined] {
  const at = text.indexOf(sep)
  return at === -1 ? [text, undefined] : [text.slice(0, at), text.slice(at + 1)]
}

/**
 * The SSE query, cleaned by the route's own declaration.
 *
 * `/engine/events` is served directly rather than through the router, so
 * nothing applied its `query` cleaner. Running it here keeps a stream route's
 * declaration enforced like every other route's, and turns a bad value into
 * `400 BAD_REQUEST` instead of silently ignoring it.
 *
 * The cleaned value is *returned*, and the scope below is built from it. An
 * earlier version validated a `raw` object it assembled from a hard-coded
 * `['sessionId', 'walletId']` and then threw the result away, while the
 * handler went on reading `searchParams` by hand — so the declaration only
 * looked enforced: a field added to `engineEvents.query` was validated
 * nowhere, and a *required* one would have made the cleaner throw 400 on
 * every request, because the hand-written list never carried it.
 *
 * `queryToObject` is the same function every routed request goes through,
 * including its one rule about `?x=` meaning absent — which the handler used
 * to repeat with its own `!== ''` tests.
 *
 * Exported for its test: serving the stream needs a whole `EngineState`, so
 * the scoping rule is pinned here instead.
 */
export function cleanSseQuery(url: URL): {
  sessionId?: string
  walletId?: string
} {
  const cleaner = engineEvents.query
  if (cleaner == null) return {}
  try {
    return cleaner(queryToObject(url.searchParams))
  } catch (error: unknown) {
    const message = errorMessage(error)
    throw engineError('BAD_REQUEST', message, 400)
  }
}

/**
 * One handler per listener.
 *
 * `guard` is supplied for the TCP listener and omitted for the unix socket,
 * whose `0600` mode inside a `0700` directory is already the check. See
 * `transportAuth.ts` for why a TCP port needs more than that.
 */
export function createRequestHandler(
  state: EngineState,
  router: Router,
  guard?: TcpGuard
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    handleRequest(state, router, req, res, guard).catch((error: unknown) => {
      // The last sink. The reachable escapes are in the error path itself —
      // `sendJson` stringifying an error's `details`, or `endRequest` in the
      // `finally` — and swallowing them left the response unended, so the
      // client waited out its own 120s socket timeout and reported
      // `Request timed out` while the engine log said nothing.
      const message = errorMessage(error)
      state.logger.error('Unhandled request failure', { message })
      if (!res.writableEnded) {
        res.statusCode = 500
        res.end()
      }
    })
  }
}

async function handleRequest(
  state: EngineState,
  router: Router,
  req: IncomingMessage,
  res: ServerResponse,
  guard?: TcpGuard
): Promise<void> {
  // Before the auth check and the body read, so the budget a route computes
  // is measured from when the caller's request actually landed.
  const arrivedAt = Date.now()
  // Authenticate before touching any engine state, which is what the
  // comment below has always claimed and the ordering did not deliver.
  // `idle.touch()` and `idle.beginRequest()` used to run first, so every
  // rejected request pushed `idleShutdownAt` out by a full `--idle-timeout`:
  // any other local process — the threat `transportAuth.ts` names — could
  // poll the port once a minute with no token and keep the daemon resident
  // for good, holding its EdgeContext and every plugin's polling open. That
  // is the leak `idleShutdown.ts` exists to bound.
  try {
    if (guard != null) checkTcpRequest(req, guard)
  } catch (error: unknown) {
    // Logged, because a rejected request on the TCP transport is the only
    // sign of a probe or a brute-force attempt and nothing recorded it.
    const message = errorMessage(error)
    state.logger.warn(`Rejected a TCP request: ${message}`)
    if (!res.writableEnded) {
      const { status, body } = toErrorBody(error)
      sendJson(res, status, body)
    }
    return
  }

  state.idle.touch()
  state.idle.beginRequest()

  try {
    // `== null || === ''`, not `??`: Node reports a present-but-empty
    // `Host:` as the empty string, so `??` let `new URL('/', 'http://')`
    // through — which throws, and the catch-all answered the caller's
    // malformed header as `500 INTERNAL_ERROR` with a stack in the log.
    const rawHost = req.headers.host
    const host = rawHost == null || rawHost === '' ? 'localhost' : rawHost
    const url = new URL(req.url ?? '/', `http://${host}`)
    const pathname = url.pathname

    // Stopping an engine that is already stopping has succeeded, so the stop
    // route is exempt from the 503. Answering it with
    // `ENGINE_SHUTTING_DOWN` meant a client that retries that condition —
    // which it must, so a command landing in the teardown window reaches a
    // fresh engine — started a *replacement* daemon in answer to a request
    // to stop one.
    const isStopRequest = req.method === 'POST' && pathname === '/engine/stop'
    if (state.shuttingDown && !isStopRequest) {
      throw engineError('ENGINE_SHUTTING_DOWN', 'Engine is shutting down', 503)
    }

    // SSE special-case
    if (req.method === 'GET' && pathname === '/engine/events') {
      // An optional `sessionId` scopes the stream to one account, which is
      // what makes `closeScope` reachable: without it every client was
      // context-scoped and an auto-logout closed nothing, though the
      // published reference said otherwise.
      // `?type=` repeated narrows the stream at the transport, so a caller
      // asking for one event type does not pay for the whole firehose.
      const wanted = url.searchParams.getAll('type').filter(t => t !== '')
      const types = wanted.length > 0 ? new Set(wanted) : undefined
      // Through the route's own cleaner, even though this path is served
      // outside the router: `registerRoute` returns early for a `stream`
      // route, so the declaration was validated nowhere and hand parsing was
      // the only contract. A declared field with a real type would have been
      // accepted in any shape at all. The scope comes off the cleaned value,
      // so there is one declaration of this route's query, not two.
      const scope = cleanSseQuery(url)
      const scopeSession = scope.sessionId
      if (scopeSession != null) {
        // Resolve it, so a stream cannot be opened against a session that
        // does not exist and then never be closed by anything.
        state.sessions.get(scopeSession)
        const scopeWallet = scope.walletId
        state.events.addSseClient(
          res,
          scopeWallet != null
            ? { kind: 'wallet', sessionId: scopeSession, walletId: scopeWallet }
            : { kind: 'session', sessionId: scopeSession },
          types
        )
        return
      }
      state.events.addSseClient(res, { kind: 'context' }, types)
      return
    }

    const matched = router.match(req.method ?? 'GET', pathname)
    if (matched == null) {
      // Check if path exists with different method
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      const other = methods.find(
        m =>
          m !== (req.method ?? '').toUpperCase() &&
          router.match(m, pathname) != null
      )
      if (other != null) {
        throw engineError(
          'METHOD_NOT_ALLOWED',
          `Method ${req.method} not allowed`,
          405
        )
      }
      throw engineError('NOT_FOUND', `No route for ${pathname}`, 404)
    }

    let body: unknown
    if (
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'PATCH'
    ) {
      const ct = String(req.headers['content-type'] ?? '')
      const len = Number(req.headers['content-length'] ?? '0')
      const hasBody = len > 0 || req.headers['transfer-encoding'] != null
      if (hasBody && !ct.includes('application/json')) {
        throw engineError(
          'UNSUPPORTED_MEDIA_TYPE',
          'Content-Type must be application/json',
          415
        )
      }
      try {
        body = await readJsonBody(req)
      } catch (error: unknown) {
        // Narrowed once, so the `message` read needs no cast: the code test
        // can only pass when this already held, and a cast here would keep
        // compiling if `json.ts` ever threw something that is not an Error.
        if (error instanceof EngineError) {
          if (error.code === 'BAD_REQUEST') {
            throw engineError('BAD_REQUEST', 'Invalid JSON body', 400)
          }
          if (error.code === 'PAYLOAD_TOO_LARGE') {
            // Answer first, then drop the connection so the rest of the
            // oversized upload is never read into memory.
            res.setHeader('Connection', 'close')
            res.once('finish', () => req.destroy())
            throw engineError('PAYLOAD_TOO_LARGE', error.message, 413)
          }
        }
        throw error
      }
    }

    // Hold the session open for the duration of the handler, the same way
    // `idle.beginRequest` holds the engine. The auto-logout ticker records
    // only when a request *started*, so a call that outlives the window —
    // a cold `wait-for-all-wallets`, a `resync-blockchain`, a `spend` on a
    // congested chain — could otherwise be logged out from underneath itself.
    const releaseSession =
      matched.params.sessionId != null
        ? state.sessions.beginRequest(matched.params.sessionId)
        : undefined
    let result: unknown
    try {
      result = await matched.handler({
        state,
        req,
        res,
        params: matched.params,
        query: url.searchParams,
        body,
        arrivedAt
      })
    } finally {
      releaseSession?.()
    }

    if (res.writableEnded) return

    if (result === undefined) {
      sendJson(res, 204, undefined)
    } else {
      sendJson(res, 200, result)
    }
  } catch (error: unknown) {
    if (res.writableEnded) return
    const { status, body } = toErrorBody(error)
    // Logged before it is sent, because this path never touched the logger.
    // Anything `mapCoreError` does not recognise becomes `500
    // INTERNAL_ERROR` carrying only `error.message`, and for a detached
    // daemon whose one diagnostic surface is
    // `~/.edge-cli/logs/engine-<profile>.log` that made a plugin or core
    // fault unreproducible after the fact: the operator had the single line
    // the client printed, and the client is often a script that discarded
    // it. The response body is unchanged.
    // The path with its session id truncated. 74 of the 117 routes are
    // `/account/{sessionId}/…`, and a `sessionId` is a bearer token — the
    // module that mints them says so, and every other site in the engine
    // routes through `redactSessionId`. This one did not, so a mistyped
    // `--wallet-id` put a live credential into
    // `~/.edge-cli/logs/engine-<profile>.log`, which `sweepOldLogs` keeps
    // for seven days and an operator pastes into a bug report. Enough of it
    // survives to correlate the line with a session, which is the whole
    // reason the path is logged.
    const where = `${req.method ?? 'GET'} ${redactUrl(req.url ?? '/')}`
    if (status >= 500) {
      state.logger.error(`Request failed: ${where}`, {
        code: body.error.code,
        message: body.error.message,
        stack: error instanceof Error ? error.stack : undefined
      })
    } else {
      // A 4xx is the caller's doing, so it is worth seeing without a stack.
      state.logger.warn(
        `Request refused: ${where} ${body.error.code} ${body.error.message}`
      )
    }
    sendJson(res, status, body)
  } finally {
    state.idle.endRequest()
  }
}

/**
 * Report a listener error after `listen` has resolved.
 *
 * The `once('error', reject)` that guards startup stays bound afterwards and
 * would silently swallow any later error, leaving a dead socket behind an
 * engine that still looks healthy.
 */
function reportLateErrors(
  server: http.Server,
  what: string,
  report: EngineReporter
): void {
  server.on('error', (error: Error) => {
    report.error(`${what} listener error: ${error.message}`)
  })
}

/**
 * Start one listener and wait for it to be bound.
 *
 * The two entries below were 24-line near-duplicates: same
 * `createServer`, same two timeouts, same `once('error')` / `listen` /
 * `off('error')` dance, same late-error reporting. Only the `listen`
 * arguments and what happens after binding differ, so that is all either one
 * passes.
 *
 * The `once('error')` matters: without it a bind failure — a socket another
 * engine already owns, a port in use — is an unhandled `'error'` event and
 * therefore an uncaught exception, instead of a rejection the caller can
 * report.
 */
async function listenOn(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  label: string,
  report: EngineReporter,
  bind: (server: http.Server, onListening: () => void) => void,
  afterBind?: () => void
): Promise<http.Server> {
  const server = http.createServer(handler)
  server.headersTimeout = HEADERS_TIMEOUT_MS
  server.requestTimeout = REQUEST_TIMEOUT_MS
  await new Promise<void>((resolve, reject) => {
    const onStartupError = (error: Error): void => {
      reject(error)
    }
    server.once('error', onStartupError)
    bind(server, () => {
      server.off('error', onStartupError)
      afterBind?.()
      resolve()
    })
  })
  reportLateErrors(server, label, report)
  return server
}

export async function listenUnix(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  socketPath: string,
  report: EngineReporter = consoleReporter
): Promise<http.Server> {
  return await listenOn(
    handler,
    'unix socket',
    report,
    (server, onListening) => server.listen(socketPath, onListening),
    () => {
      // `0600` is this transport's entire authentication: only this user's
      // processes can connect, which is why the unix socket needs no token.
      // Node binds at `0777 & ~umask`, so a failed `chmodSync` leaves the
      // only guard absent — reported, not swallowed, because an operator
      // whose socket is group-readable has no other way to find out.
      try {
        fs.chmodSync(socketPath, 0o600)
      } catch (error: unknown) {
        const message = errorMessage(error)
        report.error(
          `could not set ${socketPath} to 0600 (${message}); ` +
            'the socket may be reachable by other local users'
        )
      }
    }
  )
}

export async function listenTcp(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  port: number,
  // Required, not defaulted: the sole caller always passes
  // `args.tcpHost`, and a second literal here meant the bind address had
  // two defaults — `engineArgs.ts` owns the one that is read.
  host: string,
  report: EngineReporter = consoleReporter
): Promise<{ server: http.Server; port: number }> {
  const server = await listenOn(handler, 'tcp', report, (s, onListening) =>
    s.listen(port, host, onListening)
  )
  // The bound port, not the requested one: `--tcp=0` asks the OS to choose.
  const address = server.address()
  const bound =
    address != null && typeof address === 'object' ? address.port : port
  return { server, port: bound }
}
