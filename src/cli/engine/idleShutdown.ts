/**
 * Engine self-shutdown once nothing is holding it open.
 *
 * Four things hold it: a logged-in session, a live subscription, a request
 * being served, and an object handle that belongs to no session. Default:
 * 300 seconds (5 minutes). Set 0 to disable.
 *
 * A subscription holds the engine open even with no account logged in — the
 * stream would otherwise die under the subscriber. An in-flight request does
 * too, which is what `beginRequest` exists for: a cold login or a
 * `resync-blockchain` can outlive the window. A sessionless handle is the
 * pending edge login, whose own TTL equals the default timeout. The account
 * auto-logout timer is separate and is *not* held off by any of them.
 */
export class IdleShutdown {
  private idleTimeoutMs: number
  private timer: ReturnType<typeof setTimeout> | null = null
  private lastActivityAt = Date.now()
  private readonly onFire: () => void | Promise<void>
  private readonly getSessionCount: () => number
  private readonly getSubscriberCount: () => number
  private readonly getSessionlessHandleCount: () => number
  private shuttingDown = false

  constructor(opts: {
    idleTimeoutSeconds: number
    getSessionCount: () => number
    getSubscriberCount?: () => number
    getSessionlessHandleCount?: () => number
    onFire: () => void | Promise<void>
  }) {
    this.idleTimeoutMs = opts.idleTimeoutSeconds * 1000
    this.getSessionCount = opts.getSessionCount
    this.getSubscriberCount = opts.getSubscriberCount ?? (() => 0)
    this.getSessionlessHandleCount = opts.getSessionlessHandleCount ?? (() => 0)
    this.onFire = opts.onFire
    this.reset()
  }

  /** Requests currently being served. */
  private inFlight = 0

  /**
   * How many requests are being served right now.
   *
   * Shutdown reads this: the idle path already refuses to fire while a
   * request is open, and `engine-stop` and SIGINT have to refuse too.
   */
  get requestsInFlight(): number {
    return this.inFlight
  }

  /**
   * True while a client is deliberately keeping the engine alive.
   *
   * Reported to callers, so it deliberately excludes in-flight requests: the
   * request asking for the shutdown time is itself in flight, and by the time
   * the answer is read it is not.
   */
  private get heldByClients(): boolean {
    return (
      this.getSessionCount() > 0 ||
      this.getSubscriberCount() > 0 ||
      // A pending edge login holds no session and its TTL equals the default
      // idle timeout, so without this the engine shut down under a lobby the
      // user was still showing a QR code for.
      this.getSessionlessHandleCount() > 0
    )
  }

  /** True while anything at all should keep the timer disarmed. */
  private get held(): boolean {
    return this.inFlight > 0 || this.heldByClients
  }

  /**
   * Hold the engine open for the duration of one request.
   *
   * `touch` only records when a request *started*, so a call that outlives the
   * idle timeout — a cold login, `wait-for-all-wallets`, `resync-blockchain` —
   * could be shut down underneath itself, and the client saw a destroyed
   * socket rather than a result or an error. Pre-login calls hold nothing
   * else: there is no session or subscriber to keep the timer disarmed.
   */
  beginRequest(): void {
    this.inFlight++
    this.reset()
  }

  endRequest(): void {
    if (this.inFlight > 0) this.inFlight--
    this.lastActivityAt = Date.now()
    this.reset()
  }

  get idleShutdownAt(): string | null {
    if (this.idleTimeoutMs === 0) return null
    if (this.heldByClients) return null
    return new Date(this.lastActivityAt + this.idleTimeoutMs).toISOString()
  }

  touch(): void {
    this.lastActivityAt = Date.now()
    this.reset()
  }

  /**
   * Re-evaluate the timer after a login or logout. Without this the engine
   * disarms itself while an account is logged in and never re-arms when the
   * last session goes away, so it would linger until the next request.
   */
  notifySessionsChanged(): void {
    if (this.shuttingDown) return
    this.touch()
  }

  /**
   * Re-evaluate after a subscriber attaches or detaches. Without this the
   * engine would stay disarmed after the last subscriber left.
   */
  notifySubscribersChanged(): void {
    if (this.shuttingDown) return
    this.touch()
  }

  /** Re-evaluate after a handle is created or released. */
  notifyHandlesChanged(): void {
    if (this.shuttingDown) return
    this.touch()
  }

  setTimeoutSeconds(seconds: number): void {
    this.idleTimeoutMs = seconds * 1000
    this.reset()
  }

  stop(): void {
    if (this.timer != null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private reset(): void {
    this.stop()
    if (this.idleTimeoutMs === 0) return
    if (this.held) return
    this.timer = setTimeout(() => {
      this.fire().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`[edge-engine] idle shutdown failed: ${message}`)
      })
    }, this.idleTimeoutMs)
    this.timer.unref?.()
  }

  private async fire(): Promise<void> {
    if (this.shuttingDown) return
    if (this.held) {
      this.reset()
      return
    }
    this.shuttingDown = true
    try {
      await this.onFire()
    } catch (error: unknown) {
      this.shuttingDown = false
      this.reset()
      throw error
    }
  }
}
