/**
 * How long the caller is still waiting, carried to the engine.
 *
 * The engine is a long-lived daemon and a handler runs to completion whether
 * or not anyone reads the answer, so for most routes the client's deadline is
 * the client's business. `get-transactions` is the exception: its historical
 * fiat fill is a chain of up to 99-key requests, and when the chain's budget
 * expires the remainder is *settled* rather than retried — on an export that
 * is an arbitrary tail of the oldest transactions. The budget was a module
 * constant, so `--timeout`, the one control the CLI offers for "slow is
 * better than wrong", moved only `apiClient`'s own deadline and had no effect
 * on the work it was waiting for.
 *
 * A header rather than a query field, because it is a property of the call
 * and not of the request: no route declares it, nothing in the reference
 * takes it, and a route that ignores it behaves exactly as before.
 *
 * Node-safe, and shared by both halves so the spelling cannot drift.
 */
import type { IncomingMessage } from 'http'

export const REQUEST_BUDGET_HEADER = 'x-edge-timeout-ms'

/** Node's 32-bit timer ceiling, the same one `schemas.ts` refuses above. */
const MAX_BUDGET_MS = 2 ** 31 - 1

/**
 * The caller's remaining budget, or undefined when it did not say.
 *
 * Anything unparseable, non-positive or past the timer ceiling is treated as
 * "did not say": this is a hint that lets a route finish sooner, so a
 * malformed one must not be able to make a route finish *instantly*, which
 * is what a `0` or an overflowed timer would do.
 */
export function readRequestBudgetMs(
  req: IncomingMessage | undefined
): number | undefined {
  // `undefined` for a handler driven directly, which is how the jest suites
  // reach these bodies: they hand a route the cleaned value a request would
  // have produced, and there is no `IncomingMessage` behind it.
  const raw = req?.headers[REQUEST_BUDGET_HEADER]
  const text = Array.isArray(raw) ? raw[0] : raw
  if (text == null || text === '') return undefined
  const ms = Number(text)
  if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_BUDGET_MS) return undefined
  return Math.floor(ms)
}
