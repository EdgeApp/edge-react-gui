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
  /** Bearer token from the run file; required by the engine's TCP listener. */
  token?: string | null
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
    if (this.opts.token != null && this.opts.token !== '') {
      headers.Authorization = `Bearer ${this.opts.token}`
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
