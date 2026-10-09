/**
 * Engine file logger — background/core logs go here, not to the CLI user's
 * stdout/stderr. Lifecycle "Ready" lines may still go to stderr for scripts
 * that wait on startup.
 */
import fs from 'fs'
import path from 'path'

import { cliLogsDir, cliRunRoot } from './cliHome'
import { errorMessage } from './errors'
import { readRunFileAt, RUN_FILE_NAME } from './runFile'

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

/**
 * How long `reopen` waits before trying the file again after a failure.
 *
 * A transient ENOSPC or EMFILE should cost a few seconds of log lines, not
 * the rest of the daemon's life; a persistent one should cost one `openSync`
 * per interval, not one per line.
 */
const REOPEN_RETRY_MS = 5_000

/**
 * What a part of the engine needs in order to report a failure.
 *
 * `EngineLogger`'s shape, narrowed to the two levels these reports use, so
 * `EventHub`, `SessionStore`, `IdleShutdown`, `makeSweepTicker`, the
 * listeners and `ObjectHandleStore` can take one without taking the file
 * logger's whole surface — and so a test can pass a recorder.
 *
 * It exists because `console` is not a record. The engine runs detached with
 * `stdio: ['ignore', logFd, logFd]` pointed at `engine-startup.log`, and
 * `removeRunArtifacts` unlinks that file on every ordinary stop, so the nine
 * failures these modules report — an auto-logout that failed, an
 * `account.logout()` that left wallet engines syncing, a logout that gave up
 * on in-flight requests, handles abandoned mid-call, an event that would not
 * serialise, a failed idle shutdown, every sweep failure, a listener error
 * after `listen` resolved, and a unix socket whose `0600` could not be set —
 * were erased by the shutdown that followed them.
 */
export interface EngineReporter {
  warn: (message: string, extra?: Record<string, unknown>) => void
  error: (message: string, extra?: Record<string, unknown>) => void
}

/**
 * The default for a module constructed without one.
 *
 * Still `console`, so nothing that builds these classes directly — a test, a
 * future tool — has to supply a logger. `src/cli/engine/index.ts` passes a
 * reporter that writes both: the file, for the record, and `console`, for
 * whoever is watching a foreground `npm run engine`.
 */
export const consoleReporter: EngineReporter = {
  warn: message => {
    console.warn(`[edge-engine] ${message}`)
  },
  error: message => {
    console.error(`[edge-engine] ${message}`)
  }
}

export class EngineLogger {
  private stream: fs.WriteStream | null = null
  private bytesWritten = 0
  /** When `reopen` last tried, so a persistent failure is not per-line. */
  private lastReopenAttempt = 0
  /**
   * Every rolled generation's flush, so `close` can wait for them all.
   *
   * A roll ends the old stream and keeps writing to a new one. Nothing
   * awaited that `end()`, so a shutdown in the moment after a roll — which
   * `engine-stop` and SIGINT both are — could lose the tail of `.1`, the file
   * that holds the lines leading up to whatever made the daemon busy enough
   * to roll.
   *
   * An array, not one slot: a single slot was overwritten by the next roll,
   * so a daemon busy enough to roll twice before shutting down dropped the
   * first generation's callback on the floor — the same loss this field
   * exists to prevent, one roll further along. Each entry removes itself
   * when it settles, so this cannot grow with the life of the process.
   */
  private readonly rolledFlushes = new Set<Promise<void>>()
  readonly logPath: string

  /**
   * The ceiling this instance rolls at.
   *
   * A parameter only so a test can reach `roll()`: with the module constant
   * as the only ceiling, the one way in was to write 8 MB, so the whole
   * rename-and-reopen — a `0o600` mode, a fresh `'error'` handler, and the
   * `catch` that keeps writing to the old handle when the rename fails — was
   * unexercised. The engine never passes it.
   */
  private readonly maxBytes: number

  constructor(profile: string, maxBytes: number = MAX_LOG_BYTES) {
    this.maxBytes = maxBytes
    // Engine logs carry usernames, login ids and core diagnostics, so keep
    // them owner-only rather than at the default umask.
    const dir = cliLogsDir()
    this.logPath = path.join(dir, `engine-${profile}.log`)

    // Both of these throw *synchronously* — EACCES from a logs directory or
    // log file an earlier `sudo` run left root-owned, EROFS from a read-only
    // home, ENOSPC when the disk is full — and the `'error'` handler below
    // cannot catch what happens before the stream exists. Unguarded, as
    // `openSync` was, that killed the daemon at startup with a raw stack:
    // every later non-root start of a profile whose log a root run had
    // touched. The rule twelve lines down is the whole policy — logging is
    // never worth the process — so a log the engine cannot open means it
    // runs without a file log and says so once on stderr.
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
      this.stream = this.openStream()
    } catch (error: unknown) {
      const message = errorMessage(error)
      this.stream = null
      console.error(
        `[edge-engine] cannot open the log (${this.logPath}): ${message}. ` +
          'Continuing without a file log.'
      )
      return
    }

    try {
      this.bytesWritten = fs.statSync(this.logPath).size
    } catch {
      // No log yet.
    }
    try {
      // `mode` only applies on creation, so tighten anything an earlier,
      // laxer run left behind.
      fs.chmodSync(dir, 0o700)
      fs.chmodSync(this.logPath, 0o600)
    } catch (error: unknown) {
      // Said once on stderr, because the comment above is the reason this
      // matters: engine logs carry usernames, login ids and core
      // diagnostics, and a log left at `0644` by an earlier run stays that
      // way silently.
      const message = errorMessage(error)
      console.error(
        `[edge-engine] could not tighten the log's permissions ` +
          `(${this.logPath}): ${message}. It may be readable by other ` +
          'local users.'
      )
    }
    this.watchStream(this.stream)
  }

  /**
   * Report a stream's failure, and retire *that* stream.
   *
   * The stream reports EACCES, ENOSPC and EDQUOT *asynchronously*, and an
   * unhandled `'error'` on an EventEmitter throws — an uncaught exception,
   * which would kill a long-lived daemon mid-request and skip
   * `removeRunArtifacts`. Logging is never worth the process.
   *
   * `if (this.stream === stream)` is the whole point of the helper. Both
   * sites used to clear `this.stream` unconditionally, and `roll()` keeps
   * the old stream alive as `previous` while it drains up to 8 MB — with
   * the handler installed for it still attached — before assigning the new
   * one. So an error on the *old* stream, draining out of space, nulled the
   * *healthy* new one, `write` returned early for the rest of the process's
   * life, and there is no re-open path: the daemon ran with no file log at
   * all and the only notice was one stderr line in a startup log a clean
   * stop deletes. That is the other half of the state the counter guard
   * below was written for.
   */
  private watchStream(stream: fs.WriteStream): void {
    stream.on('error', (error: Error) => {
      if (this.stream === stream) this.stream = null
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
    // Nothing is counted that was not written. The `'error'` handler nulls
    // the stream, and counting past that kept the ceiling climbing on text
    // being discarded — so every further `maxBytes` of dropped lines called
    // `roll()`, which renamed the log over `.1` and opened a stream that
    // failed the same way. On a persistent ENOSPC or a logs directory that
    // went read-only mid-run, the one previous generation this class
    // promises to keep was clobbered repeatedly by an empty file: the only
    // record of what the daemon was doing when it ran out of space.
    if (this.stream == null && !this.reopen()) return
    if (this.stream == null) return
    this.bytesWritten += Buffer.byteLength(text)
    // Written first, then rolled. Rolling first put the line that tripped the
    // threshold into the *new* file while `bytesWritten` was reset to zero
    // around it, so the fresh file's count was short by that line for ever.
    this.stream.write(text)
    if (this.bytesWritten > this.maxBytes) this.roll()
  }

  /**
   * The log stream, with the file already open.
   *
   * `openSync` first, rather than letting `createWriteStream` open lazily.
   * The lazy open is a race with everything that touches the path: a roll in
   * that window renamed a file that did not exist yet and then the pending
   * open re-created it, so the lines leading up to the roll went into the new
   * generation instead of the one they filled — and an engine that died
   * early lost its first lines entirely.
   */
  private openStream(): fs.WriteStream {
    const fd = fs.openSync(this.logPath, 'a', 0o600)
    return fs.createWriteStream('', { fd, autoClose: true })
  }

  /**
   * Start a fresh log, keeping one previous generation.
   *
   * Renaming rather than truncating means a reader following the old file
   * keeps a consistent view of it.
   */
  private roll(): void {
    // Renamed before the stream is touched. On POSIX an open descriptor
    // follows the inode, so the current stream keeps writing into `.1` and a
    // reader following the old file keeps a consistent view — which is the
    // whole reason this renames rather than truncating.
    //
    // Ending the stream first, as this used to, meant a failed rename left
    // two streams on one path: the new one appended ahead of the old one's
    // buffered flush, so lines came out of order, and anything still in the
    // old stream's buffer landed after lines written later.
    try {
      fs.renameSync(this.logPath, `${this.logPath}.1`)
    } catch {
      // Nothing useful to do but keep going on the file we have — with the
      // count reset, so the next attempt is another ceiling away rather than
      // one failed `renameSync` per line for the life of the daemon.
      this.bytesWritten = 0
      return
    }

    const previous = this.stream
    this.stream = null
    if (previous != null) {
      const flush = new Promise<void>(resolve => {
        try {
          previous.end(() => {
            resolve()
          })
        } catch {
          // Best effort: nothing to wait for.
          resolve()
        }
      })
      this.rolledFlushes.add(flush)
      flush.then(
        () => {
          this.rolledFlushes.delete(flush)
        },
        () => {
          this.rolledFlushes.delete(flush)
        }
      )
    }
    if (!this.reopen()) {
      console.error(
        '[edge-engine] could not roll the log; retrying on the next line'
      )
    }
  }

  /**
   * Open a fresh stream, reporting failure rather than throwing.
   *
   * Tried again on the next line, because a failed reopen used to be
   * permanent: `roll()` nulls the stream before renaming, so one EMFILE, one
   * ENOSPC or a logs directory that went read-only for a moment left
   * `this.stream` null for the life of the daemon — `write` returns early on
   * a null stream, so `engine-<profile>.log` silently stopped existing while
   * `logger.logPath` and the `Ready` line still named it, and the only
   * notice went to a file the next ordinary stop deletes. Rate-limited so a
   * persistent failure costs one `openSync` per interval rather than one per
   * line.
   */
  private reopen(): boolean {
    const now = Date.now()
    if (now - this.lastReopenAttempt < REOPEN_RETRY_MS) return false
    this.lastReopenAttempt = now
    try {
      this.stream = this.openStream()
      this.watchStream(this.stream)
      this.bytesWritten = 0
      return true
    } catch (error) {
      this.stream = null
      console.error(
        `[edge-engine] could not open the log: ${errorMessage(error)}`
      )
      return false
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
    const rolled = [...this.rolledFlushes]
    this.rolledFlushes.clear()
    if (stream != null) {
      await new Promise<void>(resolve => {
        stream.end(() => {
          resolve()
        })
      })
    }
    // Every generation a roll ended, each still draining into the file it
    // was renamed to.
    await Promise.all(rolled)
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
      // Through the run file's own cleaner, not `JSON.parse(raw)?.pid` with a
      // `typeof` test: a truncated or hand-edited `engine.json` would
      // otherwise reach `process.kill` as an object whose `pid` is
      // undefined, which is the reason `asEngineRunFile` exists.
      const run = readRunFileAt(path.join(runRoot, profile, RUN_FILE_NAME))
      if (run == null) continue
      process.kill(run.pid, 0)
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
