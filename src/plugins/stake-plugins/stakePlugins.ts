import type { JsonObject } from 'edge-core-js'

import { ENV } from '../../env'
import { makeTronStakePlugin } from './currency/tronStakePlugin'
import { makeGenericStakePlugin } from './generic/GenericStakePlugin'
import { genericPlugins } from './generic/pluginInfo'
import { makeTcSaversPlugin } from './thorchainSavers/tcSaversPlugin'
import { makeTcSaversPluginSegwit } from './thorchainSavers/tcSaversPluginSegwit'
import type { StakePlugin } from './types'
import { makeUniV2StakePlugin } from './uniswapV2/uniV2Plugin'

// Return the memoized plugins and update them in the background for the next time this function is called
const loadedPluginsMap = new Map<string, StakePlugin[]>()

export const getStakePlugins = async (
  pluginId: string
): Promise<StakePlugin[]> => {
  let loadedPlugins = loadedPluginsMap.get(pluginId)
  if (loadedPlugins != null) return loadedPlugins

  const thorchainInit = ENV.swapPlugins.thorchain
  const tcInitOptions: JsonObject =
    typeof thorchainInit === 'object' && thorchainInit != null
      ? (thorchainInit as JsonObject)
      : {}

  const promises = [
    makeUniV2StakePlugin(pluginId).catch((e: unknown) => {
      console.warn(e instanceof Error ? e.message : String(e))
    }),
    makeTcSaversPlugin(pluginId, { initOptions: tcInitOptions }).catch(
      (e: unknown) => {
        console.warn(e instanceof Error ? e.message : String(e))
      }
    ),
    makeTcSaversPluginSegwit(pluginId, { initOptions: tcInitOptions }).catch(
      (e: unknown) => {
        console.warn(e instanceof Error ? e.message : String(e))
      }
    ),
    makeTronStakePlugin(pluginId).catch((e: unknown) => {
      console.warn(e instanceof Error ? e.message : String(e))
    }),
    ...genericPlugins.map(async genericPlugin => {
      for (const config of genericPlugin.policyConfigs) {
        if (config.parentPluginId === pluginId) {
          return await makeGenericStakePlugin(
            genericPlugin
          )(/* INIT OPTIONS */).catch((e: unknown) => {
            console.error(String(e))
          })
        }
      }
    })
  ]

  const results = await Promise.all(promises)

  loadedPlugins = results.filter(
    (result): result is StakePlugin => result != null
  )
  loadedPluginsMap.set(pluginId, loadedPlugins)
  return loadedPlugins
}
