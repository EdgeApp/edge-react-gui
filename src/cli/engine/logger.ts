/**
 * Engine file logger — background/core logs go here, not to the CLI user's
 * stdout/stderr. Lifecycle "Ready" lines may still go to stderr for scripts
 * that wait on startup.
 */
import fs from 'fs'
import path from 'path'

import { cliLogsDir, cliRunRoot } from './cliHome'

/**
 * How large one engine log may grow before it rolls.
 *
 * A daemon held open past its idle timeout — which `subscribe` does by
 * design, and `--idle-timeout=0` does explicitly — writes continuously, and a
 * plugin stuck in a retry loop writes fast — fast enough to reach several
 * megabytes an hour, most of it one repeated warning. One previous
 * generation is kept, so a profile costs at most 2 × this.
 */
const MAX_LOG_BYTES = 8 * 1024 * 1024

/** Engine logs older than this are swept at startup. */
const LOG_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export class EngineLogger {
  private stream: fs.WriteStream | null = null
  private bytesWritten = 0
  readonly logPath: string

  constructor(profile: string) {
    // Engine logs carry usernames, login ids and core diagnostics, so keep
    // them owner-only rather than at the default umask.
    const dir = cliLogsDir()
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    this.logPath = path.join(dir, `engine-${profile}.log`)
    try {
      this.bytesWritten = fs.statSync(this.logPath).size
    } catch {
      // No log yet.
    }
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
    // `createWriteStream` reports EACCES (a logs directory left root-owned or
    // read-only), ENOSPC and EDQUOT *asynchronously*, and an unhandled
    // `'error'` on an EventEmitter throws — an uncaught exception, which
    // would kill a long-lived daemon mid-request and skip
    // `removeRunArtifacts`. Logging is never worth the process.
    this.stream.on('error', (error: Error) => {
      this.stream = null
      console.error(
        `[edge-engine] log file unusable (${this.logPath}): ${error.message}`
      )
    })
  }

  write(level: string, message: string, extra?: Record<string, unknown>): void {
    const line = JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      ...extra
    })
    const text = line + '\n'
    this.bytesWritten += Buffer.byteLength(text)
    if (this.bytesWritten > MAX_LOG_BYTES) this.roll()
    this.stream?.write(text)
  }

  /**
   * Start a fresh log, keeping one previous generation.
   *
   * Renaming rather than truncating means a reader following the old file
   * keeps a consistent view of it.
   */
  private roll(): void {
    const previous = this.stream
    this.stream = null
    try {
      previous?.end()
      fs.renameSync(this.logPath, `${this.logPath}.1`)
    } catch {
      // If the rename fails there is nothing useful to do but keep going on
      // the file we have.
    }
    try {
      this.stream = fs.createWriteStream(this.logPath, {
        flags: 'a',
        mode: 0o600
      })
      this.stream.on('error', (error: Error) => {
        this.stream = null
        console.error(
          `[edge-engine] log file unusable (${this.logPath}): ${error.message}`
        )
      })
      this.bytesWritten = 0
    } catch (error) {
      console.error(
        `[edge-engine] could not roll the log: ${String(
          error instanceof Error ? error.message : error
        )}`
      )
    }
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

/**
 * Remove engine logs nothing is writing any more.
 *
 * Every throwaway `--directory` gets its own profile hash and therefore its
 * own log file, so a machine that runs the test suites accumulates one per
 * run, indefinitely. Swept at engine startup
 * rather than on shutdown, so the log of the run you just did is still there
 * to read.
 *
 * A log whose profile still has a live run file is kept, whatever its age.
 * `fs.unlinkSync` succeeds on POSIX for a file another process holds open,
 * so the `catch` below does not protect a live writer: an engine started
 * `--idle-timeout=0` and left quiet kept writing to an unlinked inode after
 * another engine's startup sweep removed it, so its log silently stopped
 * existing while `logger.logPath` and the `Ready` line still named it.
 * `keep` is the file this process has open, which the caller knows.
 */
export function sweepOldLogs(
  maxAgeMs: number = LOG_MAX_AGE_MS,
  keep?: string
): number {
  const dir = cliLogsDir()
  let removed = 0
  let names: string[]
  try {
    names = fs.readdirSync(dir)
  } catch {
    return 0
  }
  const cutoff = Date.now() - maxAgeMs
  const liveProfiles = liveLogProfiles()
  for (const name of names) {
    if (!name.startsWith('engine-')) continue
    const file = path.join(dir, name)
    if (keep != null && file === keep) continue
    // `engine-<profile>.log`, and `engine-<profile>.log.1` after a roll.
    const profile = name.slice('engine-'.length).replace(/\.log(\.\d+)?$/, '')
    if (liveProfiles.has(profile)) continue
    try {
      if (fs.statSync(file).mtimeMs >= cutoff) continue
      fs.unlinkSync(file)
      removed++
    } catch {
      // Already gone.
    }
  }
  return removed
}

/**
 * Profiles whose run file names a process that is still running.
 *
 * The same test `sweepStaleProfiles` applies, read here directly rather than
 * imported, because this module is loaded before the engine has a profile
 * and must not drag the discovery module's `net` probe into that path.
 */
function liveLogProfiles(): Set<string> {
  const live = new Set<string>()
  const runRoot = cliRunRoot()
  let profiles: string[]
  try {
    profiles = fs.readdirSync(runRoot)
  } catch {
    return live
  }
  for (const profile of profiles) {
    try {
      const raw = fs.readFileSync(
        path.join(runRoot, profile, 'engine.json'),
        'utf8'
      )
      const pid = JSON.parse(raw)?.pid
      if (typeof pid !== 'number') continue
      process.kill(pid, 0)
      live.add(profile)
    } catch (error: unknown) {
      // EPERM means the pid exists and belongs to another user, which still
      // counts as live. Anything else — no file, bad JSON, ESRCH — does not.
      if ((error as { code?: string } | null)?.code === 'EPERM') {
        live.add(profile)
      }
    }
  }
  return live
}
