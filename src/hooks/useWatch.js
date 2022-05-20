// @flow

import { type EdgeAccount, type EdgeContext, type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'

import { useEffect, useState } from '../types/reactHooks.js'

/**
 * Subscribes to changes in a core object's property.
 *
 * Flow has trouble typing this, so use one of the named aliases below.
 */
function useWatch(object: any, name: string): any {
  const [out, setOut] = useState<any>(object[name])

  useEffect(() => {
    setOut(object[name])
    return object.watch(name, setOut)
  }, [object, name])

  return out
}

export const useWatchAccount: <Name: $Keys<EdgeAccount>>(account: EdgeAccount, name: Name) => $ElementType<EdgeAccount, Name> = useWatch

export const useWatchContext: <Name: $Keys<EdgeContext>>(context: EdgeContext, name: Name) => $ElementType<EdgeContext, Name> = useWatch

export const useWatchCurrencyConfig: <Name: $Keys<EdgeCurrencyConfig>>(config: EdgeCurrencyConfig, name: Name) => $ElementType<EdgeCurrencyConfig, Name> =
  useWatch

export const useWatchWallet: <Name: $Keys<EdgeCurrencyWallet>>(wallet: EdgeCurrencyWallet, name: Name) => $ElementType<EdgeCurrencyWallet, Name> = useWatch
