import crypto from 'crypto'
import fs from 'fs'
import net from 'net'
import { basename, dirname, join, resolve } from 'path'

import { cliLogsDir, cliRunRoot } from './cliHome'
import {
  type EngineRunFile,
  readRunFileAt,
  RUN_FILE_NAME,
  runFileText
} from './runFile'

// The run file's own declaration lives in `runFile.ts`, so the log sweep can
// read it with the same cleaner without pulling `net` into the startup path.
export type { EngineRunFile }

export interface ProfileKey {
  appId: string
  directory: string
  testMode: boolean
  loginServer?: string
}

/**
 * One directory, one string.
 *
 * The profile hash is the only thing keeping two engines off one core data
 * directory, and it was taken over the raw argv string — so `/x/edge-data`,
 * `/x/edge-data/`, `/x/./edge-data` and a relative `edge-data` were four
 * profiles for one directory, each holding what it believed was an exclusive
 * claim, with no race needed to get there.
 *
 * `realpathSync` as well as `resolve`, so a symlink and its target agree —
 * including when the directory does not exist yet, which is the case that
 * mattered. The client hashes before it creates the data directory and the
 * engine hashes after, so resolving without realpath gave the two sides
 * different answers under a symlinked path: on macOS that is every first run
 * with `-d /tmp/…`, where the engine bound its socket under one profile, the
 * client polled another, and the command failed with a 30-second spawn
 * timeout while a healthy detached engine stayed behind. The second
 * invocation worked, because by then the directory existed.
 */
export function canonicalDirectory(directory: string): string {
  const resolved = resolve(directory)
  try {
    return fs.realpathSync.native(resolved)
  } catch {
    // The leaf is not there yet: realpath the deepest ancestor that is and
    // keep the rest verbatim, so creating the directory cannot change the
    // answer.
    const tail: string[] = []
    let head = resolved
    for (;;) {
      const parent = dirname(head)
      tail.unshift(basename(head))
      // The root, with nothing along the way that exists.
      if (parent === head) return resolved
      try {
        return join(fs.realpathSync.native(parent), ...tail)
      } catch {
        head = parent
      }
    }
  }
}

export function profileHash(key: ProfileKey): string {
  const payload = JSON.stringify({
    appId: key.appId,
    directory: canonicalDirectory(key.directory),
    testMode: key.testMode,
    loginServer: key.loginServer ?? null
  })
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

/**
 * How long a profile with no run file is treated as mid-boot.
 *
 * Longer than a Node + sucrase startup, shorter than anyone would wait
 * before wondering why a directory is still there.
 */
const BOOT_GRACE_MS = 60_000

/** How long to wait for a connect before calling a socket dead. */
const LISTEN_PROBE_MS = 1000

export function runDir(profile: string): string {
  return join(cliRunRoot(), profile)
}

export function socketPathFor(profile: string): string {
  return join(runDir(profile), 'engine.sock')
}

export function runFilePath(profile: string): string {
  return join(runDir(profile), RUN_FILE_NAME)
}

export function sessionFilePath(profile: string): string {
  return join(runDir(profile), 'session.json')
}

export function ensureRunDir(profile: string): string {
  const dir = runDir(profile)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  return dir
}

/**
 * Replace the run file, atomically.
 *
 * Write-then-rename, because this runs *after* the socket is bound: a
 * truncating `writeFileSync` left a window in which a live engine's run file
 * was empty or half-written, which is exactly the state `cleanupStaleLock`
 * reads as "no claim" before unlinking the socket. A rename is atomic within
 * one directory, so a reader sees either the old record or the new one.
 */
export function writeRunFile(profile: string, data: EngineRunFile): void {
  ensureRunDir(profile)
  const path = runFilePath(profile)
  const temp = `${path}.${process.pid}.tmp`
  fs.writeFileSync(temp, runFileText(data), { mode: 0o600 })
  try {
    // `mode` only applies when creating; force 0600 before it is visible.
    fs.chmodSync(temp, 0o600)
  } catch {
    // ignore
  }
  fs.renameSync(temp, path)
}

/**
/**
 * The engine's exit code for "another engine already owns this profile".
 *
 * Distinct from the `1` every other startup failure uses, because the two
 * mean opposite things to the client that spawned it. On two racing cold
 * invocations the loser of `claimRunFile` exits within about a second while
 * the winner is still loading plugins, so a client that read any exit as
 * fatal gave up on a profile a healthy engine was about to bind — and said
 * "Stop it first", about an engine it had started itself.
 *
 * Shared by both halves so the number cannot drift, like
 * `REQUEST_BUDGET_HEADER`.
 */
export const ENGINE_EXIT_ALREADY_RUNNING = 3

/**
 * Claim the profile by creating the run file exclusively.
 *
 * `wx` fails when the file already exists, so two engines racing from cold
 * cannot both believe they own the profile. The socket path is deterministic
 * from the profile, so it can be recorded before anything is bound; the real
 * `tcpPort` follows in the full `writeRunFile` once the listeners are up.
 *
 * Returns false when another engine won the race.
 */
export function claimRunFile(profile: string, data: EngineRunFile): boolean {
  ensureRunDir(profile)
  try {
    fs.writeFileSync(runFilePath(profile), runFileText(data), {
      mode: 0o600,
      flag: 'wx'
    })
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false
    throw error
  }
}

export function readRunFile(profile: string): EngineRunFile | null {
  return readRunFileAt(runFilePath(profile))
}

/**
 * Clear everything a dead engine leaves in its profile directory.
 *
 * `session.json` goes too: a sessionId cannot outlive the engine that issued
 * it, so keeping it only means the next command fails `INVALID_SESSION` until
 * the user works out why.
 */
export function removeRunArtifacts(
  profile: string,
  opts: {
    keepStartupLog?: boolean
    /**
     * Both set by a startup that claimed the profile and then died without
     * ever serving on it — above all one that died *because* it lost the
     * `listen` race. The socket then belongs to the engine that won, and
     * `session.json` belongs to the user: unlinking them left the winner
     * resident and unreachable with the user's session gone, and every later
     * command spawning another engine on the same directory. Only the run
     * file is this process's to clear.
     */
    keepSocket?: boolean
    keepSession?: boolean
  } = {}
): void {
  for (const file of [
    ...(opts.keepSocket === true ? [] : [socketPathFor(profile)]),
    runFilePath(profile),
    ...(opts.keepSession === true ? [] : [sessionFilePath(profile)])
  ]) {
    try {
      fs.unlinkSync(file)
    } catch {
      // ignore
    }
  }
  // Not while an engine is booting: the client opens this before the engine
  // claims the profile, and it is the only record of a startup that dies
  // before the socket exists — the case it was added for.
  if (opts.keepStartupLog !== true) retireStartupLog(profile)
  try {
    // Leave no empty profile directory behind: one per engine per data
    // directory otherwise accumulates under ~/.edge-cli/run forever.
    fs.rmdirSync(runDir(profile))
  } catch {
    // not empty, or already gone
  }
}
/**
 * Move a non-empty startup log into the log directory, or delete it.
 *
 * It was unlinked outright, and in normal operation it is not only the
 * pre-socket record its name suggests: the engine is started detached with
 * `stdio: ['ignore', logFd, logFd]`, so anything a *plugin* writes to stderr
 * lands here. Measured on a healthy engine with seven wallets: 73 KB and 89
 * copies of `edge-currency-plugins`' `Socket closed without error` stack in
 * the first half-minute, against 19 KB in `engine-<profile>.log` for the
 * whole session — and every byte of it deleted by the stop that followed.
 * Core's own warn for those events does reach the engine log, so the
 * information is not lost; the plugin's own output was.
 *
 * Into `~/.edge-cli/logs/`, where `sweepOldLogs` ages it out with everything
 * else rather than leaving one file per profile for ever. An empty one is
 * still deleted, which is the common case: nothing wrote to stderr.
 */
function retireStartupLog(profile: string): void {
  const from = join(runDir(profile), 'engine-startup.log')
  try {
    if (fs.statSync(from).size === 0) {
      fs.unlinkSync(from)
      return
    }
    const dir = cliLogsDir()
    fs.mkdirSync(dir, { recursive: true })
    fs.renameSync(from, join(dir, `engine-${profile}-startup.log`))
  } catch {
    // Absent, or a rename across devices. Either way the stop continues.
    try {
      fs.unlinkSync(from)
    } catch {
      // ignore
    }
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error: unknown) {
    // EPERM means the pid exists but belongs to another user.
    return (
      error != null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'EPERM'
    )
  }
}

/**
 * Whether a run file's claim belongs to an engine that is still around.
 *
 * One definition, because there were two and they disagreed.
 * `cleanupStaleLock` required a listening socket as well as a live pid, and
 * its comment asserted that `sweepStaleProfiles` "skips the directory for
 * the same reason" — but the sweep tested the pid alone, so it permanently
 * skipped exactly the profiles it exists to clear: a SIGKILLed engine whose
 * pid the OS later recycled looks alive for ever, so its run directory — the
 * socket, the stale `session.json`, and `tcpToken` inside `engine.json`,
 * which is the one live credential in there — survived in a directory
 * nothing would revisit, because `testCliFake` derives its data directory
 * from the pid so every run hashes fresh.
 */
async function isClaimLive(
  profile: string,
  run: EngineRunFile
): Promise<boolean> {
  if (!isProcessAlive(run.pid)) return false
  if (await isEngineListening(run.socketPath ?? socketPathFor(profile))) {
    return true
  }
  // Nothing listening yet is not the same as nothing coming: the claim is
  // written before `makeCoreContext`, and the socket is bound seconds later.
  return claimedWithin(profile, run, BOOT_GRACE_MS)
}

/**
 * Whether a claim is young enough that its engine may still be booting.
 *
 * `startedAt` when the claim carries one, and the run file's own mtime
 * otherwise, so a file written by an engine from before that field existed is
 * still given the grace rather than swept out from under itself.
 */
function claimedWithin(
  profile: string,
  run: EngineRunFile,
  graceMs: number
): boolean {
  const started =
    run.startedAt != null
      ? Date.parse(run.startedAt)
      : mtimeMsOf(runFilePath(profile))
  if (!Number.isFinite(started)) return false
  return Date.now() - started < graceMs
}

/**
 * Whether a file exists and was last written inside `graceMs`.
 *
 * For a run file with no readable record: an engine writing its claim right
 * now, as opposed to one that died leaving a truncated file. The mtime is all
 * there is, because the record itself is what cannot be read.
 */
function writtenWithin(path: string, graceMs: number): boolean {
  const mtime = mtimeMsOf(path)
  if (!Number.isFinite(mtime)) return false
  return Date.now() - mtime < graceMs
}

/** A file's mtime in milliseconds, or `NaN` when it cannot be read. */
function mtimeMsOf(path: string): number {
  try {
    return fs.statSync(path).mtimeMs
  } catch {
    return Number.NaN
  }
}

/**
 * Clear the artifacts of an engine that is no longer running.
 *
 * Returns the pid of a live engine for this profile, so the caller can refuse
 * to start rather than unlinking a working socket out from under it, and
 * `null` when the profile is free.
 *
 * `null` also covers an `engine.json` that is missing or malformed, since
 * `readRunFile` cleans it and yields nothing for both. A file it cannot read
 * is treated as no claim *unless it was written moments ago*: `writeRunFile`
 * replaces the record by rename, so a running engine's file is never
 * half-written, but `claimRunFile` cannot rename — it needs `wx` for the
 * exclusion — so the claim itself is a create followed by a write. A second
 * engine starting inside that sub-millisecond window read a zero-length
 * file, took this arm, and unlinked the socket and run file of the engine
 * that had just claimed them: both then believed they owned the profile.
 * A file whose mtime is inside `BOOT_GRACE_MS` is a claim in progress, which
 * is the same grace `isClaimLive` already gives an engine that has claimed
 * and not yet bound.
 */
export async function cleanupStaleLock(
  profile: string
): Promise<number | null> {
  const run = readRunFile(profile)
  if (run == null) {
    // A claim being written right now, which `claimRunFile` cannot make
    // atomic: `wx` is the exclusion, so the create and the write are two
    // steps. Refusing to start is right here — the other engine is seconds
    // from listening, and `spawnEngine` waits — where unlinking its socket
    // and run file left two engines each believing they owned the profile.
    if (writtenWithin(runFilePath(profile), BOOT_GRACE_MS)) return null
    // No readable claim, so nothing here is in use. The run file goes with
    // the socket: leaving an unreadable one behind made `claimRunFile` fail
    // EEXIST forever and wedged the profile until someone deleted the
    // directory by hand.
    for (const file of [socketPathFor(profile), runFilePath(profile)]) {
      try {
        fs.unlinkSync(file)
      } catch {
        // ignore
      }
    }
    return null
  }
  // Through `isClaimLive`, which `sweepStaleProfiles` also uses, so the two
  // cannot disagree about what a live claim is. `isProcessAlive` alone is
  // not enough: it is `process.kill(pid, 0)`, so a run file left by a
  // SIGKILLed engine whose pid the OS has recycled looks live for ever, and
  // the only recovery is deleting the directory by hand — the exact wedge
  // this function exists to prevent.
  if (await isClaimLive(profile, run)) return run.pid
  // A dead engine's artifacts go, but not the startup log: a client spawning
  // the replacement has already opened it, and it is where a boot failure is
  // recorded.
  removeRunArtifacts(profile, { keepStartupLog: true })
  return null
}

/**
 * Whether anything answers on a unix socket path.
 *
 * A connect, not a request: this runs before the engine has a client and
 * only needs to know whether the previous owner is still there. A socket
 * *file* proves nothing, because a SIGKILLed engine leaves one behind.
 */
export async function isEngineListening(socketPath: string): Promise<boolean> {
  return await new Promise<boolean>(resolve => {
    let settled = false
    const done = (answer: boolean): void => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(answer)
    }
    const socket = net.connect(socketPath)
    socket.setTimeout(LISTEN_PROBE_MS)
    socket.once('connect', () => {
      done(true)
    })
    socket.once('error', () => {
      done(false)
    })
    socket.once('timeout', () => {
      done(false)
    })
  })
}

/**
 * Clear out profile directories no engine owns any more.
 *
 * `cleanupStaleLock` only ever looks at the profile being started, so a
 * profile nothing revisits keeps its artifacts forever: every interrupted run
 * orphans one, and because `testCliFake` derives its data directory from the
 * pid, every run has a fresh hash. Those directories accumulate
 * indefinitely, each one possibly still holding a `session.json` whose
 * session died with the engine that issued it — a stale id rather than a
 * live credential, and a pile of them all the same. The credential in a run
 * directory is `tcpToken` inside `engine.json`, which is why that file is
 * `0600` inside a `0700` directory.
 *
 * Swept at engine startup. A directory whose run file names a live process is
 * left alone, as is one belonging to the profile starting up, and as is one
 * young enough to be mid-boot.
 */
export async function sweepStaleProfiles(except: string): Promise<number> {
  let profiles: string[]
  try {
    profiles = fs.readdirSync(cliRunRoot())
  } catch {
    return 0
  }
  let removed = 0
  const now = Date.now()
  for (const profile of profiles) {
    if (profile === except) continue
    let newestMtime: number
    try {
      const dir = runDir(profile)
      if (!fs.statSync(dir).isDirectory()) continue
      newestMtime = newestMtimeIn(dir)
    } catch {
      continue
    }
    // A profile that is *starting* looks exactly like an abandoned one: the
    // client creates the run directory and `engine-startup.log` before it
    // spawns, and the engine does not write `engine.json` until
    // `claimRunFile`, a whole Node startup later. Another engine booting in
    // that window read "no run file" as "abandoned" and deleted the socket,
    // the session file and the very startup log the spawning client was
    // about to read — so a failed spawn reported "No engine output" and
    // pointed at a file that had just been removed.
    const run = readRunFile(profile)
    if (run == null && now - newestMtime < BOOT_GRACE_MS) continue
    if (run != null && (await isClaimLive(profile, run))) continue
    // No live owner, and past the boot grace, so the startup log goes too.
    //
    // Keeping it — as this did — meant the directory was never empty, so
    // `removeRunArtifacts`' `rmdirSync` always threw ENOTEMPTY and the
    // accumulation this function exists to bound carried on regardless,
    // while `removed++` reported work that had not happened. The comment
    // called the cost "a few hundred bytes"; it was a directory per engine
    // per data directory, for ever.
    //
    // The log is a hand-off to the client that spawned the engine, which
    // reads it as soon as the spawn fails: the `BOOT_GRACE_MS` check above
    // is what protects that, and it is twice the client's spawn timeout.
    // Past it nobody is waiting for this file, and an engine that crashed
    // after its logger existed also wrote the same message to
    // `~/.edge-cli/logs/engine-<profile>.log`, which is swept on age rather
    // than on liveness and is the durable record.
    removeRunArtifacts(profile)
    removed++
  }
  return removed
}

/** The most recent mtime of a directory's own entries, or 0. */
function newestMtimeIn(dir: string): number {
  let newest = 0
  try {
    newest = fs.statSync(dir).mtimeMs
  } catch {
    return 0
  }
  let names: string[]
  try {
    names = fs.readdirSync(dir)
  } catch {
    return newest
  }
  for (const name of names) {
    try {
      const { mtimeMs } = fs.statSync(join(dir, name))
      if (mtimeMs > newest) newest = mtimeMs
    } catch {
      // Gone between the listing and the stat.
    }
  }
  return newest
}
