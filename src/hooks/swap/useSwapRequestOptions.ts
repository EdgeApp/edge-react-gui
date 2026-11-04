import type { EdgeSwapRequestOptions } from 'edge-core-js'
import { useMemo } from 'react'

import { useSelector } from '../../types/reactRedux'
import { makeSwapRequestOptions } from '../../util/swapRequestOptions'

/**
 * Finds the current swap settings,
 * based on the current user preferences and active promotions.
 */
export const useSwapRequestOptions = (): EdgeSwapRequestOptions => {
  const referralCache = useSelector(state => state.account.referralCache)
  const accountReferral = useSelector(state => state.account.accountReferral)
  const preferredSwapPluginId = useSelector(
    state => state.ui.settings.preferredSwapPluginId
  )
  const preferredSwapPluginType = useSelector(
    state => state.ui.settings.preferredSwapPluginType
  )
  const disablePlugins = useSelector(
    state => state.ui.exchangeInfo.swap.disablePlugins
  )

  return useMemo((): EdgeSwapRequestOptions => {
    const { options, swapSource } = makeSwapRequestOptions({
      accountPlugins: referralCache.accountPlugins,
      accountReferral,
      preferredSwapPluginId,
      preferredSwapPluginType,
      disablePlugins
    })
    if (options.preferPluginId != null) {
      const reason =
        swapSource.type === 'promotion'
          ? 'promo ' + swapSource.installerId
          : swapSource.type
      console.log(`Preferring ${options.preferPluginId} from ${reason}`)
    }
    return options
  }, [
    accountReferral,
    disablePlugins,
    preferredSwapPluginId,
    preferredSwapPluginType,
    referralCache.accountPlugins
  ])
}
