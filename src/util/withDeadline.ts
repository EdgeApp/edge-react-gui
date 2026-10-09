/**
 * Reject when `promise` has not settled inside `ms`.
 *
 * `raceTimeout` with a rejection instead of its `TIMED_OUT` sentinel: both
 * callers want the timeout to land in a `catch` they already have, and one
 * timer policy — cleared on settle, unref'd while pending — now lives in
 * that module, where the older and more discoverable name was the one
 * missing it.
 *
 * Its own module rather than a helper inside a caller, because two unrelated
 * paths need it: the rates queue, where one silent server wedged every rate
 * caller in the process, and the engine's boot, where the signed
 * `infoRollup` fetch runs after the run file is claimed and before the
 * socket exists. Both call through `asyncWaterfall`, whose `timeoutMs` is a
 * *per-server stagger* armed only `if (pending > 1)` — so the last remaining
 * server races against nothing and the whole call has no ceiling.
 * `keysServer.ts` and `keysStore.ts` both say so, and that contract is
 * deliberately left alone: the bound belongs to the caller, and this is what
 * a caller uses.
 */
import { raceTimeout, TIMED_OUT } from './raceTimeout'

export async function withDeadline<T>(
  promise: Promise<T>,
  ms: number,
  what: string
): Promise<T> {
  const result = await raceTimeout(promise, ms)
  if (result === TIMED_OUT) throw new Error(`${what} within ${ms}ms`)
  return result
}
