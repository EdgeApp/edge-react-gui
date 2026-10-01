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

import { API_VERSION } from './apiVersion'
import { EngineError, engineError, toErrorBody } from './errors'
import { readJsonBody, stringifyJson } from './json'
import type { EngineState, Router } from './router'
import { engineEvents } from './routes/events'
import { checkTcpRequest, type TcpGuard } from './transportAuth'

/** Drop connections that never finish sending headers or a body. */
const HEADERS_TIMEOUT_MS = 20_000
const REQUEST_TIMEOUT_MS = 120_000

function setCommonHeaders(res: ServerResponse): void {
  res.setHeader('X-Edge-Api-Version', API_VERSION)
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
 * One handler per listener.
 *
 * `guard` is supplied for the TCP listener and omitted for the unix socket,
 * whose `0600` mode inside a `0700` directory is already the check. See
 * `transportAuth.ts` for why a TCP port needs more than that.
 */
/**
 * Validate the SSE query against the route's declaration.
 *
 * `/engine/events` is served directly rather than through the router, so
 * nothing applied its `query` cleaner. Running it here keeps a stream route's
 * declaration enforced like every other route's, and turns a bad value into
 * `400 BAD_REQUEST` instead of silently ignoring it.
 */
function cleanSseQuery(url: URL): void {
  const cleaner = engineEvents.query
  if (cleaner == null) return
  const raw: Record<string, string> = {}
  for (const field of ['sessionId', 'walletId']) {
    const value = url.searchParams.get(field)
    if (value != null && value !== '') raw[field] = value
  }
  try {
    cleaner(raw)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw engineError('BAD_REQUEST', message, 400)
  }
}

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
      const message = error instanceof Error ? error.message : String(error)
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
  state.idle.touch()
  state.idle.beginRequest()

  try {
    // First, before the route table, the body and even the shutdown state: a
    // caller that cannot authenticate learns nothing about this engine.
    if (guard != null) checkTcpRequest(req, guard)

    const host = req.headers.host ?? 'localhost'
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
      // route, so the declaration was validated nowhere and the hand parsing
      // below was the only contract. A declared field with a real type would
      // have been accepted in any shape at all.
      cleanSseQuery(url)
      const scopeSession = url.searchParams.get('sessionId')
      if (scopeSession != null && scopeSession !== '') {
        // Resolve it, so a stream cannot be opened against a session that
        // does not exist and then never be closed by anything.
        state.sessions.get(scopeSession)
        const scopeWallet = url.searchParams.get('walletId')
        state.events.addSseClient(
          res,
          scopeWallet != null && scopeWallet !== ''
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
        body
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
function reportLateErrors(server: http.Server, what: string): void {
  server.on('error', (error: Error) => {
    console.error(`[edge-engine] ${what} listener error: ${error.message}`)
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
  reportLateErrors(server, label)
  return server
}

export async function listenUnix(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  socketPath: string
): Promise<http.Server> {
  return await listenOn(
    handler,
    'unix socket',
    (server, onListening) => server.listen(socketPath, onListening),
    () => {
      // `0600` is this transport's entire authentication: only this user's
      // processes can connect, which is why the unix socket needs no token.
      try {
        fs.chmodSync(socketPath, 0o600)
      } catch {
        // ignore
      }
    }
  )
}

export async function listenTcp(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  port: number,
  host = '127.0.0.1'
): Promise<{ server: http.Server; port: number }> {
  const server = await listenOn(handler, 'tcp', (s, onListening) =>
    s.listen(port, host, onListening)
  )
  // The bound port, not the requested one: `--tcp=0` asks the OS to choose.
  const address = server.address()
  const bound =
    address != null && typeof address === 'object' ? address.port : port
  return { server, port: bound }
}
