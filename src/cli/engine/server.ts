import fs from 'fs'
import http, { type IncomingMessage, type ServerResponse } from 'http'

import { engineError, toErrorBody } from './errors'
import { readJsonBody, stringifyJson } from './json'
import { API_VERSION, type EngineState, type Router } from './router'

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

export function createRequestHandler(
  state: EngineState,
  router: Router
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    handleRequest(state, router, req, res).catch(() => {})
  }
}

async function handleRequest(
  state: EngineState,
  router: Router,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  state.idle.touch()

  try {
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
