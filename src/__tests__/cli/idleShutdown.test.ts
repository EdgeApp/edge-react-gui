import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { IdleShutdown } from '../../cli/engine/idleShutdown'

/**
 * The third async engine component, and the one with no unit test.
 *
 * Counts are injected, so each case drives the exact state the engine would
 * be in without needing a core, a socket or a session.
 */
function makeIdle(opts: {
  seconds?: number
  sessions?: number
  subscribers?: number
  handles?: number
}): {
  idle: IdleShutdown
  onFire: jest.Mock<() => void>
  setSessions: (n: number) => void
  setSubscribers: (n: number) => void
  setHandles: (n: number) => void
} {
  let sessions = opts.sessions ?? 0
  let subscribers = opts.subscribers ?? 0
  let handles = opts.handles ?? 0
  const onFire = jest.fn<() => void>()
  const idle = new IdleShutdown({
    idleTimeoutSeconds: opts.seconds ?? 60,
    getSessionCount: () => sessions,
    getSubscriberCount: () => subscribers,
    getSessionlessHandleCount: () => handles,
    onFire
  })
  return {
    idle,
    onFire,
    setSessions: (n: number) => {
      sessions = n
    },
    setSubscribers: (n: number) => {
      subscribers = n
    },
    setHandles: (n: number) => {
      handles = n
    }
  }
}

describe('IdleShutdown', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('fires once the idle window passes with nothing holding it', async () => {
    const { idle, onFire } = makeIdle({ seconds: 60 })
    await jest.advanceTimersByTimeAsync(59_000)
    expect(onFire).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(2_000)
    expect(onFire).toHaveBeenCalledTimes(1)
    idle.stop()
  })

  it('never fires with the timeout disabled', async () => {
    const { idle, onFire } = makeIdle({ seconds: 0 })
    expect(idle.idleShutdownAt).toBeNull()
    await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000)
    expect(onFire).not.toHaveBeenCalled()
    idle.stop()
  })

  it('is held open by a logged-in session', async () => {
    const { idle, onFire, setSessions } = makeIdle({ seconds: 60 })
    setSessions(1)
    idle.notifySessionsChanged()
    expect(idle.idleShutdownAt).toBeNull()
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(onFire).not.toHaveBeenCalled()

    // The last logout re-arms it, rather than leaving the engine lingering
    // until the next request.
    setSessions(0)
    idle.notifySessionsChanged()
    expect(idle.idleShutdownAt).not.toBeNull()
    await jest.advanceTimersByTimeAsync(61_000)
    expect(onFire).toHaveBeenCalledTimes(1)
    idle.stop()
  })

  it('is held open by a subscriber and re-arms when the last one leaves', async () => {
    const { idle, onFire, setSubscribers } = makeIdle({ seconds: 60 })
    setSubscribers(1)
    idle.notifySubscribersChanged()
    // The documented contract: a subscription holds the *engine* open even
    // with no account logged in, because the stream would die under it.
    expect(idle.idleShutdownAt).toBeNull()
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(onFire).not.toHaveBeenCalled()

    setSubscribers(0)
    idle.notifySubscribersChanged()
    expect(idle.idleShutdownAt).not.toBeNull()
    await jest.advanceTimersByTimeAsync(61_000)
    expect(onFire).toHaveBeenCalledTimes(1)
    idle.stop()
  })

  it('is held open by an in-flight request past the window', async () => {
    const { idle, onFire } = makeIdle({ seconds: 60 })
    idle.beginRequest()
    expect(idle.requestsInFlight).toBe(1)
    // A cold login or a `resync-blockchain` outlives the idle timeout, and
    // shutting down underneath it left the client holding a destroyed socket.
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(onFire).not.toHaveBeenCalled()

    idle.endRequest()
    expect(idle.requestsInFlight).toBe(0)
    await jest.advanceTimersByTimeAsync(61_000)
    expect(onFire).toHaveBeenCalledTimes(1)
    idle.stop()
  })

  it('is held open by a pending login that has no session', async () => {
    const { idle, onFire, setHandles } = makeIdle({ seconds: 60 })
    setHandles(1)
    idle.notifyHandlesChanged()
    // `request-edge-login --no-wait` prints a lobby and exits, leaving no
    // session and no subscriber; the handle's TTL is exactly the default idle
    // timeout, so the engine used to shut down under the QR code.
    expect(idle.idleShutdownAt).toBeNull()
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(onFire).not.toHaveBeenCalled()

    setHandles(0)
    idle.notifyHandlesChanged()
    await jest.advanceTimersByTimeAsync(61_000)
    expect(onFire).toHaveBeenCalledTimes(1)
    idle.stop()
  })

  it('reports an in-flight request without hiding its own shutdown time', () => {
    const { idle } = makeIdle({ seconds: 60 })
    idle.beginRequest()
    // `idleShutdownAt` deliberately ignores in-flight requests: the request
    // asking for the shutdown time is itself in flight.
    expect(idle.idleShutdownAt).not.toBeNull()
    idle.endRequest()
    idle.stop()
  })

  it('applies a new timeout immediately', async () => {
    const { idle, onFire } = makeIdle({ seconds: 600 })
    idle.setTimeoutSeconds(30)
    await jest.advanceTimersByTimeAsync(31_000)
    expect(onFire).toHaveBeenCalledTimes(1)
    idle.stop()
  })

  it('stop disarms it for good', async () => {
    const { idle, onFire } = makeIdle({ seconds: 60 })
    idle.stop()
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(onFire).not.toHaveBeenCalled()
  })

  it('re-arms when its own fire rejects, and says so once', async () => {
    // The asymmetry this covers: three of the four shutdown triggers
    // routed a rejection to `onShutdownFailure` and the idle one — the
    // only one that runs unattended, on every engine, by default —
    // discarded it here. `fire` clears `shuttingDown`, re-arms, and
    // rethrows into `reset`'s own `catch`, which is one warn line. Every
    // case in this suite used a resolving `jest.fn`, so nothing drove it.
    const warnings: string[] = []
    let calls = 0
    const idle = new IdleShutdown({
      idleTimeoutSeconds: 60,
      getSessionCount: () => 0,
      onFire: async () => {
        ++calls
        throw new Error('removeRunArtifacts: EACCES')
      },
      report: {
        warn: (message: string) => {
          warnings.push(message)
        },
        error: () => {}
      }
    })
    try {
      await jest.advanceTimersByTimeAsync(61_000)
      expect(calls).toBe(1)
      expect(warnings.join('\n')).toContain('idle shutdown failed')

      // Re-armed rather than latched, so a transient failure gets another
      // go — and the engine is not left believing it is shutting down.
      await jest.advanceTimersByTimeAsync(61_000)
      expect(calls).toBe(2)
    } finally {
      idle.stop()
    }
  })

  it('stays disarmed through the teardown its own caller performs', async () => {
    // `shutdown()` calls `stop()` and then tears the engine down, and the
    // teardown reports itself: `objects.clearAll()`, `sessions.logoutAll()`
    // and `events.closeAll()` each notify. Advancing without notifying is
    // what let the case above pass while the timer re-armed in production.
    const { idle, onFire, setSessions, setSubscribers, setHandles } = makeIdle({
      seconds: 60,
      sessions: 1,
      subscribers: 1,
      handles: 1
    })
    idle.stop()

    setHandles(0)
    idle.notifyHandlesChanged()
    setSessions(0)
    idle.notifySessionsChanged()
    setSubscribers(0)
    idle.notifySubscribersChanged()
    idle.touch()
    idle.endRequest()
    idle.setTimeoutSeconds(60)

    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(onFire).not.toHaveBeenCalled()
  })

  it('touch pushes the window out', async () => {
    const { idle, onFire } = makeIdle({ seconds: 60 })
    await jest.advanceTimersByTimeAsync(50_000)
    idle.touch()
    await jest.advanceTimersByTimeAsync(50_000)
    expect(onFire).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(11_000)
    expect(onFire).toHaveBeenCalledTimes(1)
    idle.stop()
  })
})
