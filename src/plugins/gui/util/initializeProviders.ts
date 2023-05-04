import { ENV } from '../../../env'
import { FiatPluginFactoryArgs } from '../fiatPluginTypes'
import { FiatProvider, FiatProviderFactory } from '../fiatProviderTypes'
import { createStore } from '../pluginUtils'

// Filter providers for which API keys are set and are not explicitly
// disabled by disablePlugins.
// TODO: Address redundancy of plugin-disabling implementations: info
// server vs disablePlugins
export async function initializeProviders(providerFactories: FiatProviderFactory[], params: FiatPluginFactoryArgs): Promise<FiatProvider[]> {
  const { account, disablePlugins } = params
  const providerPromises: Array<Promise<FiatProvider>> = []

  for (const providerFactory of providerFactories) {
    if (disablePlugins[providerFactory.providerId]) continue

    const apiKeys = ENV.PLUGIN_API_KEYS[providerFactory.providerId as keyof typeof ENV.PLUGIN_API_KEYS]
    if (apiKeys == null) continue

    const store = createStore(providerFactory.storeId, account.dataStore)
    providerPromises.push(providerFactory.makeProvider({ io: { store }, apiKeys }))
  }

  return await Promise.all(providerPromises)
}
