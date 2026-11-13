/**
 * How long the caller is still waiting, carried to the engine.
 *
 * The engine is a long-lived daemon and a handler runs to completion whether
 * or not anyone reads the answer, so for most routes the client's deadline is
 * the client's business. `get-transactions` is the exception: its historical
 * fiat fill is a chain of up to 99-key requests, and when the chain's budget
 * expires the remainder is *settled* rather than retried — on an export that
 * is an arbitrary tail of the oldest transactions. Carrying the budget lets
 * `--timeout`, the one control the CLI offers for "slow is better than
 * wrong", move the work it waits for and not only `apiClient`'s own
 * deadline.
 *
 * A header rather than a query field, because it is a property of the call
 * and not of the request: no route declares it, nothing in the reference
 * takes it, and a route that ignores it is unaffected by it.
 *
 * Node-safe, and shared by both halves so the spelling cannot drift.
 */
import type { IncomingMessage } from 'http'

// Node's 32-bit timer ceiling, from the leaf both halves read rather than a
// second copy of the number here.
import { MAX_TIMER_MS } from './timerCeiling'

export const REQUEST_BUDGET_HEADER = 'x-edge-timeout-ms'

/**
 * The caller's remaining budget, or undefined when it did not say.
 *
 * Anything unparseable, non-positive or past the timer ceiling is treated as
 * "did not say": this is a hint that lets a route finish sooner, so a
 * malformed one must not be able to make a route finish *instantly*, which
 * is what a `0` or an overflowed timer would do.
 */
export function readRequestBudgetMs(
  req: IncomingMessage | undefined,
  arrivedAt?: number
): number | undefined {
  // `undefined` for a handler driven directly, which is how the jest suites
  // reach these bodies: they hand a route the cleaned value a request would
  // have produced, and there is no `IncomingMessage` behind it.
  const raw = req?.headers[REQUEST_BUDGET_HEADER]
  const text = Array.isArray(raw) ? raw[0] : raw
  if (text == null || text === '') return undefined
  const ms = Number(text)
  if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_TIMER_MS) return undefined
  // Minus what the request has already spent. The header is a duration from
  // the caller's send, and a route reads it where its slow work starts —
  // after the settings read, the spam-floor rate query and
  // `wallet.getTransactions` — so taking it as a fresh budget there would
  // set a deadline strictly later than the caller's, and `addToQueue` adds
  // its own `FETCH_FREQUENCY` debounce on top. In the one case the budget is
  // for, a long export whose rate chain really does run out of time, the
  // client would then time out and destroy the socket before the engine
  // settled the remainder.
  if (arrivedAt == null) return Math.floor(ms)
  const left = ms - Math.max(0, Date.now() - arrivedAt)
  // Spent is not the same as unsaid. A caller whose deadline has passed is
  // not waiting, so the work should settle at once. `undefined`, which means
  // "no header", would give the route's own 90 s default to a request the
  // client has already abandoned, querying rates for nobody.
  if (left <= 0) return SPENT_BUDGET_MS
  return Math.floor(left)
}

/** What a spent budget answers: settle now, rather than "no header". */
export const SPENT_BUDGET_MS = 1

/**
 * The budget a client sends for its own timeout: a little less, so the
 * engine's answer can arrive.
 *
 * Sending the whole timeout would put the engine's settle at or after the
 * moment the client destroys the socket, because the budget is measured from
 * the engine's `arrivedAt`, after the send, and the reply still has to be
 * serialised and carried back. A listing that ran out of rates time would
 * then answer `REQUEST_TIMEOUT` instead of its `unpricedCount`. A tenth of
 * the timeout, at most two seconds, is the headroom.
 */
export function requestBudgetFor(timeoutMs: number): number {
  return Math.max(1, timeoutMs - Math.min(2000, Math.floor(timeoutMs / 10)))
}
