/**
 * Engine file logger — background/core logs go here, not to the CLI user's
 * stdout/stderr. Lifecycle "Ready" lines may still go to stderr for scripts
 * that wait on startup.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'

export class EngineLogger {
  private stream: fs.WriteStream | null = null
  readonly logPath: string

  constructor(profile: string) {
    // Engine logs carry usernames, login ids and core diagnostics, so keep
    // them owner-only rather than at the default umask.
    const dir = path.join(os.homedir(), '.edge-cli', 'logs')
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    this.logPath = path.join(dir, `engine-${profile}.log`)
    this.stream = fs.createWriteStream(this.logPath, {
      flags: 'a',
      mode: 0o600
    })
    try {
      // `mode` only applies on creation, so tighten anything an earlier,
      // laxer run left behind.
      fs.chmodSync(dir, 0o700)
      fs.chmodSync(this.logPath, 0o600)
    } catch {
      // ignore
    }
  }

  write(level: string, message: string, extra?: Record<string, unknown>): void {
    const line = JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      ...extra
    })
    this.stream?.write(line + '\n')
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.write('info', message, extra)
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.write('warn', message, extra)
  }

  error(message: string, extra?: Record<string, unknown>): void {
    this.write('error', message, extra)
  }

  /** Resolves once buffered lines reach disk, so shutdown can await it. */
  async close(): Promise<void> {
    const stream = this.stream
    this.stream = null
    if (stream == null) return
    await new Promise<void>(resolve => {
      stream.end(() => {
        resolve()
      })
    })
  }
}
