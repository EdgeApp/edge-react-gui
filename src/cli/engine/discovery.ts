import {
  asBoolean,
  asJSON,
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  uncleaner
} from 'cleaners'
import crypto from 'crypto'
import fs from 'fs'
import net from 'net'
import { join, resolve } from 'path'

import { cliRunRoot } from './cliHome'

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
 * claim, with no race needed to get there. `realpathSync` as well as
 * `resolve`, so a symlink and its target agree; `resolve` alone where the
 * path does not exist yet, because the engine is what creates it.
 */
export function canonicalDirectory(directory: string): string {
  const resolved = resolve(directory)
  try {
    return fs.realpathSync.native(resolved)
  } catch {
    return resolved
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

/** Where every profile's run directory lives. */
function runRoot(): string {
  return cliRunRoot()
}

export function runDir(profile: string): string {
  return join(runRoot(), profile)
}

export function socketPathFor(profile: string): string {
  return join(runDir(profile), 'engine.sock')
}

export function runFilePath(profile: string): string {
  return join(runDir(profile), 'engine.json')
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
 * Serialize a run file. One spelling, through the cleaner's uncleaner, so a
 * shape change is a compile error rather than a file `readRunFile` rejects.
 *
 * `asEngineRunFile` is an `asJSON` cleaner, so its uncleaner already returns
 * JSON *text* — wrapping that in `JSON.stringify` writes a quoted string and
 * the engine cannot read its own run file.
 */
function runFileText(data: EngineRunFile): string {
  return uncleanRunFile(data) + '\n'
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

/**
 * The run file, cleaned.
 *
 * A cast would let a truncated or hand-edited engine.json through as an object
 * whose `pid` is undefined, which `isProcessAlive` then hands to
 * `process.kill`, and whose `socketPath` callers try to connect to.
 */
const asEngineRunFile = asJSON(
  asObject({
    // The only field any reader uses, so the only one that may be required.
    pid: asNumber,
    // Everything else is written for an operator reading the file by hand.
    // `asOptional`, because a *required* field here is destructive: a run
    // file the cleaner rejects makes `readRunFile` answer null,
    // `cleanupStaleLock` unlink the socket but leave the file, and
    // `claimRunFile`'s `flag: 'wx'` then fail EEXIST — so the engine reports
    // "already running" with no pid and exits 1, the live engine has no
    // socket, `engine-stop` cannot reach it, and every later invocation
    // repeats that until the profile directory is removed by hand. Reachable
    // today by a SIGKILL during `claimRunFile`'s `wx` create — the one write
    // here that is not a rename — and guaranteed on the next release that
    // adds a field while an engine from this one is still detached and
    // running.
    apiVersion: asOptional(asString),
    socketPath: asOptional(asString),
    tcpPort: asOptional(asNumber, null),
    // The bearer token the TCP listener requires. Written only here, in a
    // `0600` file inside a `0700` directory, so being able to read it is
    // what authorises a caller.
    tcpToken: asOptional(asString),
    appId: asOptional(asString),
    testMode: asOptional(asBoolean),
    startedAt: asOptional(asString)
  })
)

const uncleanRunFile = uncleaner(asEngineRunFile)

/**
 * Derived from the cleaner, not declared beside it: a hand-written copy went
 * stale the moment the cleaner's optionality changed, and the compiler can
 * only notice that when one of them is the source of truth.
 */
export type EngineRunFile = ReturnType<typeof asEngineRunFile>

export function readRunFile(profile: string): EngineRunFile | null {
  try {
    const text = fs.readFileSync(runFilePath(profile), 'utf8')
    return asMaybe(asEngineRunFile)(text) ?? null
  } catch {
    return null
  }
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
    ...(opts.keepSession === true ? [] : [sessionFilePath(profile)]),
    // Not while an engine is booting: the client opens this before the engine
    // claims the profile, and it is the only record of a startup that dies
    // before the socket exists — the case it was added for.
    ...(opts.keepStartupLog === true
      ? []
      : [join(runDir(profile), 'engine-startup.log')])
  ]) {
    try {
      fs.unlinkSync(file)
    } catch {
      // ignore
    }
  }
  try {
    // Leave no empty profile directory behind: one per engine per data
    // directory otherwise accumulates under ~/.edge-cli/run forever.
    fs.rmdirSync(runDir(profile))
  } catch {
    // not empty, or already gone
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
 * `null` also covers an `engine.json` that is missing, malformed or truncated,
 * since `readRunFile` cleans it and yields nothing for all three. A file it
 * cannot read is treated as no claim at all and its socket is removed, which
 * is the safe reading: a live engine always has a well-formed run file.
 * `claimRunFile` writes a complete record before anything binds, and
 * `writeRunFile` replaces it by rename rather than truncation, so there is no
 * window in which a running engine's file is half-written.
 */
export async function cleanupStaleLock(
  profile: string
): Promise<number | null> {
  const run = readRunFile(profile)
  if (run == null) {
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
  // `isProcessAlive` alone is not enough. It is `process.kill(pid, 0)`, so a
  // run file left behind by a SIGKILLed engine whose pid the OS has since
  // recycled looks live for ever: the engine prints "already running" and
  // exits 1 on every invocation, `sweepStaleProfiles` skips the directory
  // for the same reason, and the only recovery is deleting it by hand — the
  // exact wedge this function exists to prevent. So the claim also has to be
  // backed by something actually listening on the socket it names.
  if (isProcessAlive(run.pid)) {
    if (await isEngineListening(run.socketPath ?? socketPathFor(profile))) {
      return run.pid
    }
    // Nothing listening yet is not the same as nothing coming. The claim is
    // written before `makeCoreContext`, which opens the on-disk repos and
    // starts every plugin, and the socket is not bound until seconds later —
    // so for that whole window a live, *booting* engine reads exactly like a
    // dead one. Sweeping it let a second cold invocation claim the same
    // profile and open a second EdgeContext on one directory, which is the
    // corruption the claim ordering exists to prevent. This is the reasoning
    // `sweepStaleProfiles` already applies to its own `run == null` arm.
    if (claimedWithin(profile, run, BOOT_GRACE_MS)) return run.pid
  }
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
 * indefinitely, each one possibly still holding a `session.json` — the
 * engine's bearer token — which directly contradicts this module's own
 * comments.
 *
 * Swept at engine startup. A directory whose run file names a live process is
 * left alone, as is one belonging to the profile starting up, and as is one
 * young enough to be mid-boot.
 */
export function sweepStaleProfiles(except: string): number {
  let profiles: string[]
  try {
    profiles = fs.readdirSync(runRoot())
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
    if (run != null && isProcessAlive(run.pid)) continue
    // No live owner, so nothing here can be in use. The startup log is kept:
    // it is the only record of a boot that died before the socket existed,
    // and the cost of keeping one stale file is a few hundred bytes.
    removeRunArtifacts(profile, { keepStartupLog: true })
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
