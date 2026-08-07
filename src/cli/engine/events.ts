import type { ServerResponse } from 'http'

type Listener = (event: string, data: unknown) => void

/**
 * Drop an SSE client once this much data is queued for it. A subscriber that
 * stops reading would otherwise grow the engine's heap without bound.
 */
const MAX_SSE_BUFFER_BYTES = 1024 * 1024

/**
 * Simple SSE hub. Clients connect via GET /v1/events.
 */
export class EventHub {
  private readonly listeners = new Set<Listener>()
  private readonly responses = new Set<ServerResponse>()

  emit(event: string, data: unknown): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data)
      } catch {
        // ignore
      }
    }
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of this.responses) {
      if (res.writableEnded || res.destroyed) {
        this.responses.delete(res)
        continue
      }
      if (res.writableLength > MAX_SSE_BUFFER_BYTES) {
        this.responses.delete(res)
        res.destroy()
        continue
      }
      try {
        res.write(payload)
      } catch {
        this.responses.delete(res)
      }
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  addSseClient(res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Edge-Api-Version': '1.0.0'
    })
    res.write(': ok\n\n')
    this.responses.add(res)
    res.on('close', () => {
      this.responses.delete(res)
    })
  }
}
