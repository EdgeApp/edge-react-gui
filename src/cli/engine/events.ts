import type { ServerResponse } from 'http'

type Listener = (event: string, data: unknown) => void

/**
 * Drop an SSE client once this much data is queued for it. A subscriber that
 * stops reading would otherwise grow the engine's heap without bound.
 */
const MAX_SSE_BUFFER_BYTES = 1024 * 1024

/**
 * What a subscription depends on, which decides when it has to die.
 *
 * The `EdgeContext` outlives every account, so `context` streams survive
 * logout. Anything reading an account or a wallet cannot outlive the session
 * that owns it, and is torn down when that session goes away.
 */
export type SubscriptionScope =
  | { kind: 'context' }
  | { kind: 'session'; sessionId: string }
  | { kind: 'wallet'; sessionId: string; walletId: string }

interface SseClient {
  res: ServerResponse
  scope: SubscriptionScope
}

/** Simple SSE hub. Clients connect via GET /engine/events. */
export class EventHub {
  private readonly listeners = new Set<Listener>()
  private readonly clients = new Set<SseClient>()

  /**
   * Notified whenever a subscriber attaches or detaches, so the idle timer can
   * re-arm once the last one leaves.
   */
  onClientsChanged: (() => void) | null = null

  /** Live subscriber count. The idle timer holds off while this is non-zero. */
  get clientCount(): number {
    return this.clients.size
  }

  private clientsChanged(): void {
    try {
      this.onClientsChanged?.()
    } catch {
      // A listener must never break subscribe or logout.
    }
  }

  private write(client: SseClient, event: string, data: unknown): boolean {
    const { res } = client
    if (res.writableEnded || res.destroyed) return false
    if (res.writableLength > MAX_SSE_BUFFER_BYTES) {
      res.destroy()
      return false
    }
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      return true
    } catch {
      return false
    }
  }

  emit(event: string, data: unknown, scope?: SubscriptionScope): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data)
      } catch {
        // ignore
      }
    }
    for (const client of [...this.clients]) {
      if (scope != null && !scopeMatches(client.scope, scope)) continue
      if (!this.write(client, event, data)) {
        this.clients.delete(client)
        this.clientsChanged()
      }
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  addSseClient(
    res: ServerResponse,
    scope: SubscriptionScope = { kind: 'context' }
  ): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Edge-Api-Version': '1.0.0'
    })
    res.write(': ok\n\n')
    const client: SseClient = { res, scope }
    this.clients.add(client)
    this.clientsChanged()
    res.on('close', () => {
      if (this.clients.delete(client)) this.clientsChanged()
    })
  }

  /**
   * End every subscription that depends on this session, so an auto-logout
   * cannot leave a stream reading an account that no longer exists. Context
   * subscriptions are untouched.
   */
  closeScope(sessionId: string, reason: string): void {
    for (const client of [...this.clients]) {
      if (client.scope.kind === 'context') continue
      if (client.scope.sessionId !== sessionId) continue
      this.write(client, 'subscription.closed', { reason, sessionId })
      this.clients.delete(client)
      try {
        client.res.end()
      } catch {
        // best effort
      }
      this.clientsChanged()
    }
  }

  closeAll(reason: string): void {
    for (const client of [...this.clients]) {
      this.write(client, 'subscription.closed', { reason })
      this.clients.delete(client)
      try {
        client.res.end()
      } catch {
        // best effort
      }
    }
    this.clientsChanged()
  }
}

/** A client receives an event when its scope is the event's scope or broader. */
function scopeMatches(
  client: SubscriptionScope,
  event: SubscriptionScope
): boolean {
  if (client.kind === 'context') return true
  if (event.kind === 'context') return false
  if (client.sessionId !== event.sessionId) return false
  if (client.kind === 'session') return true
  return event.kind === 'wallet' && client.walletId === event.walletId
}
