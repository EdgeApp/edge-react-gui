import {
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown
} from 'cleaners'
import http from 'http'

import { stringifyJson } from '../engine/json'
import { SHUTDOWN_WAIT_MS } from '../engine/shutdownTiming'

/**
 * The error envelope every failure arrives in, on both transports.
 *
 * Cleaned, not cast. `'error' in parsed` was the only guard, so
 * `{"error":"boom"}` built an `ApiClientError` from the string: `code` and
 * `status` were `undefined`, `super(body.message)` was `super(undefined)`,
 * and the CLI printed `{"error":{"code":undefined,…}}` and exited 1. The
 * same reasoning is written out on `sessionFile.ts`'s own cleaner.
 */
export const asApiErrorBody = asObject({
  error: asObject({
    code: asString,
    message: asString,
    status: asNumber,
    details: asOptional(asObject(asUnknown))
  })
})

export type ApiErrorBody = ReturnType<typeof asApiErrorBody>

export class ApiClientError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  /**
   * `details` is optional here where the cleaner materialises it, so a
   * hand-built failure does not have to spell `details: undefined`.
   */
  constructor(body: {
    code: string
    message: string
    status: number
    details?: Record<string, unknown>
  }) {
    super(body.message)
    this.name = 'ApiClientError'
    this.status = body.status
    this.code = body.code
    this.details = body.details
  }
}

export interface ApiClientOptions {
  /**
   * The engine's unix socket. The only transport this client speaks.
   *
   * There were `host` and `port` fields beside it, and they could not work:
   * the engine's TCP listener requires an `X-Edge-Token` header and this
   * client never sent one, so every TCP request would have been a 401. No
   * call site set them either — the client always talks to the engine it
   * spawned, over the socket — and `--tcp` is forwarded to the *engine*, for
   * other local scripts to use. Removed rather than wired up, the way
   * `idleTimeoutSeconds` and `spawnTimeoutMs` were.
   */
  socketPath?: string
  /**
   * How long one request may take, in milliseconds.
   *
   * `--timeout=<seconds>` sets it. There has to be a way: on expiry the
   * client destroys the socket and reports a failure while the engine runs
   * the request to completion, so for `broadcast-tx` the caller is told the
   * call failed after the funds have left, and a long `get-transactions`,
   * `wait-for-all-wallets` or `resync-blockchain` had no way to ask for more
   * time.
   */
  timeoutMs?: number
  /**
   * Start the engine, called once when a request finds nothing listening.
   *
   * Spawning on demand rather than up front means a command that fails before
   * it ever sends a request — an unknown flag, a missing value, no session —
   * leaves no daemon behind.
   */
  onConnectFail?: () => Promise<void>

  /**
   * Called once, after the first request that reaches an engine.
   *
   * For checks that need a live engine but must not cause one to start: doing
   * them up front would spawn a daemon for a command that never runs.
   */
  onFirstResponse?: (client: ApiClient) => Promise<void>
}

/** The per-request deadline when no `--timeout` is given. */
export const DEFAULT_TIMEOUT_MS = 120_000

/** Nothing is listening on the socket or port yet. */
function isNotListening(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return code === 'ENOENT' || code === 'ECONNREFUSED'
}

/**
 * The engine is going away, so a fresh one will answer this.
 *
 * `shutdown()` sets `shuttingDown` as its second statement and does not close
 * the listeners until the drain, the logouts and `context.close()` are done,
 * so for that whole window a bound socket answers `503
 * ENGINE_SHUTTING_DOWN`. Treating it as terminal made `engine-stop` followed
 * by any command in the same script a guaranteed failure, and every command
 * a race once the idle timer starts firing — which the guide presents as
 * invisible housekeeping.
 */
function isShuttingDown(error: unknown): boolean {
  return (
    error instanceof ApiClientError && error.code === 'ENGINE_SHUTTING_DOWN'
  )
}

export class ApiClient {
  private readonly opts: ApiClientOptions

  constructor(opts: ApiClientOptions) {
    this.opts = opts
  }

  /** A spawn in flight, so concurrent calls wait on one rather than racing. */
  private spawning: Promise<void> | null = null
  private firstResponseDone = false

  /**
   * Run something against the engine, starting it if nothing is listening.
   *
   * Only an in-flight spawn is shared. A *completed* one is forgotten, because
   * the engine it started can go away again — `engine-stop`, or the documented
   * idle shutdown — and a long-lived client like the interactive prompt has to
   * be able to start another.
   */
  private async withEngine<T>(attempt: () => Promise<T>): Promise<T> {
    let result: T
    try {
      result = await attempt()
    } catch (error: unknown) {
      const spawn = this.opts.onConnectFail
      if (spawn == null) throw error
      if (isShuttingDown(error)) {
        // Wait for the socket to go, bounded, then start a fresh engine. The
        // old one is still bound and still answering 503, so retrying
        // immediately would just collect another one.
        await this.waitForSocketToClose()
      } else if (!isNotListening(error)) {
        throw error
      }
      this.spawning ??= spawn().finally(() => {
        this.spawning = null
      })
      await this.spawning
      result = await attempt()
    }
    await this.runFirstResponseHook()
    return result
  }

  /**
   * Poll until the engine stops answering, or give up.
   *
   * Bounded by `SHUTDOWN_WAIT_MS`, which is the sum of the engine's own
   * teardown phases rather than a number picked here — it used to be 15 s
   * against a 110 s drain, so a stop with a slow request in flight sent the
   * next command off to spawn a replacement that could not claim the
   * profile. Past the deadline the engine is wedged rather than shutting
   * down, and `onConnectFail` reports whatever it finds.
   *
   * The loop can tell the two apart: a shutting-down engine answers 503 on
   * `/engine/status`, and a gone one answers ENOENT or ECONNREFUSED.
   */
  private async waitForSocketToClose(): Promise<void> {
    const deadline = Date.now() + SHUTDOWN_WAIT_MS
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 100))
      try {
        await this.sendRequest('GET', '/engine/status')
      } catch (error: unknown) {
        if (isNotListening(error)) return
      }
    }
  }

  private async runFirstResponseHook(): Promise<void> {
    const hook = this.opts.onFirstResponse
    if (hook == null || this.firstResponseDone) return
    // Set before calling: the hook talks to the engine itself.
    this.firstResponseDone = true
    await hook(this)
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    // Asking an engine to stop must never *start* one. Without this, a stop
    // sent after the daemon has already gone found nothing listening, took
    // the auto-spawn path, and brought up a replacement engine purely to
    // tell it to shut down — which then sat idle under a fresh profile
    // directory. The offline suite's own leak check caught it.
    const isStop = method === 'POST' && path === '/engine/stop'
    if (isStop) {
      try {
        return await this.sendRequest<T>(method, path, body)
      } catch (error: unknown) {
        // Nothing listening means there is nothing to stop, which is what
        // the caller wanted. Reporting the raw `connect ENOENT` as a 500
        // made a no-op fail, and spawning an engine to receive the stop was
        // worse.
        if (isNotListening(error)) {
          const noop: unknown = { ok: true }
          return noop as T
        }
        throw error
      }
    }
    return await this.withEngine(
      async () => await this.sendRequest<T>(method, path, body)
    )
  }

  private async sendRequest<T = unknown>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const payload =
      body === undefined ? undefined : Buffer.from(stringifyJson(body), 'utf8')

    const headers: Record<string, string> = {
      Accept: 'application/json'
    }
    if (payload != null) {
      headers['Content-Type'] = 'application/json; charset=utf-8'
      headers['Content-Length'] = String(payload.length)
    }

    const response = await new Promise<{
      status: number
      raw: string
    }>((resolve, reject) => {
      const req = http.request(
        {
          method,
          path,
          headers,
          socketPath: this.opts.socketPath,
          timeout: this.opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
        },
        res => {
          const chunks: Buffer[] = []
          res.on('data', (c: Buffer) => chunks.push(c))
          res.on('end', () => {
            resolve({
              status: res.statusCode ?? 0,
              raw: Buffer.concat(chunks).toString('utf8')
            })
          })
          // Once headers have arrived Node routes a socket close to the
          // *response*, not the request, and `IncomingMessage` only emits it
          // when something is listening. Without these two the promise never
          // settled: `main()` never resolved, `process.exitCode` was never
          // assigned, the loop drained, and the CLI exited **0** with empty
          // stdout — so `edge-cli spend … && echo sent` printed `sent` for a
          // request the engine died in the middle of answering. The socket
          // timeout cannot cover it either, because the socket is already
          // destroyed. `openStream` below always had the handler.
          res.on('error', reject)
          res.on('aborted', () => {
            reject(
              new Error(
                `The engine closed the connection while answering ${method} ${path}. The command may or may not have taken effect.`
              )
            )
          })
        }
      )
      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy(
          new Error(
            `Request timed out after ${
              (this.opts.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000
            }s: ${method} ${path}. The engine may still be working; raise the deadline with --timeout=<seconds>.`
          )
        )
      })
      if (payload != null) req.write(payload)
      req.end()
    })

    if (response.status === 204 || response.raw === '') {
      if (response.status >= 400) {
        throw new ApiClientError({
          code: 'INTERNAL_ERROR',
          message: `HTTP ${response.status}`,
          status: response.status
        })
      }
      return undefined as T
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(response.raw)
    } catch {
      throw new ApiClientError({
        code: 'INTERNAL_ERROR',
        message: `Non-JSON response (${response.status}): ${response.raw.slice(
          0,
          200
        )}`,
        status: response.status
      })
    }

    if (response.status >= 400) {
      // A well-formed envelope is used as-is; anything else — an HTML error
      // page from a proxy, a truncated body, `{"error":"boom"}` — becomes a
      // generic failure that still carries the status and the raw body.
      const envelope = asMaybe(asApiErrorBody)(parsed)
      if (envelope != null) throw new ApiClientError(envelope.error)
      throw new ApiClientError({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${response.status}`,
        status: response.status,
        details: { body: parsed }
      })
    }

    return parsed as T
  }

  /**
   * Hold a Server-Sent Events stream open, handing each frame to `onEvent` as
   * it arrives. Unlike `request`, nothing is buffered: the response body never
   * ends until the engine closes it or the caller aborts.
   *
   * Resolves when the engine ends the stream, rejects if it cannot be opened.
   */
  async stream(
    path: string,
    onEvent: (event: string, data: unknown) => void,
    opts: { signal?: AbortSignal } = {}
  ): Promise<void> {
    // Through `withEngine` like `request`: a held-open stream is the first
    // thing a cold `subscribe` does, and it has to start the engine too.
    await this.withEngine(async () => {
      await this.openStream(path, onEvent, opts)
    })
  }

  private async openStream(
    path: string,
    onEvent: (event: string, data: unknown) => void,
    opts: { signal?: AbortSignal } = {}
  ): Promise<void> {
    // An abort that landed before this attempt still has to end the stream.
    // `addEventListener('abort')` on an already-aborted signal never fires,
    // and a cold `subscribe` spends up to 30s inside `ensureEngine` between
    // the failed first attempt and this one, so a Ctrl-C in that window would
    // otherwise open the stream and hold it forever.
    if (opts.signal?.aborted === true) return

    let onAbort: (() => void) | undefined
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.request(
          {
            socketPath: this.opts.socketPath,
            method: 'GET',
            path,
            headers: { Accept: 'text/event-stream' }
          },
          res => {
            if (res.statusCode != null && res.statusCode >= 400) {
              let raw = ''
              res.setEncoding('utf8')
              // This branch returns before the success branch's handler, so
              // an engine that died while sending a 4xx body hung
              // `subscribe` instead of reporting the status.
              res.on('error', reject)
              res.on('aborted', () => {
                reject(
                  new Error(
                    `The engine closed the connection while answering GET ${path} with HTTP ${
                      res.statusCode ?? 0
                    }.`
                  )
                )
              })
              res.on('data', chunk => (raw += chunk))
              res.on('end', () => {
                try {
                  const envelope = asApiErrorBody(JSON.parse(raw))
                  reject(new ApiClientError(envelope.error))
                } catch {
                  reject(
                    new ApiClientError({
                      code: 'INTERNAL_ERROR',
                      message: `HTTP ${res.statusCode ?? 0}`,
                      status: res.statusCode ?? 500
                    })
                  )
                }
              })
              return
            }

            // SSE frames are separated by a blank line. Hold a partial tail
            // between chunks, since a frame can straddle a TCP read.
            let buffer = ''
            res.setEncoding('utf8')
            res.on('data', (chunk: string) => {
              buffer += chunk
              let split = buffer.indexOf('\n\n')
              while (split !== -1) {
                const frame = buffer.slice(0, split)
                buffer = buffer.slice(split + 2)
                emitFrame(frame, onEvent)
                split = buffer.indexOf('\n\n')
              }
            })
            res.on('end', () => {
              resolve()
            })
            res.on('error', reject)
          }
        )
        req.on('error', reject)
        onAbort = () => {
          req.destroy()
          resolve()
        }
        // `once`, so an abort cannot fire twice, and removed in `finally` so
        // a long-lived signal does not accumulate listeners per attempt.
        opts.signal?.addEventListener('abort', onAbort, { once: true })
        req.end()
      })
    } finally {
      if (onAbort != null) opts.signal?.removeEventListener('abort', onAbort)
    }
  }

  async get<T = unknown>(path: string): Promise<T> {
    return await this.request<T>('GET', path)
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>('POST', path, body)
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>('PUT', path, body)
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>('PATCH', path, body)
  }

  async delete<T = unknown>(path: string, body?: unknown): Promise<T> {
    return await this.request<T>('DELETE', path, body)
  }
}

/** Parse one `event:` / `data:` frame. Comment lines (`: ok`) are ignored. */
function emitFrame(
  frame: string,
  onEvent: (event: string, data: unknown) => void
): void {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of frame.split('\n')) {
    if (line === '' || line.startsWith(':')) continue
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return
  const raw = dataLines.join('\n')
  let data: unknown = raw
  try {
    data = JSON.parse(raw)
  } catch {
    // Leave non-JSON payloads as the raw string.
  }
  onEvent(event, data)
}
