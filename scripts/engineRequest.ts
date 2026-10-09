/**
 * One raw HTTP client for the test scripts.
 *
 * `testCliCaptcha` and `testEdgeLogin` each carried a byte-identical
 * forty-line copy of this, and `testCli` a third variant. They need the raw
 * status and body — `ApiClient` throws on a 4xx, which is exactly what these
 * scripts are asserting — so they cannot simply use the client; one copy
 * here is the next best thing.
 *
 * It takes a *target*, because taking only a `socketPath` is what made the
 * TCP probes hand-rolled again: five of them, and the copies had already
 * diverged in the one way this module documents fixing — `rawPost` and the
 * `/engine/status` probe in `testCliSubscribe` carried neither
 * `res.on('error')` nor `res.on('aborted')` nor a `timeout`, so in the
 * *offline* suite an engine that accepted the connection and died mid-answer
 * hung `npm run test:cli:offline` in `precommit:cli` and in Travis instead
 * of failing a check.
 */
import http from 'http'

export interface RawResponse {
  status: number
  json: any
}

/** The same, before the body is parsed, for a case asserting on raw text. */
export interface RawTextResponse {
  status: number
  raw: string
}

/** Where a request goes: the engine's unix socket, or its TCP listener. */
export type EngineTarget =
  | string
  | { socketPath: string }
  | { host: string; port: number }

/**
 * The deadline every request here gets.
 *
 * Generous, because `testCli.ts` and `testEdgeLogin.ts` drive real login and
 * rates servers over the network, but finite: these scripts provoke an engine
 * that stops mid-answer, and a hang means `npm run test:cli:*` stops
 * producing a result rather than producing a bad one.
 */
const REQUEST_TIMEOUT_MS = 120_000

function optionsFor(target: EngineTarget): http.RequestOptions {
  if (typeof target === 'string') return { socketPath: target }
  return 'socketPath' in target
    ? { socketPath: target.socketPath }
    : { host: target.host, port: target.port }
}

/**
 * One request, answered with the raw body text.
 *
 * Rejects on a transport failure, a response that ends without `end`, and the
 * deadline. A caller that would rather record the failure than stop — the
 * refusal cases in `testCliSubscribe`, which are all about a request the
 * engine *refuses* — catches it and reports.
 */
export async function rawRequest(
  target: EngineTarget,
  method: string,
  urlPath: string,
  opts: {
    body?: unknown
    /**
     * A body to send verbatim, for a case asserting on the engine's parse.
     *
     * `body` is stringified; this is not, so a suite can send `'{'` or a
     * payload under a `Content-Type` the engine is meant to refuse.
     */
    rawBody?: string
    headers?: Record<string, string>
    timeoutMs?: number
  } = {}
): Promise<RawTextResponse> {
  const payload =
    opts.rawBody !== undefined
      ? Buffer.from(opts.rawBody)
      : opts.body === undefined
      ? undefined
      : Buffer.from(JSON.stringify(opts.body))
  const timeout = opts.timeoutMs ?? REQUEST_TIMEOUT_MS
  return await new Promise((resolve, reject) => {
    const req = http.request(
      {
        ...optionsFor(target),
        method,
        path: urlPath,
        timeout,
        headers: {
          Accept: 'application/json',
          ...(payload != null
            ? {
                'Content-Type': 'application/json',
                'Content-Length': String(payload.length)
              }
            : {}),
          ...opts.headers
        }
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        // An engine that dies while answering ends the response without
        // `end`, which left this promise unsettled for ever.
        res.on('error', reject)
        res.on('aborted', () => {
          reject(new Error(`${method} ${urlPath}: response aborted`))
        })
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            raw: Buffer.concat(chunks).toString('utf8')
          })
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      // `timeout` does not destroy the socket on its own, so without this the
      // request stays open and the promise never settles.
      req.destroy(
        new Error(`${method} ${urlPath}: no response in ${timeout}ms`)
      )
    })
    if (payload != null) req.write(payload)
    req.end()
  })
}

/** The same request, with the body parsed. A body that is not JSON rejects. */
export async function engineRequest(
  target: EngineTarget,
  method: string,
  urlPath: string,
  body?: unknown,
  opts: { headers?: Record<string, string>; timeoutMs?: number } = {}
): Promise<RawResponse> {
  const { status, raw } = await rawRequest(target, method, urlPath, {
    body,
    headers: opts.headers,
    timeoutMs: opts.timeoutMs
  })
  try {
    return { status, json: raw === '' ? undefined : JSON.parse(raw) }
  } catch {
    throw new Error(
      `${method} ${urlPath}: ${status} with a body ` +
        `that is not JSON: ${raw.slice(0, 200)}`
    )
  }
}
