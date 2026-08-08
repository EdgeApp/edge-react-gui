import crypto from 'crypto'
import fs from 'fs'
import http, { type IncomingMessage, type ServerResponse } from 'http'

import { engineError, toErrorBody } from './errors'
import { readJsonBody, stringifyJson } from './json'
import { API_VERSION, type EngineState, type Router } from './router'

/** Drop connections that never finish sending headers or a body. */
const HEADERS_TIMEOUT_MS = 20_000
const REQUEST_TIMEOUT_MS = 120_000

export interface HandlerOptions {
  /**
   * Required on the TCP listener. The unix socket is already restricted to the
   * owner by its 0600 mode, so it carries no token.
   */
  authToken?: string
  /** Hostnames accepted in the Host header (anti DNS-rebinding). */
  allowedHostnames?: string[]
}

/** `127.0.0.1:9008` -> `127.0.0.1`, `[::1]:9008` -> `::1`. */
function hostnameOf(hostHeader: string): string {
  const host = hostHeader.trim().toLowerCase()
  if (host.startsWith('[')) return host.slice(1, host.indexOf(']'))
  const colon = host.lastIndexOf(':')
  return colon === -1 ? host : host.slice(0, colon)
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

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

export function createRequestHandler(
  state: EngineState,
  router: Router,
  options: HandlerOptions = {}
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    handleRequest(state, router, req, res, options).catch(() => {})
  }
}

/**
 * The engine speaks to trusted local tooling only. Anything that looks like a
 * browser-originated cross-site request is refused before it reaches a route,
 * so a visited web page cannot drive spends or read keys.
 */
function assertTrustedRequest(
  req: IncomingMessage,
  options: HandlerOptions
): void {
  if (req.headers.origin != null) {
    throw engineError('FORBIDDEN', 'Cross-origin requests are not allowed', 403)
  }
  if (req.headers['sec-fetch-mode'] != null) {
    throw engineError('FORBIDDEN', 'Browser requests are not allowed', 403)
  }

  const { authToken, allowedHostnames } = options
  if (authToken == null) return

  if (allowedHostnames != null) {
    const hostname = hostnameOf(req.headers.host ?? '')
    if (!allowedHostnames.includes(hostname)) {
      throw engineError('FORBIDDEN', `Host not allowed: ${hostname}`, 403)
    }
  }

  const auth = req.headers.authorization ?? ''
  const prefix = 'Bearer '
  if (
    !auth.startsWith(prefix) ||
    !timingSafeEqualString(auth.slice(prefix.length), authToken)
  ) {
    throw engineError('UNAUTHORIZED', 'Missing or invalid bearer token', 401)
  }
}

async function handleRequest(
  state: EngineState,
  router: Router,
  req: IncomingMessage,
  res: ServerResponse,
  options: HandlerOptions
): Promise<void> {
  state.idle.touch()

  try {
    assertTrustedRequest(req, options)

    if (state.shuttingDown) {
      throw engineError('ENGINE_SHUTTING_DOWN', 'Engine is shutting down', 503)
    }

    const host = req.headers.host ?? 'localhost'
    const url = new URL(req.url ?? '/', `http://${host}`)
    const pathname = url.pathname

    // SSE special-case
    if (req.method === 'GET' && pathname === '/v1/events') {
      state.events.addSseClient(res)
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
      // Only application/json: the CORS-safelisted types (text/plain,
      // multipart/form-data, application/x-www-form-urlencoded) must never
      // reach a handler, or a plain HTML form could drive the engine.
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
        const code =
          error != null && typeof error === 'object' && 'code' in error
            ? (error as { code: string }).code
            : ''
        if (code === 'BAD_REQUEST') {
          throw engineError('BAD_REQUEST', 'Invalid JSON body', 400)
        }
        if (code === 'PAYLOAD_TOO_LARGE') {
          // Answer first, then drop the connection so the rest of the
          // oversized upload is never read into memory.
          res.setHeader('Connection', 'close')
          res.once('finish', () => req.destroy())
          throw engineError('PAYLOAD_TOO_LARGE', (error as Error).message, 413)
        }
        throw error
      }
    }

    const result = await matched.handler({
      state,
      req,
      res,
      params: matched.params,
      query: url.searchParams,
      body
    })

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
  }
}

export async function listenUnix(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  socketPath: string
): Promise<http.Server> {
  const server = http.createServer(handler)
  server.headersTimeout = HEADERS_TIMEOUT_MS
  server.requestTimeout = REQUEST_TIMEOUT_MS
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(socketPath, () => {
      try {
        fs.chmodSync(socketPath, 0o600)
      } catch {
        // ignore
      }
      resolve()
    })
  })
  return server
}

export async function listenTcp(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  port: number,
  host = '127.0.0.1'
): Promise<{ server: http.Server; port: number }> {
  const server = http.createServer(handler)
  server.headersTimeout = HEADERS_TIMEOUT_MS
  server.requestTimeout = REQUEST_TIMEOUT_MS
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      resolve()
    })
  })
  const address = server.address()
  const bound =
    address != null && typeof address === 'object' ? address.port : port
  return { server, port: bound }
}
