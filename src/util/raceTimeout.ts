/** What `raceTimeout` resolves to when the timer wins the race. */
export const TIMED_OUT: unique symbol = Symbol('timedOut')

/**
 * Race `promise` against a timer. Resolves to the promise's value, or to
 * `TIMED_OUT` when `ms` elapses first, and rejects if the promise rejects
 * first. The timer is always cleared once the race settles, so a race that
 * settles early does not keep the runtime awake for the rest of the window.
 * Losing the race does not cancel `promise`: callers that still care about a
 * late result keep their own reference to it.
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
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer != null) clearTimeout(timer)
  }
}
