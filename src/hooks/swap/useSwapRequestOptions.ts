import { EdgeSwapRequestOptions } from 'edge-core-js'
import { useMemo } from 'react'

import { useSelector } from '../../types/reactRedux'
import { bestOfPlugins } from '../../util/ReferralHelpers'

/**
 * Finds the current swap settings,
 * based on the current user preferences and active promotions.
 */
export const useSwapRequestOptions = (): EdgeSwapRequestOptions => {
  const referralCache = useSelector(state => state.account.referralCache)
  const accountReferral = useSelector(state => state.account.accountReferral)
  const preferredSwapPluginId = useSelector(state => state.ui.settings.preferredSwapPluginId)
  const preferredSwapPluginType = useSelector(state => state.ui.settings.preferredSwapPluginType)
  const disablePlugins = useSelector(state => state.ui.exchangeInfo.swap.disablePlugins)

  return useMemo((): EdgeSwapRequestOptions => {
    // Find preferred swap provider:
    const activePlugins = bestOfPlugins(referralCache.accountPlugins, accountReferral, preferredSwapPluginId)
    const preferPluginId = activePlugins.preferredSwapPluginId
    if (preferPluginId != null) {
      const { swapSource } = activePlugins
      const reason = swapSource.type === 'promotion' ? 'promo ' + swapSource.installerId : swapSource.type
      console.log(`Preferring ${preferPluginId} from ${reason}`)
    }
    return {
      disabled: { ...activePlugins.disabled, ...disablePlugins },
      noResponseMs: 60 * 1000,
      preferPluginId,
      preferType: preferredSwapPluginType,
      promoCodes: activePlugins.promoCodes,
      slowResponseMs: 10 * 1000
    }
  }, [accountReferral, disablePlugins, preferredSwapPluginId, preferredSwapPluginType, referralCache.accountPlugins])
}
