import { describe, expect, it, jest } from '@jest/globals'
import type { ServerResponse } from 'http'

import { EventHub } from '../../cli/engine/events'

/** Just enough of a `ServerResponse` for the hub to write to. */
function makeClient(opts: { writableLength?: number } = {}): {
  res: ServerResponse
  frames: string[]
  destroyed: () => boolean
  close: () => void
} {
  const frames: string[] = []
  let destroyed = false
  let onClose: (() => void) | undefined
  const res = {
    writeHead: () => {},
    write: (frame: string) => {
      frames.push(frame)
      return true
    },
    end: () => {},
    destroy: () => {
      destroyed = true
    },
    get writableLength() {
      return opts.writableLength ?? 0
    },
    writableEnded: false,
    destroyed: false,
    on: (event: string, handler: () => void) => {
      if (event === 'close') onClose = handler
    }
  } as unknown as ServerResponse
  return {
    res,
    frames,
    destroyed: () => destroyed,
    close: () => onClose?.()
  }
}

/** The data payload of one SSE frame. */
function payloadOf(frame: string): any {
  const line = frame.split('\n').find(l => l.startsWith('data: '))
  return JSON.parse((line ?? '').slice('data: '.length))
}

describe('EventHub', () => {
  it('sends a filtered client only the types it asked for', () => {
    const hub = new EventHub()
    const client = makeClient()
    hub.addSseClient(client.res, { kind: 'context' }, new Set(['core.log']))
    client.frames.length = 0

    hub.emit('core.log', { message: 'kept' })
    hub.emit('session.created', { sessionId: 'dropped' })
    expect(client.frames).toHaveLength(1)
    expect(payloadOf(client.frames[0])).toStrictEqual({ message: 'kept' })
  })

  it('always sends subscription.closed to a filtered client', () => {
    const hub = new EventHub()
    const client = makeClient()
    hub.addSseClient(client.res, { kind: 'context' }, new Set(['core.log']))
    client.frames.length = 0

    // Without the exemption a filtering client would never learn why its
    // stream ended.
    hub.closeAll('engineShutdown')
    expect(client.frames).toHaveLength(1)
    expect(payloadOf(client.frames[0])).toStrictEqual({
      reason: 'engineShutdown'
    })
  })

  it('drops a client that is too far behind, and says so', () => {
    const hub = new EventHub()
    const changed = jest.fn<() => void>()
    hub.onClientsChanged = changed
    // Past MAX_SSE_BUFFER_BYTES: a consumer this slow is the reason the
    // `--type` filter moved to the transport in the first place.
    const client = makeClient({ writableLength: 2 * 1024 * 1024 })
    hub.addSseClient(client.res, { kind: 'context' })
    changed.mockClear()

    hub.emit('core.log', { message: 'x' })
    expect(client.destroyed()).toBe(true)
    expect(hub.clientCount).toBe(0)
    expect(changed).toHaveBeenCalled()
  })

  it('keeps every client when one payload cannot be serialised', () => {
    const hub = new EventHub()
    const a = makeClient()
    const b = makeClient()
    hub.addSseClient(a.res, { kind: 'context' })
    hub.addSseClient(b.res, { kind: 'context' })
    a.frames.length = 0
    b.frames.length = 0

    const circular: any = {}
    circular.self = circular
    hub.emit('core.log', circular)
    // One bad payload used to disconnect every subscriber.
    expect(hub.clientCount).toBe(2)
    expect(a.frames).toHaveLength(0)

    hub.emit('core.log', { message: 'after' })
    expect(a.frames).toHaveLength(1)
    expect(b.frames).toHaveLength(1)
  })

  it('scopes a session event to that session', () => {
    const hub = new EventHub()
    const mine = makeClient()
    const other = makeClient()
    const context = makeClient()
    hub.addSseClient(mine.res, { kind: 'session', sessionId: 'sess_a' })
    hub.addSseClient(other.res, { kind: 'session', sessionId: 'sess_b' })
    hub.addSseClient(context.res, { kind: 'context' })
    for (const c of [mine, other, context]) c.frames.length = 0

    hub.emit(
      'session.created',
      { sessionId: 'sess_a…' },
      { kind: 'session', sessionId: 'sess_a' }
    )
    // A stream opened against one account used to receive another account's
    // username and session prefix.
    expect(mine.frames).toHaveLength(1)
    expect(other.frames).toHaveLength(0)
    // A context stream is broader than any session, so it still sees it.
    expect(context.frames).toHaveLength(1)
  })

  // The whole scope matrix, because the wallet row was the one never run and
  // it was wrong: a `?walletId=` stream used to drop `session.created` and
  // `session.expired` — the two account events a session-scoped stream exists
  // to carry — in exchange for narrowing a set of wallet-scoped events that
  // is still empty.
  it('delivers each scope of event to every scope of client', () => {
    const hub = new EventHub()
    const context = makeClient()
    const session = makeClient()
    const wallet = makeClient()
    const otherWallet = makeClient()
    hub.addSseClient(context.res, { kind: 'context' })
    hub.addSseClient(session.res, { kind: 'session', sessionId: 'sess_a' })
    hub.addSseClient(wallet.res, {
      kind: 'wallet',
      sessionId: 'sess_a',
      walletId: 'wal_1'
    })
    hub.addSseClient(otherWallet.res, {
      kind: 'wallet',
      sessionId: 'sess_a',
      walletId: 'wal_2'
    })
    const all = [context, session, wallet, otherWallet]
    const reset = (): void => {
      for (const c of all) c.frames.length = 0
    }
    const counts = (): number[] => all.map(c => c.frames.length)

    // Unscoped: every client, because `emit` skips the filter entirely.
    reset()
    hub.emit('core.log', { message: 'x' })
    expect(counts()).toStrictEqual([1, 1, 1, 1])

    // Context-scoped: only a context client is that broad.
    reset()
    hub.emit('engine.shutdown', { reason: 'idle' }, { kind: 'context' })
    expect(counts()).toStrictEqual([1, 0, 0, 0])

    // Session-scoped: context, the session, and both of its wallet streams.
    reset()
    hub.emit('session.created', {}, { kind: 'session', sessionId: 'sess_a' })
    expect(counts()).toStrictEqual([1, 1, 1, 1])

    // Another account's session event reaches only the context stream.
    reset()
    hub.emit('session.created', {}, { kind: 'session', sessionId: 'sess_b' })
    expect(counts()).toStrictEqual([1, 0, 0, 0])

    // Wallet-scoped: context, the session, and the one matching wallet. No
    // emitter produces this scope yet, which is why it needs a test.
    reset()
    hub.emit(
      'wallet.changed',
      {},
      { kind: 'wallet', sessionId: 'sess_a', walletId: 'wal_1' }
    )
    expect(counts()).toStrictEqual([1, 1, 1, 0])
  })

  it('closes every stream of a session, whatever its wallet scope', () => {
    const hub = new EventHub()
    const session = makeClient()
    const wallet = makeClient()
    const context = makeClient()
    hub.addSseClient(session.res, { kind: 'session', sessionId: 'sess_a' })
    hub.addSseClient(wallet.res, {
      kind: 'wallet',
      sessionId: 'sess_a',
      walletId: 'wal_1'
    })
    hub.addSseClient(context.res, { kind: 'context' })

    hub.closeScope('sess_a', 'logout')

    // A wallet stream depends on its session, so an auto-logout has to end it
    // too; the context stream outlives every account.
    expect(hub.clientCount).toBe(1)
  })

  it('reaps a client whose write fails on the keepalive', () => {
    const hub = new EventHub()
    const client = makeClient()
    hub.addSseClient(client.res, { kind: 'context' })
    ;(client.res as any).write = () => {
      throw new Error('EPIPE')
    }

    // A subscriber that vanished without a clean FIN never emitted 'close',
    // so it held the engine's EdgeContext open indefinitely.
    hub.pingClients()
    expect(hub.clientCount).toBe(0)
  })

  it('serialises one frame however many clients there are', () => {
    const hub = new EventHub()
    const a = makeClient()
    const b = makeClient()
    hub.addSseClient(a.res, { kind: 'context' })
    hub.addSseClient(b.res, { kind: 'context' })
    a.frames.length = 0
    b.frames.length = 0

    let serialised = 0
    const payload = {
      toJSON: () => {
        serialised++
        return { message: 'once' }
      }
    }
    hub.emit('core.log', payload)
    expect(serialised).toBe(1)
    expect(a.frames).toHaveLength(1)
    expect(b.frames).toHaveLength(1)
  })

  it('does nothing at all with no listeners and no clients', () => {
    const hub = new EventHub()
    let serialised = 0
    hub.emit('core.log', {
      toJSON: () => {
        serialised++
        return {}
      }
    })
    // `core.log` is a firehose, so the no-subscriber case must be free.
    expect(serialised).toBe(0)
  })
})
