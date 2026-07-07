import { useEffect, useState } from 'react'

import {
  hasReverseLookupSupport,
  peekReverseLookupCache,
  reverseLookupName,
  type ReverseLookupResult
} from '../util/nameServices'

// Reverse-resolves an address to a human-readable name using whichever name
// services apply to the wallet's pluginId (ENS / UD / ZNS — see
// `nameServices.getReverseLookupServices`). Returns `null` until a name is
// found; never throws.
//
// Recycled-component safety: when the hook's inputs change (different row in
// a transaction list, different address typed into AddressTile2), we
// immediately reset to whatever the cache currently holds for the new key.
// Without this reset a prior row's resolved name could briefly leak onto the
// new row while the async lookup is in flight.
export const useReverseName = (
  pluginId: string,
  address: string | undefined
): ReverseLookupResult | null => {
  const enabled =
    address != null && address !== '' && hasReverseLookupSupport(pluginId)

  const [result, setResult] = useState<ReverseLookupResult | null>(
    enabled ? peekReverseLookupCache(pluginId, address) : null
  )

  useEffect(() => {
    if (!enabled || address == null) {
      setResult(null)
      return
    }
    setResult(peekReverseLookupCache(pluginId, address))
    let cancelled = false
    reverseLookupName(pluginId, address)
      .then(next => {
        if (!cancelled) setResult(next)
      })
      .catch((_err: unknown) => undefined)
    return () => {
      cancelled = true
    }
  }, [enabled, pluginId, address])

  return result
}
