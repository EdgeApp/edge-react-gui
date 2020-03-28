// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import { type BuySellPlugin, type GuiPlugin } from '../../types/GuiPluginTypes.js'

const buyPlugins = require('./buyPluginList.json')
const sellPlugins = require('./sellPluginList.json')

const hostedUri = Platform.OS === 'android' ? 'file:///android_asset/plugins/' : `file:///${RNFS.MainBundlePath}/plugins/`

export const guiPlugins: { [pluginId: string]: GuiPlugin } = {
  libertyx: {
    pluginId: 'libertyx',
    storeId: 'com.libertyx',
    baseUri: 'https://libertyx.com/a/',
    displayName: 'LibertyX',
    originWhitelist: ['https://libertyx.com'],
    permissions: ['location']
  },
  moonpay: {
    pluginId: 'moonpay',
    storeId: 'io.moonpay.buy',
    baseUri: 'https://buy.moonpay.io?apiKey=pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy',
    displayName: 'MoonPay'
  },
  safello: {
    pluginId: 'safello',
    storeId: 'com.safello',
    baseUri: 'https://safello.com/edge/',
    displayName: 'Safello',
    originWhitelist: ['https://safello.com', 'https://app.safello.com', 'http://safello.com']
  },
  'safello-sell': {
    pluginId: 'safello-sell',
    storeId: 'com.safello',
    baseUri: 'https://app.safello.com/',
    displayName: 'Safello',
    originWhitelist: ['https://safello.com', 'https://app.safello.com', 'http://safello.com']
  },
  bitsofgold: {
    pluginId: 'bitsofgold',
    storeId: 'bitsofgold',
    baseUri: 'https://www.bitsofgold.co.il/order/',
    displayName: 'Bits of Gold',
    permissions: ['camera']
  },
  banxa: {
    pluginId: 'banxa',
    storeId: 'banxa',
    baseUri: 'https://edge.banxa.com',
    displayName: 'Banxa',
    permissions: ['camera']
  },
  simplex: {
    pluginId: 'simplex',
    storeId: 'co.edgesecure.simplex',
    baseUri: hostedUri + 'co.edgesecure.simplex/index.html',
    displayName: 'Simplex'
  },
  wyre: {
    pluginId: 'wyre',
    storeId: 'co.edgesecure.wyre',
    baseUri: hostedUri + 'co.edgesecure.wyre/index.html',
    displayName: 'Wyre',
    permissions: ['camera']
    // supportEmail: 'support@sendwyre.com'
  },
  bity: {
    pluginId: 'bity',
    storeId: 'com.bity',
    baseUri: hostedUri + 'com.bity/index.html',
    displayName: 'Bity'
    // supportßEmail: 'support@bity.com'
  },
  bitrefill: {
    pluginId: 'bitrefill',
    storeId: 'co.edgesecure.bitrefill',
    baseUri: hostedUri + 'co.edgesecure.bitrefill/index.html',
    displayName: 'Bitrefill',
    isLegacy: true
  },
  cred: {
    pluginId: 'cred',
    storeId: 'cred',
    baseUri: 'https://earn.mycred.io/edge',
    displayName: 'Cred',
    permissions: ['camera']
  },
  custom: {
    pluginId: 'custom',
    storeId: 'custom',
    baseUri: '',
    displayName: 'Custom Plugin',
    permissions: ['camera', 'location']
  }
}

export const devPlugin: BuySellPlugin = {
  pluginId: 'custom',
  id: '',
  priority: 99,
  paymentType: '',
  description: '',
  title: 'Custom Dev',
  paymentTypeLogoKey: 'credit',
  partnerIconPath: '',
  cryptoCodes: []
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
