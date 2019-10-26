// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import { type BuySellPlugin, type PluginUrlMap } from '../../types/types.js'

const buyPlugins = require('./buyPlugins.json')
const sellPlugins = require('./sellPlugins.json')

const hostedUri = Platform.OS === 'android' ? 'file:///android_asset/plugins/' : `file:///${RNFS.MainBundlePath}/plugins/`

export const pluginUrlMap: { [pluginId: string]: PluginUrlMap } = {
  'com.libertyx': {
    pluginId: 'com.libertyx',
    uri: 'https://libertyx.com/a/',
    name: 'LibertyX',
    permissions: ['location'],
    originWhitelist: ['https://libertyx.com']
  },
  'io.moonpay.buy': {
    pluginId: 'io.moonpay.buy',
    uri: 'https://buy.moonpay.io?apiKey=pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy',
    name: 'MoonPay'
  },
  'com.safello': {
    pluginId: 'com.safello',
    uri: 'https://safello.com/edge/',
    name: 'Safello',
    originWhitelist: ['https://safello.com', 'https://app.safello.com']
  },
  bitsofgold: {
    pluginId: 'bitsofgold',
    uri: 'https://www.bitsofgold.co.il/order/sell?order_id=null&page=0&utm_source=Edge&utm_medium=mobile_app&utm_campaign=co&etag=true',
    name: 'Bits of Gold',
    permissions: ['camera']
  },
  banxa: {
    pluginId: 'banxa',
    uri: 'https://edge.banxa.com',
    name: 'Banxa',
    permissions: ['camera']
  },
  'co.edgesecure.simplex': {
    pluginId: 'co.edgesecure.simplex',
    uri: hostedUri + 'co.edgesecure.simplex/index.html',
    name: 'Simplex'
  },
  'co.edgesecure.wyre': {
    pluginId: 'co.edgesecure.wyre',
    uri: hostedUri + 'co.edgesecure.wyre/index.html',
    name: 'Wyre',
    supportEmail: 'support@sendwyre.com',
    permissions: ['camera']
  },
  'com.bity': {
    pluginId: 'com.bity',
    uri: hostedUri + 'com.bity/index.html',
    name: 'Bity',
    supportEmail: 'support@bity.com'
  },
  'co.edgesecure.bitrefill': {
    pluginId: 'co.edgesecure.bitrefill',
    uri: hostedUri + 'co.edgesecure.bitrefill/index.html',
    name: 'Bitrefill',
    isLegacy: true
  }
}

export const devPlugin: BuySellPlugin & PluginUrlMap = {
  pluginId: 'custom',
  uri: '',
  name: '',
  id: '',
  priority: 99,
  paymentType: '',
  description: '',
  title: 'Custom Dev',
  paymentTypeLogoKey: 'credit',
  partnerIconPath: '',
  cryptoCodes: [],
  supportEmail: '',
  permissions: [],
  isLegacy: false
}

export const collapsePlugins = function (pluginsRaw: Array<string | BuySellPlugin>, platform: string, countryCode: string): Array<BuySellPlugin> {
  const collapsedById: { [id: string]: BuySellPlugin } = {}

  // Collapse all
  pluginsRaw.forEach(pluginObjOrString => {
    if (typeof pluginObjOrString !== 'string') {
      let objToMerge
      if (pluginObjOrString.forPlatform && pluginObjOrString.forPlatform === platform) {
        objToMerge = pluginObjOrString
      } else if (pluginObjOrString.forCountries && pluginObjOrString.forCountries.includes(countryCode)) {
        objToMerge = pluginObjOrString
      } else if (!pluginObjOrString.forPlatform && !pluginObjOrString.forCountries) {
        objToMerge = pluginObjOrString
      }
      const id = pluginObjOrString.id
      collapsedById[id] = { ...collapsedById[id], ...objToMerge }
    }
  })
  const pluginsAll: Array<BuySellPlugin> = Object.keys(collapsedById).map((id: string) => collapsedById[id])

  // Filter by countryCode
  const pluginsFilteredByCountryCode: Array<BuySellPlugin> = pluginsAll.filter((pluginObj: BuySellPlugin) => {
    if (pluginObj.countryCodes) {
      return pluginObj.countryCodes[countryCode]
    }
    return false
  })

  // Delete countryCodes
  return pluginsFilteredByCountryCode.map(pluginObj => {
    delete pluginObj.countryCodes
    return pluginObj
  })
}

export const getBuyPlugins = function (platform: string, countryCode: string): Array<BuySellPlugin> {
  return collapsePlugins(buyPlugins, platform, countryCode)
}

export const getSellPlugins = function (platform: string, countryCode: string): Array<BuySellPlugin> {
  return collapsePlugins(sellPlugins, platform, countryCode)
}
