// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import { type GuiPlugin, type GuiPluginRow } from '../../types/GuiPluginTypes.js'

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

export const customPluginRow: GuiPluginRow = {
  pluginId: 'custom',
  addOnUrl: '',

  title: 'Custom Dev',
  description: '',
  partnerIconPath: undefined,
  paymentTypeLogoKey: 'credit',
  paymentTypes: [],
  cryptoCodes: []
}
