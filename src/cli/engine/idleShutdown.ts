/**
 * Engine self-shutdown after idle with no logged-in accounts.
 * Default: 300 seconds (5 minutes). Set 0 to disable.
 */
export class IdleShutdown {
  private idleTimeoutMs: number
  private timer: ReturnType<typeof setTimeout> | null = null
  private lastActivityAt = Date.now()
  private readonly onFire: () => void | Promise<void>
  private readonly getSessionCount: () => number
  private shuttingDown = false

  constructor(opts: {
    idleTimeoutSeconds: number
    getSessionCount: () => number
    onFire: () => void | Promise<void>
  }) {
    this.idleTimeoutMs = opts.idleTimeoutSeconds * 1000
    this.getSessionCount = opts.getSessionCount
    this.onFire = opts.onFire
    this.reset()
  }

  get idleShutdownAt(): string | null {
    if (this.idleTimeoutMs === 0) return null
    if (this.getSessionCount() > 0) return null
    return new Date(this.lastActivityAt + this.idleTimeoutMs).toISOString()
  }

  touch(): void {
    this.lastActivityAt = Date.now()
    this.reset()
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
    if (this.getSessionCount() > 0) return
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
    if (this.getSessionCount() > 0) {
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
