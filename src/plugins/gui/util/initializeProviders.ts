import { pluginMaps } from '../../../pluginMaps'
import {
  findTokenIdByNetworkLocation,
  getTokenId
} from '../../../util/CurrencyInfoHelpers'
import { makeUuid } from '../../../util/rnUtils'
import type { FiatPluginFactoryArgs } from '../fiatPluginTypes'
import type { FiatProvider, FiatProviderFactory } from '../fiatProviderTypes'
import { createStore } from '../pluginUtils'

// Filter providers for which API keys are set and are not explicitly
// disabled by disablePlugins.
// TODO: Address redundancy of plugin-disabling implementations: info
// server vs disablePlugins
export async function initializeProviders<T>(
  providerFactories: Array<FiatProviderFactory<T>>,
  params: FiatPluginFactoryArgs
): Promise<Array<FiatProvider<T>>> {
  const { account, deviceId, disablePlugins } = params
  const providerPromises: Array<Promise<FiatProvider<T>>> = []

  const getTokenIdProvider = (
    pluginId: string,
    currencyCode: string
  ): ReturnType<typeof getTokenId> =>
    getTokenId(account.currencyConfig[pluginId], currencyCode)
  const getTokenIdFromContract = (params: {
    pluginId: string
    contractAddress: string
  }): ReturnType<typeof findTokenIdByNetworkLocation> => {
    const { pluginId, contractAddress } = params
    return findTokenIdByNetworkLocation({
      account,
      pluginId,
      networkLocation: { contractAddress }
    })
  }

  for (const providerFactory of providerFactories) {
    if (disablePlugins[providerFactory.providerId]) continue

    const apiKeys = pluginMaps.guiApiKeys[providerFactory.providerId]
    // A bare boolean means "enabled in config.json, but no credentials on the
    // keys side yet" — the shipped state whenever slimKeysJson has stripped
    // the plugin maps and the signed appKeys fetch has not landed. Passing it
    // through reaches the provider's `asApiKeys` cleaner and throws.
    //
    // Only the boolean sentinels are rejected: a provider's apiKeys may
    // legitimately be a bare string (moonpay and Bitrefill both are, and
    // moonpayProvider's `asApiKeys` is `asString`), so a `typeof !== 'object'`
    // test would silently drop them from the quote list.
    if (apiKeys == null || typeof apiKeys === 'boolean') continue

    const store = createStore(providerFactory.storeId, account.dataStore)
    providerPromises.push(
      providerFactory.makeProvider({
        deviceId,
        apiKeys,
        getTokenId: getTokenIdProvider,
        getTokenIdFromContract,
        io: { makeUuid, store }
      })
    )
  }

  // One provider with a malformed key entry must not take down the whole
  // buy/sell scene, so failures are dropped rather than rejecting the batch.
  const results = await Promise.allSettled(providerPromises)
  const providers: Array<FiatProvider<T>> = []
  for (const result of results) {
    if (result.status === 'fulfilled') providers.push(result.value)
    else console.warn('initializeProviders: provider failed', result.reason)
  }
  return providers
}
