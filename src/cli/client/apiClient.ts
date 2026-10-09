import { asJSON, asMaybe } from 'cleaners'
import http from 'http'

import { asErrorBody } from '../engine/errors'
import { stringifyJson } from '../engine/json'
import { SHUTDOWN_WAIT_MS } from '../engine/shutdownTiming'
import { REQUEST_BUDGET_HEADER } from '../requestBudget'

/**
 * The error envelope every failure arrives in, on both transports.
 *
 * Cleaned, not cast. `'error' in parsed` was the only guard, so
 * `{"error":"boom"}` built an `ApiClientError` from the string: `code` and
 * `status` were `undefined`, `super(body.message)` was `super(undefined)`,
 * and the CLI printed `{"error":{"code":undefined,…}}` and exited 1. The
 * same reasoning is written out on `sessionFile.ts`'s own cleaner.
 *
 * The cleaner itself is the engine's, beside `toErrorBody` which writes the
 * envelope: one declaration for the writer and the reader, re-exported here
 * under the name this file's callers already use.
 */
export const asApiErrorBody = asErrorBody

export type ApiErrorBody = ReturnType<typeof asApiErrorBody>

/**
 * A failure of the *call*, not of the engine.
 *
 * The client's own deadline and a connection that dies mid-answer both fell
 * through `printError`'s generic arm, which writes
 * `{"code":"INTERNAL_ERROR","status":500}` and exits 1 — so a caller was
 * told the engine answered 500 when no HTTP response had existed, under a
 * code the catalogue declares `origin: 'engine'` and the guide describes as
 * an engine or plugin fault. `--timeout` is documented as a routine thing to
 * raise, which makes this the expected outcome of a long call rather than an
 * exception.
 *
 * `spawnEngine.ts` already made this argument for the other half and fixed
 * it with `EngineUnavailableError` — "the generic `Error` arm reported it as
 * `INTERNAL_ERROR` and exit 1, which a wrapper script branching on 7
 * mis-handles". This is the same move for the client's own deadline.
 */
export class ClientRequestError extends Error {
  code: 'REQUEST_TIMEOUT' | 'CONNECTION_CLOSED'
  status: number

  constructor(code: 'REQUEST_TIMEOUT' | 'CONNECTION_CLOSED', message: string) {
    super(message)
    this.name = 'ClientRequestError'
    this.code = code
    // 504 for a deadline the client set and 503 for a connection that went
    // away: both are "no answer arrived", and both map to the network exit
    // code through the published unlisted-503 rule and an explicit row.
    this.status = code === 'REQUEST_TIMEOUT' ? 504 : 503
  }
}

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
   * How long to wait for a shutting-down engine's socket to go.
   *
   * `SHUTDOWN_WAIT_MS` by default, which is the sum of the engine's own
   * teardown phases. A seam, so `apiClient.test.ts` can drive the ceiling
   * without 150 seconds of real time — the arm past it is the one that
   * decides between reporting a wedged engine and spawning a replacement
   * that cannot claim the profile.
   */
  shutdownWaitMs?: number
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

/**
 * Nothing is listening on the socket yet.
 *
 * `ENOENT` is the socket file not being there at all, and `ECONNREFUSED` a
 * path left behind by an engine that is gone. No port: the unix socket is
 * the only transport this client speaks, which is why `host` and `port` were
 * removed from `ApiClientOptions` rather than wired up.
 */
function isNotListening(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return code === 'ENOENT' || code === 'ECONNREFUSED'
}

/**
 * The engine died while this request was in flight, before it answered.
 *
 * The response's `aborted` handler covers a connection that dies
 * *mid-answer*, but an
 * engine killed before it writes any headers — `SIGKILL`, the OOM killer, a
 * container stop — reaches the *request* as a bare `ECONNRESET` or `EPIPE`.
 * Those fell through `printError`'s generic arm as
 * `{"code":"INTERNAL_ERROR","status":500}` and exit 1, which is the
 * mis-report `ClientRequestError` exists to prevent, for the commonest way
 * an engine dies. Not `isNotListening`: there the socket was never
 * connected, so nothing can have taken effect, and the client spawns an
 * engine and retries.
 */
function isConnectionLost(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return code === 'ECONNRESET' || code === 'EPIPE'
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

  private get shutdownWaitMs(): number {
    return this.opts.shutdownWaitMs ?? SHUTDOWN_WAIT_MS
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
  private async withEngine<T>(
    attempt: () => Promise<T>,
    opts: { firstResponseHook?: boolean } = {}
  ): Promise<T> {
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
        if (!(await this.waitForSocketToClose())) {
          // Past the ceiling the engine is wedged rather than shutting down,
          // and a replacement cannot work: `claimRunFile` fails `wx` against
          // the live run file, the user is told to run the `engine-stop`
          // they just ran, and the child opens `engine-startup.log` with
          // `'w'` in the live engine's run directory — truncating the one
          // record of what the wedged daemon was doing. Report instead.
          throw new ApiClientError({
            code: 'ENGINE_SHUTTING_DOWN',
            status: 503,
            message:
              `The engine is still shutting down after ` +
              `${Math.round(this.shutdownWaitMs / 1000)}s and is not ` +
              `accepting requests. It is wedged rather than draining; ` +
              `inspect or kill it rather than starting another.`
          })
        }
      } else if (!isNotListening(error)) {
        throw error
      }
      this.spawning ??= spawn().finally(() => {
        this.spawning = null
      })
      await this.spawning
      result = await attempt()
    }
    if (opts.firstResponseHook !== false) await this.runFirstResponseHook()
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
   * down, so this answers `false` and the caller reports that instead of
   * spawning the replacement this paragraph used to promise it would not —
   * the return value was `void`, so every outcome led to the same spawn.
   *
   * The loop can tell the two apart: a shutting-down engine answers 503 on
   * `/engine/status`, and a gone one answers ENOENT or ECONNREFUSED.
   */
  private async waitForSocketToClose(): Promise<boolean> {
    const deadline = Date.now() + this.shutdownWaitMs
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 100))
      try {
        await this.sendRequest('GET', '/engine/status')
        // A plain answer means the wait is over: this is a *new* engine on
        // the same socket, not the one that was shutting down — that one
        // answers 503 and lands in the catch below. Without this the loop
        // had no exit for the one reply that means "stop waiting", so an
        // engine replaced by another invocation mid-wait left the client
        // polling the full SHUTDOWN_WAIT_MS — 150 s and about 1,500
        // requests — against a healthy engine that was ready in under a
        // second.
        return true
      } catch (error: unknown) {
        // Gone: the socket is unlinked or refusing, which is what the wait
        // was for.
        if (isNotListening(error)) return true
        // Anything else — 503 ENGINE_SHUTTING_DOWN above all — means the old
        // engine is still draining, so keep waiting.
      }
    }
    return false
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
      Accept: 'application/json',
      // So a route whose work has its own internal budget can match it to
      // the caller's. `get-transactions`'s fiat fill is the one that needs
      // it: its chain *settles* the remainder when its budget expires, so a
      // deadline the engine cannot see meant `--timeout` raised the client's
      // patience and not the work's.
      [REQUEST_BUDGET_HEADER]: String(this.opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
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
              new ClientRequestError(
                'CONNECTION_CLOSED',
                `The engine closed the connection while answering ${method} ${path}. The command may or may not have taken effect.`
              )
            )
          })
        }
      )
      req.on('error', (error: unknown) => {
        if (isConnectionLost(error)) {
          reject(
            new ClientRequestError(
              'CONNECTION_CLOSED',
              `The engine closed the connection before answering ${method} ${path}. The command may or may not have taken effect.`
            )
          )
          return
        }
        reject(error)
      })
      req.on('timeout', () => {
        req.destroy(
          new ClientRequestError(
            'REQUEST_TIMEOUT',
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
    //
    // Without the first-response hook, though. `openStream` resolves when
    // the stream *ends*, and the usual reason it ends is that the engine
    // went away — `engine-stop`, or the idle shutdown — so running the hook
    // there sent `/engine/status` at a socket with nothing on it and
    // `onConnectFail` spawned a replacement daemon to read a locale. The
    // warning is also useless to `subscribe`, which can only hear it once
    // its stream is over.
    await this.withEngine(
      async () => {
        await this.openStream(path, onEvent, opts)
      },
      { firstResponseHook: false }
    )
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
                  // One cleaner, not `cleaner(JSON.parse(raw))`: the parsed
                  // value is not used for anything else here. The one
                  // `JSON.parse` this file keeps outside a cleaner is in
                  // `sendRequest`, where a single parse feeds both the
                  // envelope and the success payload — a line number would
                  // move with every edit above it, which is how this
                  // sentence came to point at the wrong one.
                  const envelope = asJSON(asApiErrorBody)(raw)
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
            // The pair, as both siblings in this file register it. A
            // response destroyed mid-stream does emit `'error'` after
            // `'aborted'` on this Node, so the promise settled either way —
            // but with the bare word `aborted`, for the case `subscribe`
            // meets most: an engine killed, a container stopped, a laptop
            // slept.
            res.on('aborted', () => {
              reject(
                new Error(
                  `The engine closed the connection while streaming GET ${path}.`
                )
              )
            })
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
