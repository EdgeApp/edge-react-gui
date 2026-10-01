import type { ServerResponse } from 'http'

import { API_VERSION } from './apiVersion'
import { stringifyJson } from './json'
import { redactSessionId } from './sessions'

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
  /**
   * Event types this client asked for, or undefined for all of them.
   *
   * Filtering client-side only meant a caller who wanted one event type
   * still received the whole `core.log` firehose over the socket and threw
   * it away — and `write` destroys any client more than
   * MAX_SSE_BUFFER_BYTES behind, so a slow consumer was dropped for volume
   * it had explicitly asked not to receive.
   */
  types?: Set<string>
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

  /**
   * Write one already-serialised frame to one client.
   *
   * The frame arrives built, because `emit` builds it once: serialising
   * inside here meant N subscribers serialised the identical payload N
   * times. The per-client `types` test stays here, before the write, which
   * is the whole point of filtering at the transport.
   */
  private write(client: SseClient, event: string, frame: string): boolean {
    const { res } = client
    if (res.writableEnded || res.destroyed) return false
    // `subscription.closed` always goes through: a client that filtered it
    // out would never learn why its stream ended.
    if (
      client.types != null &&
      !client.types.has(event) &&
      event !== 'subscription.closed'
    ) {
      return true
    }
    if (res.writableLength > MAX_SSE_BUFFER_BYTES) {
      res.destroy()
      return false
    }

    try {
      res.write(frame)
      return true
    } catch {
      // Cannot write to *this socket*: the client really is gone.
      return false
    }
  }

  /**
   * One SSE frame, or null when the payload cannot be serialised.
   *
   * `stringifyJson`, not bare `JSON.stringify`: it is the encoding every
   * REST response uses, so a `Uint8Array` is base64 and a `Map` is an object
   * on both transports. No frame carries either today, which is why this was
   * invisible — the next one would have serialised a Uint8Array as
   * {"0":1,…} on the stream and base64 over REST.
   */
  private buildFrame(event: string, data: unknown): string | null {
    try {
      return `event: ${event}\ndata: ${stringifyJson(data)}\n\n`
    } catch (error: unknown) {
      // Cannot serialise *this event*. Every client is fine, and dropping
      // them here disconnected every subscriber over one bad payload.
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`[edge-engine] cannot serialise event ${event}: ${message}`)
      return null
    }
  }

  emit(event: string, data: unknown, scope?: SubscriptionScope): void {
    // Nothing is listening, so nothing below can have an effect. `core.log`
    // is a firehose — around 8 MB an hour — and every one of those used to
    // pay an array allocation for the client spread and an object literal
    // for the payload with zero listeners and zero clients.
    if (this.listeners.size === 0 && this.clients.size === 0) return

    for (const listener of this.listeners) {
      try {
        listener(event, data)
      } catch {
        // ignore
      }
    }
    if (this.clients.size === 0) return

    const frame = this.buildFrame(event, data)
    if (frame == null) return

    for (const client of [...this.clients]) {
      if (scope != null && !scopeMatches(client.scope, scope)) continue
      if (!this.write(client, event, frame)) {
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
    scope: SubscriptionScope = { kind: 'context' },
    types?: Set<string>
  ): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Edge-Api-Version': API_VERSION
    })
    res.write(': ok\n\n')
    const client: SseClient = { res, scope, types }
    this.clients.add(client)
    this.clientsChanged()
    res.on('close', () => {
      if (this.clients.delete(client)) this.clientsChanged()
    })
  }

  /**
   * Keep each stream warm, and notice a subscriber that vanished.
   *
   * A stream is written to only when an event fires, and liveness was
   * detected solely through `res.on('close')` — which a clean FIN produces
   * and a sleeping laptop, a killed container or a dropped link do not. Such
   * a client was never reaped: `clientCount` stayed non-zero, so
   * `heldByClients` stayed true and the daemon held its `EdgeContext` and
   * every plugin's polling open indefinitely. A comment frame costs nothing
   * and surfaces the write failure, which the drop path below already
   * handles.
   */
  pingClients(): void {
    for (const client of [...this.clients]) {
      const { res } = client
      let alive = !res.writableEnded && !res.destroyed
      if (alive) {
        try {
          res.write(': ping\n\n')
        } catch {
          alive = false
        }
      }
      if (!alive) {
        if (this.clients.delete(client)) this.clientsChanged()
      }
    }
  }

  /**
   * End every subscription that depends on this session, so an auto-logout
   * cannot leave a stream reading an account that no longer exists. Context
   * subscriptions are untouched.
   */
  closeScope(sessionId: string, reason: string): void {
    const frame = this.buildFrame('subscription.closed', {
      reason,
      sessionId: redactSessionId(sessionId)
    })
    if (frame == null) return
    for (const client of [...this.clients]) {
      if (client.scope.kind === 'context') continue
      if (client.scope.sessionId !== sessionId) continue
      this.write(client, 'subscription.closed', frame)
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
    const frame = this.buildFrame('subscription.closed', { reason })
    if (frame == null) return
    for (const client of [...this.clients]) {
      this.write(client, 'subscription.closed', frame)
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
