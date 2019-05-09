// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import plugins from '../../../../assets/plugins.json'
import { LEGACY_PLUGINS } from '../../../../constants/indexConstants'

function loadPlugins (plugins: any, developerModeOn: boolean): Array<Object> {
  let addCustom = true
  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i]
    if (plugin.pluginId === 'custom') {
      addCustom = false
    }
  }
  if (developerModeOn && addCustom) {
    const devPlugin = {
      pluginId: 'custom',
      name: 'Custom Dev',
      subtitle: 'Development Testing',
      provider: 'Edge Wallet',
      iconUrl: 'http://edge.app/wp-content/uploads/2019/01/wyre-logo-square-small.png',
      environment: {},
      isLegacy: false
    }
    plugins.push(devPlugin)
  }
  return plugins.map(plugin => {
    console.log('pluginStuff: Lodaing plugin ', plugin)
    const baseDir = Platform.OS === 'android' ? 'android_asset' : RNFS.MainBundlePath
    const pluginPath = plugin.pluginURL ? plugin.pluginURL : `file:///${baseDir}/plugins/${plugin.pluginId}/index.html`
    const isLegacy = LEGACY_PLUGINS.includes(plugin.name)
    return {
      pluginId: plugin.pluginId,
      sourceFile: { uri: pluginPath },
      name: plugin.name,
      subtitle: plugin.subtitle,
      provider: plugin.provider,
      imageUrl: plugin.iconUrl,
      environment: plugin.environment,
      permissions: plugin.permissions || [],
      isLegacy
    }
  })
}

export function buySellPlugins (developerModeOn: boolean) {
  return loadPlugins(plugins.buysell, developerModeOn)
}

export function spendPlugins (developerModeOn: boolean) {
  return loadPlugins(plugins.spend, developerModeOn)
}
