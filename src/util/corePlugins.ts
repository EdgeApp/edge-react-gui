import type { EdgeCorePluginsInit } from 'edge-core-js'

import { pluginMaps } from '../pluginMaps'
import {
  buildCurrencyPlugins,
  buildSwapPlugins,
  buildUtxoPlugins
} from './corePluginsTable'

export function buildAllPlugins(): EdgeCorePluginsInit {
  return {
    ...buildCurrencyPlugins(pluginMaps),
    ...buildSwapPlugins(pluginMaps)
  }
}

export let utxoPlugins: EdgeCorePluginsInit = buildUtxoPlugins(pluginMaps)
export let currencyPlugins: EdgeCorePluginsInit =
  buildCurrencyPlugins(pluginMaps)
export let swapPlugins: EdgeCorePluginsInit = buildSwapPlugins(pluginMaps)
export let allPlugins: EdgeCorePluginsInit = buildAllPlugins()

export function rebuildAllPlugins(): void {
  utxoPlugins = buildUtxoPlugins(pluginMaps)
  currencyPlugins = buildCurrencyPlugins(pluginMaps)
  swapPlugins = buildSwapPlugins(pluginMaps)
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
