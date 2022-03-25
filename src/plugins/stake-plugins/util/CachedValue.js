// @flow

type CachedValue<T> = {
  ready: () => Promise<void>,
  get: () => T
}

export function makeCachedValue<T>(update: () => Promise<T>, ttl: number, defaultValue?: T): CachedValue<T> {
  let updatePromise: Promise<T> | null
  let nextUpdateTime: number = Date.now() + ttl
  const cached: { value: T | void } = { value: defaultValue }

  async function doUpdate(): Promise<T> {
    return update()
      .then(value => {
        cached.value = value
        nextUpdateTime = Date.now() + ttl
        return value
      })
      .catch(err => {
        console.error(`Error updating cached value: ${err}`)
        // Retry after 1 second
        return new Promise(resolve => {
          setTimeout(resolve, 1000)
        }).then(() => doUpdate())
      })
      .finally(() => {
        updatePromise = null
      })
  }

  // Immediately initialize value
  doUpdate()

  const instance: CachedValue<T> = {
    async ready(): Promise<void> {
      if (cached.value != null) return
      if (updatePromise == null) updatePromise = doUpdate()
      await updatePromise
    },
    get(): T {
      // First run case:
      if (cached.value == null) {
        throw new Error('Cached value is not ready. Await .ready() or provide a default value.')
      }
      // Ready for update case:
      if (updatePromise == null && Date.now() >= nextUpdateTime) updatePromise = doUpdate()

      return cached.value
    }
  }

  return instance
}
