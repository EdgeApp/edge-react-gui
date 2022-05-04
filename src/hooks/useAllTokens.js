// @flow

import { type EdgeAccount, type EdgeTokenMap } from 'edge-core-js'

import { useEffect, useState } from '../types/reactHooks'
import { getAllTokens } from '../util/CurrencyInfoHelpers'

type EdgeTokenMaps = { [pluginId: string]: EdgeTokenMap }

/**
 * Subscribes to all the tokens across all plugins in an account.
 */
export function useAllTokens(account: EdgeAccount): EdgeTokenMaps {
  // Gather the tokens from all the plugins:
  const [out, setOut] = useState<EdgeTokenMaps>(() => {
    const out: EdgeTokenMaps = {}
    for (const pluginId of Object.keys(account.currencyConfig)) {
      out[pluginId] = getAllTokens(account.currencyConfig[pluginId])
    }
    return out
  })

  // Watch for token changes on any of the plugins:
  useEffect(() => {
    const cleanups: Array<() => void> = []

    for (const pluginId of Object.keys(account.currencyConfig)) {
      const currencyConfig = account.currencyConfig[pluginId]
      function update(): void {
        setOut(out => ({ ...out, [pluginId]: getAllTokens(currencyConfig) }))
      }
      cleanups.push(currencyConfig.watch('builtinTokens', update))
      cleanups.push(currencyConfig.watch('customTokens', update))
    }

    return () => cleanups.forEach(cleanup => cleanup())
  }, [account])

  return out
}
