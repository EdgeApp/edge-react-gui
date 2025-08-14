import { showError } from '../components/services/AirshipInstance'

const runRegistry = new Map<string, Promise<any>>()

/**
 * Runtime-only once-per-app-run utility
 * Ensures a function executes at most once for a given key during the JS runtime.
 */
export const runOnce = async <T>(
  key: string,
  fn: () => Promise<T> | T
): Promise<T | undefined> => {
  const existing = runRegistry.get(key)
  if (existing != null) return await existing

  const promise = Promise.resolve()
    .then(async () => await fn())
    .catch(error => {
      showError(error, { tag: key })
      runRegistry.delete(key)
      return undefined
    })

  runRegistry.set(key, promise)
  return await promise
}
