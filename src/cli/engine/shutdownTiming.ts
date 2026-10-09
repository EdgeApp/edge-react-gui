/**
 * The budgets a shutdown spends, in one place.
 *
 * They were spread across three modules, and the client's own wait was a
 * fourth number that contradicted them: `apiClient` waited 15 s for a
 * shutting-down engine to release its socket, under a comment claiming it was
 * "bounded by the drain the engine itself allows, plus a margin" — while the
 * drain alone is 110 s. The margin was negative by a factor of seven.
 *
 * What that produced: a stop or a Ctrl-C landing while any request slower
 * than 15 s was in flight — which `docs/EDGE_CLI.md` says `get-transactions`
 * on a whole wallet is — left the socket bound and answering 503. The next
 * command gave up at 15 s, spawned a replacement, and that child failed
 * `claimRunFile`'s `wx` against the dying engine's run file and printed "An
 * engine is already running … Stop it first (edge-cli engine-stop)" — advice
 * to do the thing the user had just done. Which is the sequence
 * `isShuttingDown` exists to prevent.
 *
 * This module holds no logic and imports nothing, so the client can read the
 * engine's figures without pulling the engine into its bundle.
 */

/** How long `shutdown` waits for in-flight requests to finish. */
export const SHUTDOWN_DRAIN_MS = 110_000

/** How long a bulk handle release waits for a consuming handle. */
export const HANDLE_BUSY_WAIT_MS = 10_000

/** How long a logout waits for the session's other requests. */
export const LOGOUT_WAIT_MS = 30_000

/**
 * How long one core call gets during teardown.
 *
 * `account.logout()` and `context.close()` had no ceiling at all, so a core
 * call that never settled meant an engine that never exited — holding the
 * socket, the run file and the profile, which is the state the client's own
 * wait exists to survive rather than to be caused by. Past this the failure
 * is reported and the shutdown carries on: the process is going away either
 * way, and a wallet engine still running inside a dying process costs less
 * than a daemon that will not die.
 */
export const CORE_TEARDOWN_WAIT_MS = 20_000

/**
 * How long a listener gets to close before its connections are closed for it.
 *
 * `server.close()` waits for every open connection, and the two that can
 * outlive a drain are a request still running and a subscriber whose link is
 * black-holed. Short, because by this point the requests have drained, the
 * accounts are logged out and the core context is closed: what is left is a
 * socket nobody is reading.
 */
export const LISTENER_CLOSE_WAIT_MS = 5_000

/**
 * How long one handle's own teardown gets.
 *
 * `onExpire` is caller-supplied and `create` accepts any
 * `(value) => void | Promise<void>`, so this is the one teardown the engine
 * awaits without knowing what is on the other end. For a `swap` handle it
 * is `quote.close()` — a third-party plugin's HTTP call to an exchange, and
 * the engine's only cancellation of a real order. For a `pendingLogin` it
 * is a `forceLogout`, which has bounded phases of its own.
 *
 * `deleteMany`'s docblock says it is "bounded, because a wedged call must
 * not stop the engine exiting", and its deadline covered only the wait for
 * a call already in flight; the teardown itself had no ceiling, so
 * `objects.clearAll()` — the shutdown's second phase, budgeted at
 * `HANDLE_BUSY_WAIT_MS` — inherited whatever `onExpire` took. Shorter than
 * `CORE_TEARDOWN_WAIT_MS` because by this point the answer is already
 * decided: the engine is going away, and a cancellation that has not
 * landed in five seconds is one the operator will have to make at the
 * exchange anyway.
 */
export const HANDLE_TEARDOWN_WAIT_MS = 5_000

/**
 * How long a client waits for a shutting-down engine to let go of its socket.
 *
 * Every bounded phase between `shuttingDown = true` and the listeners being
 * gone, for *one* session — walked against `shutdown()` rather than
 * remembered:
 *
 *   1. `drainRequests`                              SHUTDOWN_DRAIN_MS
 *   2. `objects.clearAll()` → `deleteMany`, which
 *      waits for the calls in flight and then
 *      bounds the teardowns — both across the
 *      whole set at once, which is what makes
 *      these two terms right rather than
 *      per-handle                              HANDLE_BUSY_WAIT_MS
 *                                            + HANDLE_TEARDOWN_WAIT_MS
 *   3. `forceLogout`'s `waitForQuiet`               LOGOUT_WAIT_MS
 *   4. `releaseHandles` → a *second* `deleteMany`   HANDLE_BUSY_WAIT_MS
 *                                            + HANDLE_TEARDOWN_WAIT_MS
 *   5. `account.logout()`                           CORE_TEARDOWN_WAIT_MS
 *   6. `core.context.close()`                       CORE_TEARDOWN_WAIT_MS
 *   7. two `closeListener` calls, each of which
 *      waits then closes the connections itself     4 × LISTENER_CLOSE_WAIT_MS
 *
 * It used to be terms 1, 2 and 3 alone — 150 s against a real 220 s — under
 * a docblock that said it was "built from the three phases that stand
 * between `shuttingDown = true` and the listeners closing". Five phases
 * stand there, `context.close()` is not per-session at all, and
 * `LISTENER_CLOSE_WAIT_MS` lands entirely past the last term. That gap was
 * only a wasted spawn until the client learned to *report* past the
 * ceiling: now a `get-transactions` that outlives the 110-second drain —
 * which the guide presents as an ordinary whole-wallet listing — makes the
 * next command fail and tells the operator to kill a daemon that is
 * draining exactly as designed.
 *
 * Still a ceiling rather than the true worst case: `logoutAll` walks
 * sessions sequentially, so terms 3 to 5 are per session. One session is
 * the figure; a client that waits out this much and still finds the socket
 * bound is looking at an engine that is wedged rather than draining, and
 * reports it instead of spawning a replacement that could not claim the
 * profile.
 *
 * `derivedNumbers.test.ts` asserts this against those terms, so a new
 * bounded phase cannot be added without moving it.
 */
export const SHUTDOWN_WAIT_MS =
  SHUTDOWN_DRAIN_MS +
  2 * (HANDLE_BUSY_WAIT_MS + HANDLE_TEARDOWN_WAIT_MS) +
  LOGOUT_WAIT_MS +
  2 * CORE_TEARDOWN_WAIT_MS +
  4 * LISTENER_CLOSE_WAIT_MS

/**
 * Wait for a counter to reach a floor, bounded, and say what was abandoned.
 *
 * `drainRequests` in `index.ts` and `waitForQuiet` in `sessions.ts` were the
 * same block in two files — a deadline, a `while` polling a counter every
 * 25 ms, then a warn reading "… request(s) still in flight after <budget>ms"
 * — so the polling interval and the wording could drift between two phases
 * of one shutdown. Bounded in both cases for the same reason: a wedged
 * request must not stop the engine exiting, and must not make a logout
 * impossible, because logout is a security control. What was abandoned is
 * logged rather than passed over in silence.
 *
 * Returns how many were still in flight when it gave up, so a caller that
 * wants to say more than the warn line can.
 */
export async function drainToFloor(opts: {
  inFlight: () => number
  floor: number
  budgetMs: number
  describe: (stuck: number) => string
  warn: (message: string) => void
}): Promise<number> {
  const { inFlight, floor, budgetMs, describe, warn } = opts
  const deadline = Date.now() + budgetMs
  while (inFlight() > floor && Date.now() < deadline) {
    await new Promise<void>(resolve => setTimeout(resolve, DRAIN_POLL_MS))
  }
  const stuck = inFlight() - floor
  if (stuck > 0) warn(describe(stuck))
  return stuck > 0 ? stuck : 0
}

/** How often `drainToFloor` looks again. One interval, not two. */
const DRAIN_POLL_MS = 25
