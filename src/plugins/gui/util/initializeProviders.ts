import { ENV } from '../../../env'
import { findTokenIdByNetworkLocation, getTokenId } from '../../../util/CurrencyInfoHelpers'
import { makeUuid } from '../../../util/rnUtils'
import { FiatPluginFactoryArgs } from '../fiatPluginTypes'
import { FiatProvider, FiatProviderFactory } from '../fiatProviderTypes'
import { createStore } from '../pluginUtils'

// Filter providers for which API keys are set and are not explicitly
// disabled by disablePlugins.
// TODO: Address redundancy of plugin-disabling implementations: info
// server vs disablePlugins
export async function initializeProviders<T>(providerFactories: Array<FiatProviderFactory<T>>, params: FiatPluginFactoryArgs): Promise<Array<FiatProvider<T>>> {
  const { account, deviceId, disablePlugins } = params
  const providerPromises: Array<Promise<FiatProvider<T>>> = []

  const getTokenIdProvider = (pluginId: string, currencyCode: string) => getTokenId(account.currencyConfig[pluginId], currencyCode)
  const getTokenIdFromContract = (params: { pluginId: string; contractAddress: string }) => {
    const { pluginId, contractAddress } = params
    return findTokenIdByNetworkLocation({ account, pluginId, networkLocation: { contractAddress } })
  }

  for (const providerFactory of providerFactories) {
    if (disablePlugins[providerFactory.providerId]) continue

    const apiKeys = ENV.PLUGIN_API_KEYS[providerFactory.providerId as keyof typeof ENV.PLUGIN_API_KEYS]
    if (apiKeys == null) continue

    const store = createStore(providerFactory.storeId, account.dataStore)
    providerPromises.push(providerFactory.makeProvider({ deviceId, apiKeys, getTokenId: getTokenIdProvider, getTokenIdFromContract, io: { makeUuid, store } }))
  }

  return await Promise.all(providerPromises)
}
