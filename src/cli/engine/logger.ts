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
    const dir = path.join(os.homedir(), '.edge-cli', 'logs')
    fs.mkdirSync(dir, { recursive: true })
    this.logPath = path.join(dir, `engine-${profile}.log`)
    this.stream = fs.createWriteStream(this.logPath, { flags: 'a' })
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

  close(): void {
    this.stream?.end()
    this.stream = null
  }
}
