/**
 * Method and path dispatch, and the shared engine state every route reads.
 *
 * The matching is deliberately small: `{param}` becomes `([^/]+)`, literal
 * segments are escaped, and a parameter is decoded with the failure reported
 * as the caller's rather than the engine's. Anything about what a route
 * *means* — its cleaners, its errors, its prose — lives on the `route()`
 * declaration in `route.ts`.
 */
import type { IncomingMessage, ServerResponse } from 'http'

import { isPlainObject } from '../../util/predicates'
import { engineError } from './errors'
import type { EventHub } from './events'
import type { IdleShutdown } from './idleShutdown'
import type { EngineLogger } from './logger'
import type { CoreContextBundle } from './makeCoreContext'
import type { ObjectHandleStore } from './objectHandles'
import type { SessionStore } from './sessions'

export interface EngineState {
  core: CoreContextBundle
  sessions: SessionStore
  objects: ObjectHandleStore
  events: EventHub
  idle: IdleShutdown
  logger: EngineLogger
  profile: string
  socketPath: string
  tcpPort: number | null
  startedAt: number
  shuttingDown: boolean
  shutdown: () => Promise<void>
  /**
   * Handles a `shutdown()` that rejected.
   *
   * Set by the engine entry. A rejection after `shuttingDown` is set leaves
   * the engine answering 503 forever with its socket still in place, so it
   * has to be reported and the profile released rather than discarded.
   */
  onShutdownFailure: (error: unknown) => void
}

export interface RouteContext {
  state: EngineState
  req: IncomingMessage
  res: ServerResponse
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
}

export type RouteHandler = (ctx: RouteContext) => Promise<unknown> | unknown

export interface CompiledRoute {
  method: string
  regex: RegExp
  keys: string[]
  handler: RouteHandler
}

function compile(pattern: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = []
  const parts = pattern.split('/').map(part => {
    if (part.startsWith('{') && part.endsWith('}')) {
      keys.push(part.slice(1, -1))
      return '([^/]+)'
    }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  })
  return {
    regex: new RegExp('^' + parts.join('/') + '$'),
    keys
  }
}

export class Router {
  private readonly routes: CompiledRoute[] = []

  add(method: string, pattern: string, handler: RouteHandler): void {
    const { regex, keys } = compile(pattern)
    this.routes.push({ method: method.toUpperCase(), regex, keys, handler })
  }

  match(
    method: string,
    pathname: string
  ): { handler: RouteHandler; params: Record<string, string> } | null {
    const upperMethod = method.toUpperCase()
    for (const route of this.routes) {
      if (route.method !== upperMethod) continue
      const match = route.regex.exec(pathname)
      if (match == null) continue
      const params: Record<string, string> = {}
      route.keys.forEach((key, i) => {
        try {
          params[key] = decodeURIComponent(match[i + 1])
        } catch {
          // `new URL()` accepts a malformed percent-escape and
          // `decodeURIComponent` then throws `URIError`, which reached the
          // handler's catch-all as a 500 — a caller's bad URL reported as an
          // engine fault, on routes whose declared errors are 400 and 404.
          throw engineError(
            'BAD_REQUEST',
            `Malformed path parameter "${key}"`,
            400
          )
        }
      })
      return { handler: route.handler, params }
    }
    return null
  }
}

export function requireBodyObject(body: unknown): Record<string, unknown> {
  if (!isPlainObject(body)) {
    throw engineError('BAD_REQUEST', 'JSON object body required', 400)
  }
  return body
}
