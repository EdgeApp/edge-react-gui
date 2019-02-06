// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import ENV from '../../../../../env.json'
import plugins from '../../../../assets/plugins.json'

function loadPlugins (plugins: any): Array<Object> {
  if (ENV.PLUGIN_DEV) {
    const devPlugin = {
      pluginId: 'custom',
      name: 'Custom Dev',
      subtitle: 'Development Testing',
      provider: 'Edge Wallet',
      iconUrl: 'http://edge.app/wp-content/uploads/2019/01/wyre-logo-square-small.png',
      environment: {}
    }
    plugins.push(devPlugin)
  }
  return plugins.map(plugin => {
    console.log('Lodaing plugin ', plugin)
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
