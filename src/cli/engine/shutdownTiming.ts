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
 * How long a client waits for a shutting-down engine to let go of its socket.
 *
 * The sum of the phases that follow the request drain, because those are what
 * stand between `shuttingDown = true` and the listeners closing. A wedged
 * engine therefore costs a client this long before it gives up and reports
 * what it finds — which is the right trade against spawning a replacement
 * that cannot claim the profile.
 */
export const SHUTDOWN_WAIT_MS =
  SHUTDOWN_DRAIN_MS + HANDLE_BUSY_WAIT_MS + LOGOUT_WAIT_MS
