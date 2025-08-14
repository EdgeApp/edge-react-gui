const runRegistry = new Map<string, Promise<any> | true>()

/**
 * Runtime-only once-per-app-run utility
 * Ensures a function executes at most once for a given key during the JS runtime.
 */
export const runOnce = async <T>(
  key: string,
  fn: () => Promise<T> | T
): Promise<T | undefined> => {
  const existing = runRegistry.get(key)
  if (existing != null) {
    if (existing === true) return undefined
    return await existing
  }

  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      runRegistry.set(key, true)
    })
  runRegistry.set(key, promise)
  return await promise
}
