import http from 'http'

import { stringifyJson } from '../engine/json'

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    status: number
    details?: Record<string, unknown>
  }
}

export class ApiClientError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(body: ApiErrorBody['error']) {
    super(body.message)
    this.name = 'ApiClientError'
    this.status = body.status
    this.code = body.code
    this.details = body.details
  }
}

export interface ApiClientOptions {
  socketPath?: string
  host?: string
  port?: number
  timeoutMs?: number
}

export class ApiClient {
  private readonly opts: ApiClientOptions

  constructor(opts: ApiClientOptions) {
    this.opts = opts
  }

  async request<T = unknown>(
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
          ...(this.opts.socketPath != null
            ? { socketPath: this.opts.socketPath }
            : {
                host: this.opts.host ?? '127.0.0.1',
                port: this.opts.port ?? 9008
              }),
          timeout: this.opts.timeoutMs ?? 120_000
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
        }
      )
      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy(new Error('Request timed out'))
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

    if (
      response.status >= 400 &&
      parsed != null &&
      typeof parsed === 'object' &&
      'error' in parsed
    ) {
      throw new ApiClientError((parsed as ApiErrorBody).error)
    }

    if (response.status >= 400) {
      throw new ApiClientError({
        code: 'INTERNAL_ERROR',
        message: `HTTP ${response.status}`,
        status: response.status,
        details: parsed as Record<string, unknown>
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
    await new Promise<void>((resolve, reject) => {
      const req = http.request(
        {
          socketPath: this.opts.socketPath,
          host: this.opts.host,
          port: this.opts.port,
          method: 'GET',
          path,
          headers: { Accept: 'text/event-stream' }
        },
        res => {
          if (res.statusCode != null && res.statusCode >= 400) {
            let raw = ''
            res.setEncoding('utf8')
            res.on('data', chunk => (raw += chunk))
            res.on('end', () => {
              try {
                const parsed = JSON.parse(raw) as ApiErrorBody
                reject(new ApiClientError(parsed.error))
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
      opts.signal?.addEventListener('abort', () => {
        req.destroy()
        resolve()
      })
      req.end()
    })
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
