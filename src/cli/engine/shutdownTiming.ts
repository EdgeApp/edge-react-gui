/**
 * The budgets a shutdown spends, in one place.
 *
 * The client's wait for a shutting-down engine to release its socket is
 * built from these same figures, so it cannot fall short of the engine's own
 * teardown. A shorter wait would report an engine that is still draining
 * normally as wedged.
 *
 * This module imports nothing, so the client can read the engine's figures
 * without pulling the engine into its bundle.
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
 * Bounds `account.logout()` and `context.close()`: a core call that never
 * settles would otherwise be an engine that never exits, holding the socket,
 * the run file and the profile. Past this the failure is reported and the
 * shutdown carries on: the process is going away either way, and a wallet
 * engine still running inside a dying process costs less than a daemon that
 * will not die.
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
 * `deleteMany`'s own deadline covers only the wait for a call already in
 * flight. This bounds the teardown after it, so `objects.clearAll()`, the
 * shutdown's second phase, does not inherit whatever `onExpire` takes.
 * Shorter than `CORE_TEARDOWN_WAIT_MS` because by this point the answer is
 * already decided: the engine is going away, and a cancellation that has
 * not landed in five seconds is one the operator will have to make at the
 * exchange anyway.
 */
export const HANDLE_TEARDOWN_WAIT_MS = 5_000

/**
 * How long a client waits for a shutting-down engine to let go of its socket.
 *
 * Every bounded phase between `shuttingDown = true` and the listeners being
 * gone, for *one* session, in the order `shutdown()` runs them:
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
 * Every term counts because the client reports past this ceiling: a ceiling
 * short of the real teardown would tell the operator to kill a daemon that
 * is draining as designed, such as one finishing a `get-transactions` that
 * outlives the 110-second drain.
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
 * Shared by `drainRequests` in `index.ts` and `waitForQuiet` in
 * `sessions.ts`, so the deadline and the polling interval cannot drift
 * between two phases of one shutdown. Bounded in both cases for the same
 * reason: a wedged request must not stop the engine exiting, and must not
 * make a logout impossible, because logout is a security control. What was
 * abandoned is logged rather than passed over in silence.
 */
export async function drainToFloor(opts: {
  inFlight: () => number
  floor: number
  budgetMs: number
  describe: (stuck: number) => string
  warn: (message: string) => void
}): Promise<void> {
  const { inFlight, floor, budgetMs, describe, warn } = opts
  const deadline = Date.now() + budgetMs
  while (inFlight() > floor && Date.now() < deadline) {
    await new Promise<void>(resolve => setTimeout(resolve, DRAIN_POLL_MS))
  }
  const stuck = inFlight() - floor
  if (stuck > 0) warn(describe(stuck))
}

/** How often `drainToFloor` looks again. One interval, not two. */
const DRAIN_POLL_MS = 25
