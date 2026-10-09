/**
 * The engine's run file: its cleaner, its type, and how to read one.
 *
 * Its own module so every reader can use the cleaner. `discovery.ts` owns the
 * paths and probes a socket with `net`, which `logger.ts` must not drag into
 * the pre-profile startup path — so the log sweep parsed `engine.json` by
 * hand, with `JSON.parse(raw)?.pid` and a `typeof` test, and became a third
 * reader of a file whose one declaration is here. Nothing beyond `cleaners`
 * and `fs` is imported, so any module can take it.
 */
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
import fs from 'fs'

/**
 * The run file, cleaned.
 *
 * A cast would let a truncated or hand-edited engine.json through as an object
 * whose `pid` is undefined, which `isProcessAlive` then hands to
 * `process.kill`, and whose `socketPath` callers try to connect to.
 */
const asEngineRunFile = asJSON(
  asObject({
    // Code reads `pid`, `socketPath`, `startedAt` — `isClaimLive` tests the
    // pid and `claimedWithin` the timestamp, `cleanupStaleLock` probes the
    // socket — and `scripts/util/cliHarness.ts` reads `tcpPort` and
    // `tcpToken` straight out of this file. Only `pid` can be required,
    // because `socketPathFor(profile)` reconstructs the socket path.
    pid: asNumber,
    // The rest is for an operator reading the file by hand.
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

/**
 * The run file's name.
 *
 * Here because this is the module that owns the file's *shape*, and it had
 * three homes: `discovery.ts`, `logger.ts`'s sweep and
 * `scripts/util/cliHarness.ts`. `logger.ts` has a stated reason not to
 * import `discovery.ts` — its `net` probe — which does not apply to a
 * filename, and it already imports this module for `readRunFileAt`.
 */
export const RUN_FILE_NAME = 'engine.json'

/**
 * Serialize a run file, through the cleaner's uncleaner, so a shape change is
 * a compile error rather than a file the reader rejects.
 *
 * `asEngineRunFile` is an `asJSON` cleaner, so its uncleaner already returns
 * JSON *text* — wrapping that in `JSON.stringify` writes a quoted string and
 * the engine cannot read its own run file.
 */
export function runFileText(data: EngineRunFile): string {
  return uncleanRunFile(data) + '\n'
}

/** One run file by path, cleaned, or `null` for anything unreadable. */
export function readRunFileAt(path: string): EngineRunFile | null {
  try {
    return asMaybe(asEngineRunFile)(fs.readFileSync(path, 'utf8')) ?? null
  } catch {
    return null
  }
}
