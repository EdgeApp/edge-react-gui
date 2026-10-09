/** What `raceTimeout` resolves to when the timer wins the race. */
export const TIMED_OUT: unique symbol = Symbol('timedOut')

/**
 * Keep a pending timer from holding a process open.
 *
 * Node's timer has `unref`; React Native's is a number and has none. A
 * deadline should never be the reason a program stays alive — the engine
 * holds a listening socket and the GUI a running app — and in a jest worker
 * an armed timer is a leaked handle that outlives the test.
 *
 * This race did not have it, and `withDeadline` did: a pending `raceTimeout`
 * kept Node's event loop awake for the rest of its window, which is the leak
 * `asyncWaterfall`'s stagger timers were fixed for. Both helpers share one
 * timer policy now, since the older, more discoverable name was the one
 * without it.
 */
export function unrefTimer(timer: unknown): void {
  if (
    typeof timer === 'object' &&
    timer != null &&
    typeof (timer as { unref?: unknown }).unref === 'function'
  ) {
    ;(timer as { unref: () => void }).unref()
  }
}

/**
 * Race `promise` against a timer. Resolves to the promise's value, or to
 * `TIMED_OUT` when `ms` elapses first, and rejects if the promise rejects
 * first. The timer is always cleared once the race settles, and unref'd
 * while it is pending, so neither a race that settles early nor one still
 * waiting keeps the runtime awake.
 *
 * Losing the race does not cancel `promise`: callers that still care about a
 * late result keep their own reference to it.
 *
 * `withDeadline` is this with a rejection instead of the sentinel, which is
 * what a caller whose timeout should land in an existing `catch` wants.
 */
export async function raceTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<typeof TIMED_OUT>(resolve => {
    timer = setTimeout(() => {
      resolve(TIMED_OUT)
    }, ms)
    unrefTimer(timer)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer != null) clearTimeout(timer)
  }
}
