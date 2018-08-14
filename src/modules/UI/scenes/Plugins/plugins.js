// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import plugins from '../../../../assets/plugins.json'

function loadPlugins (plugins: any): Array<Object> {
  return plugins.map(plugin => {
    const baseDir = Platform.OS === 'android' ? 'android_asset' : RNFS.MainBundlePath
    const pluginPath = `file:///${baseDir}/plugins/${plugin.pluginId}/index.html`
    return {
      pluginId: plugin.pluginId,
      sourceFile: { uri: pluginPath },
      name: plugin.name,
      subtitle: plugin.subtitle,
      provider: plugin.provider,
      imageUrl: plugin.iconUrl,
      environment: plugin.environment
    }
  })
}

export function buySellPlugins () {
  return loadPlugins(plugins.buysell)
}

export function spendPlugins () {
  return loadPlugins(plugins.spend)
}
