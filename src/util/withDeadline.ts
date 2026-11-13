/**
 * Reject when `promise` has not settled inside `ms`.
 *
 * `raceTimeout` with a rejection instead of its `TIMED_OUT` sentinel: its
 * callers want the timeout to land in a `catch` they already have, and the
 * timer policy, cleared on settle and unref'd while pending, lives in that
 * module.
 *
 * Its own module rather than a helper inside a caller, because unrelated
 * paths need it, among them the rates queue, where one silent server would
 * wedge every rate caller in the process, and the engine's boot, where the
 * signed `infoRollup` fetch runs after the run file is claimed and before the
 * socket exists. Both of those call through `asyncWaterfall`, whose
 * `timeoutMs` is a *per-server stagger* armed only while another server is
 * left to start, so the last remaining server races against nothing and the
 * whole call has no ceiling. `keysServer.ts` and `keysStore.ts` both say so,
 * and `asyncWaterfall` keeps that contract on purpose: the bound belongs to
 * the caller, and this is what a caller uses.
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
