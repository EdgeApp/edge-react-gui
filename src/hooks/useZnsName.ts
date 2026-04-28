import { useEffect, useState } from 'react'

import { reverseResolveZnsAddress } from '../util/zns'

const cache = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()

export const clearZnsLookupCache = (): void => {
  cache.clear()
  inflight.clear()
}

const lookupZnsName = async (address: string): Promise<string | null> => {
  if (cache.has(address)) return cache.get(address) ?? null
  let promise = inflight.get(address)
  if (promise == null) {
    promise = reverseResolveZnsAddress(address).catch((_err: unknown) => null)
    inflight.set(address, promise)
  }
  const result = await promise
  cache.set(address, result)
  inflight.delete(address)
  return result
}

export const useZnsName = (
  pluginId: string,
  address: string | undefined
): string | null => {
  const enabled = pluginId === 'zcash' && address != null && address !== ''
  const [name, setName] = useState<string | null>(
    enabled ? cache.get(address) ?? null : null
  )

  useEffect(() => {
    if (!enabled) {
      // Clear stale name when the hook is disabled (e.g. component recycled
      // onto a non-zcash row, or address became undefined).
      setName(null)
      return
    }
    // Reset to the current cache value (or null) immediately on address
    // change so a recycled component doesn't briefly show the prior row's
    // resolved name while the async lookup is in flight.
    setName(cache.get(address) ?? null)
    let cancelled = false
    lookupZnsName(address)
      .then(result => {
        if (!cancelled) setName(result)
      })
      .catch((_err: unknown) => null)
    return () => {
      cancelled = true
    }
  }, [enabled, address])

  return name
}
