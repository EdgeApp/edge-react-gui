import type { IncomingMessage, ServerResponse } from 'http'

import { engineError } from './errors'
import type { EventHub } from './events'
import type { IdleShutdown } from './idleShutdown'
import type { EngineLogger } from './logger'
import type { CoreContextBundle } from './makeCoreContext'
import type { ObjectHandleStore } from './objectHandles'
import type { SessionStore } from './sessions'

export const API_VERSION = '1.0.0'

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

export interface Route {
  method: string
  pattern: string
  handler: RouteHandler
}

interface CompiledRoute {
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
    const m = method.toUpperCase()
    for (const route of this.routes) {
      if (route.method !== m) continue
      const match = route.regex.exec(pathname)
      if (match == null) continue
      const params: Record<string, string> = {}
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1])
      })
      return { handler: route.handler, params }
    }
    return null
  }
}

export function requireBodyObject(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    throw engineError('BAD_REQUEST', 'JSON object body required', 400)
  }
  return body as Record<string, unknown>
}
