// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import assetPlugins from '../../../../assets/plugins.json'
import { EDGE_PLUGIN_REGIONS } from '../../../../constants/CountryConstants.js'
import { type BuySellPlugin } from '../../../../types/types.js'

const LEGACY_PLUGINS = ['Bitrefill']

const hostedBuySellPlugins: Array<BuySellPlugin> = [
  {
    pluginId: 'com.libertyx',
    uri: 'https://libertyx.com/a/',
    name: 'LibertyX',
    subtitle: 'Buy Bitcoin with cash or debit card at US merchants\nBTC\nFee: 3-8% / Settlement: Instant',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/05/libertyXlogo.png',
    permissions: ['location'],
    originWhitelist: ['https://libertyx.com'],
    type: ['buy']
  },
  {
    pluginId: 'io.moonpay.buy',
    uri: 'https://buy.moonpay.io?apiKey=pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy',
    name: 'MoonPay',
    subtitle: 'Buy crypto with credit card or Apple Pay\nBTC, ETH, XRP, LTC, BCH\nFee: 5.5% / Settlement: 10 mins',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/05/icon_black_small.png',
    type: ['buy']
  },
  {
    pluginId: 'com.safello',
    uri: 'https://safello.com/edge/',
    name: 'Safello',
    subtitle: 'Buy crypto with Swish (in Sweden) or credit card\nBTC, ETH, XRP, BCH\nFee: 5.75% / Settlement: Instant',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/06/Safello-Logo-Green-background.png',
    originWhitelist: ['https://safello.com', 'https://app.safello.com'],
    type: ['buy']
  },
  {
    pluginId: 'bitsofgold',
    uri: 'https://www.bitsofgold.co.il/order/sell?order_id=null&page=0&utm_source=Edge&utm_medium=mobile_app&utm_campaign=co',
    name: 'Bits of Gold',
    subtitle: 'Sell Bitcoin to bank account in Israel and Europe\nBTC\nFee: 5% / Settlement: 2 days',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/08/bits-of-gold-logo-sm.png',
    type: ['sell']
  },
  {
    pluginId: 'banxa',
    uri: 'https://edge.banxa.com',
    name: 'Banxa',
    subtitle: 'Buy crypto in Australia with POLi bank transfer or Newsagent\nBTC, ETH\nFee: 1-3% / Settlement: 5 min - 24 hrs',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/08/banxa.png',
    type: ['buy']
  }
]

const hostedSpendPlugins: Array<BuySellPlugin> = []

const devPlugin = {
  pluginId: 'custom',
  uri: 'https://edge.app',
  name: 'Custom Dev',
  subtitle: 'Development Testing',
  imageUrl: 'http://edge.app/wp-content/uploads/2019/01/wyre-logo-square-small.png',
  type: ['buy', 'sell']
}

function fixPlugins (plugins: Array<Object>): Array<BuySellPlugin> {
  const baseDir = Platform.OS === 'android' ? 'android_asset' : RNFS.MainBundlePath

  return plugins.map(plugin => {
    const pluginPath = `file:///${baseDir}/plugins/${plugin.pluginId}/index.html`

    return {
      imageUrl: plugin.iconUrl,
      isLegacy: LEGACY_PLUGINS.includes(plugin.name),
      ...plugin,
      uri: pluginPath
    }
  })
}

export const pluginSortWithoutType = (a: BuySellPlugin, b: BuySellPlugin) => {
  const aPriority = EDGE_PLUGIN_REGIONS.buy[a.name.toLowerCase()].priority
  const bPriority = EDGE_PLUGIN_REGIONS.buy[b.name.toLowerCase()].priority

  return aPriority - bPriority
}

export const pluginSortWithType = (a: BuySellPlugin, b: BuySellPlugin, type?: string) => {
  const aPriority = EDGE_PLUGIN_REGIONS[a.name.toLowerCase()].priority
  const bPriority = EDGE_PLUGIN_REGIONS[b.name.toLowerCase()].priority

  return aPriority - bPriority
}

export function buySellPlugins (developerModeOn: boolean, type?: string = ''): Array<BuySellPlugin> {
  const plugins = [...hostedBuySellPlugins, ...fixPlugins(assetPlugins.buysell)]
  let filteredPlugins = []
  if (type) {
    filteredPlugins = plugins.filter(plugin => {
      return EDGE_PLUGIN_REGIONS[type][plugin.name.toLowerCase()]
    })
    filteredPlugins.sort((a, b) => {
      const aPriority = EDGE_PLUGIN_REGIONS[type][a.name.toLowerCase()].priority
      const bPriority = EDGE_PLUGIN_REGIONS[type][b.name.toLowerCase()].priority
      return aPriority - bPriority
    })
  } else {
    filteredPlugins = plugins
      .filter(plugin => {
        return EDGE_PLUGIN_REGIONS.buy[plugin.name.toLowerCase()]
      })
      .sort(pluginSortWithoutType)
  }
  return developerModeOn ? [...filteredPlugins, devPlugin] : filteredPlugins
}

export function spendPlugins (developerModeOn: boolean): Array<BuySellPlugin> {
  const plugins = [...hostedSpendPlugins, ...fixPlugins(assetPlugins.spend)]
  plugins.sort(pluginSortWithoutType)
  return developerModeOn ? [...plugins, devPlugin] : plugins
}
