import { ENV } from '../../env'
import { makeTronStakePlugin } from './currency/tronStakePlugin'
import { makeGenericStakePlugin } from './generic/GenericStakePlugin'
import { genericPlugins } from './generic/pluginInfo'
import { makeTcSaversPlugin } from './thorchainSavers/tcSaversPlugin'
import { StakePlugin } from './types'
import { makeUniV2StakePlugin } from './uniswapV2/uniV2Plugin'

// Return the memoized plugins and update them in the background for the next time this function is called
const loadedPluginsMap = new Map<string, StakePlugin[]>()

export const getStakePlugins = async (pluginId: string): Promise<StakePlugin[]> => {
  let loadedPlugins = loadedPluginsMap.get(pluginId)
  if (loadedPlugins != null) return loadedPlugins

  const tcInitOptions = typeof ENV.THORCHAIN_INIT === 'object' ? ENV.THORCHAIN_INIT : {}

  const promises = [
    makeUniV2StakePlugin(pluginId).catch(e => {
      console.warn(e.message)
    }),
    makeTcSaversPlugin(pluginId, { initOptions: tcInitOptions }).catch(e => {
      console.warn(e.message)
    }),
    makeTronStakePlugin(pluginId).catch(e => {
      console.warn(e.message)
    }),
    ...genericPlugins.map(async genericPlugin => {
      for (const config of genericPlugin.policyConfigs) {
        if (config.parentPluginId === pluginId) {
          return await makeGenericStakePlugin(genericPlugin)(/* INIT OPTIONS */).catch(e => {
            console.error(String(e))
          })
        }
      }
    })
  ]

  const results = await Promise.all(promises)

  loadedPlugins = results.filter((result): result is StakePlugin => result != null)
  loadedPluginsMap.set(pluginId, loadedPlugins)
  return loadedPlugins
}
