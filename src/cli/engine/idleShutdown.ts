/**
 * Engine self-shutdown after idle with no logged-in accounts and no live
 * subscriptions. Default: 300 seconds (5 minutes). Set 0 to disable.
 *
 * A subscription holds the engine open even with no account logged in — the
 * stream would otherwise die under the subscriber. The account auto-logout
 * timer is separate and is *not* held off by a subscription.
 */
export class IdleShutdown {
  private idleTimeoutMs: number
  private timer: ReturnType<typeof setTimeout> | null = null
  private lastActivityAt = Date.now()
  private readonly onFire: () => void | Promise<void>
  private readonly getSessionCount: () => number
  private readonly getSubscriberCount: () => number
  private shuttingDown = false

  constructor(opts: {
    idleTimeoutSeconds: number
    getSessionCount: () => number
    getSubscriberCount?: () => number
    onFire: () => void | Promise<void>
  }) {
    this.idleTimeoutMs = opts.idleTimeoutSeconds * 1000
    this.getSessionCount = opts.getSessionCount
    this.getSubscriberCount = opts.getSubscriberCount ?? (() => 0)
    this.onFire = opts.onFire
    this.reset()
  }

  /** True while something is keeping the engine deliberately alive. */
  private get held(): boolean {
    return this.getSessionCount() > 0 || this.getSubscriberCount() > 0
  }

  get idleShutdownAt(): string | null {
    if (this.idleTimeoutMs === 0) return null
    if (this.held) return null
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
        console.warn(`[edge-cli] idle shutdown failed: ${message}`)
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
