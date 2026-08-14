import { CONFIG } from './config'
import { type PluginMaps, resolvePluginMaps } from './configKeysMerge'
import { KEYS } from './keys'

/**
 * Resolved plugin init maps (config enablement flags merged with keys secrets).
 * Rebuilt in place whenever remote/cache keys are applied.
 */
export const pluginMaps: PluginMaps = resolvePluginMaps(CONFIG, KEYS)

/** Rebuild `pluginMaps` from the current CONFIG + KEYS (mutates in place). */
export function rebuildPluginMaps(): void {
  const next = resolvePluginMaps(CONFIG, KEYS)
  pluginMaps.corePlugins = next.corePlugins
  pluginMaps.swapPlugins = next.swapPlugins
  pluginMaps.guiApiKeys = next.guiApiKeys
  pluginMaps.rampPlugins = next.rampPlugins
}
