import type { EdgeCorePluginsInit } from 'edge-core-js'

import { CONFIG } from '../config'
import { pluginMaps } from '../pluginMaps'
import {
  buildCurrencyPlugins,
  buildSwapPlugins,
  buildUtxoPlugins,
  type CorePluginMaps
} from './corePluginsTable'

/** The table's inputs: the resolved plugin maps, and whether this is a beta build. */
function tableInputs(): CorePluginMaps {
  return {
    corePlugins: pluginMaps.corePlugins,
    swapPlugins: pluginMaps.swapPlugins,
    betaFeatures: CONFIG.BETA_FEATURES
  }
}

export function buildAllPlugins(): EdgeCorePluginsInit {
  return {
    ...buildCurrencyPlugins(tableInputs()),
    ...buildSwapPlugins(tableInputs())
  }
}

export let utxoPlugins: EdgeCorePluginsInit = buildUtxoPlugins(tableInputs())
export let currencyPlugins: EdgeCorePluginsInit = buildCurrencyPlugins(
  tableInputs()
)
export let swapPlugins: EdgeCorePluginsInit = buildSwapPlugins(tableInputs())
export let allPlugins: EdgeCorePluginsInit = buildAllPlugins()

export function rebuildAllPlugins(): void {
  utxoPlugins = buildUtxoPlugins(tableInputs())
  currencyPlugins = buildCurrencyPlugins(tableInputs())
  swapPlugins = buildSwapPlugins(tableInputs())
  allPlugins = buildAllPlugins()
}

/**
 * Whether a currency plugin is enabled for this build.
 *
 * UI that shows a currency's features has to ask this rather than testing
 * `pluginMaps.corePlugins[id]` itself: several plugins default to enabled when the
 * config file omits them (`fio` among them), so an absent entry means "on"
 * here and would read as "off" there - hiding the feature while the plugin
 * runs.
 */
export function isCurrencyPluginEnabled(pluginId: string): boolean {
  const init = currencyPlugins[pluginId]
  return init != null && init !== false
}
