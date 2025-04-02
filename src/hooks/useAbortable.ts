import { useHandler } from './useHandler'

type CheckAbortFn = <T>(value: T) => T

interface Abortable<R> {
  promise: Promise<R>
  abort: () => void
}

type AbortableRoutine<Args extends unknown[], R> = (...args: Args) => Promise<R>

export class AbortError extends Error {}

/**
 * A utility to handle abortable async routines.
 *
 * Example usage:
 *
 * ```ts
 * const routine = useAbortable((maybeAbort) => async () => {
 *   await doSomething().then(maybeAbort)
 *   await doSomethingElse().then(maybeAbort)
 * })
 *
 * const { abort, promise } = routine()
 * // Await the promise or call abort to abort the promise
 * ```
 *
 * @param definition - A function used to define your `CancellableRoutine`
 *   function. The function will be called with a `abort` function that
 *   will throw a `AbortError` if the promise is aborted.
 * @returns A promise and a function to abort the promise.
 */
export const useAbortable = <Args extends unknown[], R>(definition: (maybeAbort: CheckAbortFn) => AbortableRoutine<Args, R>) => {
  const handler = useHandler((...args: Args): Abortable<R> => {
    let shouldAbort = false
    function maybeAbort<T>(value: T): T {
      if (shouldAbort) {
        throw new AbortError()
      }
      return value
    }

    const promise = definition(maybeAbort)(...args)

    return {
      promise,
      abort: () => {
        shouldAbort = true
      }
    }
  })

  return handler
}
