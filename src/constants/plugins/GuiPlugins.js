// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import { type GuiPlugin, type GuiPluginRow } from '../../types/GuiPluginTypes.js'

const hostedUri = Platform.OS === 'android' ? 'file:///android_asset/plugins/' : `file:///${RNFS.MainBundlePath}/plugins/`

export const guiPlugins: { [pluginId: string]: GuiPlugin } = {
  libertyx: {
    pluginId: 'libertyx',
    storeId: 'com.libertyx',
    baseUri: 'https://libertyx.com/a',
    displayName: 'LibertyX',
    originWhitelist: ['https://libertyx.com'],
    permissions: ['location']
  },
  moonpay: {
    pluginId: 'moonpay',
    storeId: 'io.moonpay.buy',
    baseUri: 'https://buy.moonpay.io',
    baseQuery: { apiKey: 'pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy' },
    queryPromoCode: 'apiKey',
    displayName: 'MoonPay'
  },
  safello: {
    pluginId: 'safello',
    storeId: 'com.safello',
    baseUri: 'https://safello.com/edge',
    displayName: 'Safello',
    originWhitelist: ['https://safello.com', 'https://app.safello.com', 'http://safello.com']
  },
  'safello-sell': {
    pluginId: 'safello-sell',
    storeId: 'com.safello',
    baseUri: 'https://app.safello.com',
    displayName: 'Safello',
    originWhitelist: ['https://safello.com', 'https://app.safello.com', 'http://safello.com']
  },
  bitsofgold: {
    pluginId: 'bitsofgold',
    storeId: 'bitsofgold',
    baseUri: 'https://www.bitsofgold.co.il',
    queryPromoCode: 'promo_code',
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
    lockUriPath: true,
    displayName: 'Simplex'
  },
  wyre: {
    pluginId: 'wyre',
    storeId: 'co.edgesecure.wyre',
    baseUri: hostedUri + 'co.edgesecure.wyre/index.html',
    lockUriPath: true,
    displayName: 'Wyre',
    permissions: ['camera']
    // supportEmail: 'support@sendwyre.com'
  },
  bity: {
    pluginId: 'bity',
    storeId: 'com.bity',
    baseUri: hostedUri + 'com.bity/index.html',
    lockUriPath: true,
    queryPromoCode: 'client_value',
    displayName: 'Bity'
    // supportßEmail: 'support@bity.com'
  },
  bitrefill: {
    pluginId: 'bitrefill',
    storeId: 'co.edgesecure.bitrefill',
    baseUri: hostedUri + 'co.edgesecure.bitrefill/index.html',
    lockUriPath: true,
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
  transak: {
    pluginId: 'transak',
    storeId: 'transak',
    baseUri: 'https://global.transak.com',
    baseQuery: { apiKey: '07c66ef7-33e4-47dd-b036-c8d28a50d962', themeColor: '0D2145', disableWalletAddressForm: 'true' },
    displayName: 'Transak',
    permissions: ['camera']
  },
  bitaccess: {
    pluginId: 'bitaccess',
    storeId: 'bitaccess',
    baseUri: 'https://edge.bitaccessbtm.com',
    displayName: 'Bitaccess',
    permissions: ['location', 'camera']
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
  deepPath: '',
  deepQuery: {},

  title: 'Custom Dev',
  description: '',
  partnerIconPath: undefined,
  paymentTypeLogoKey: 'credit',
  paymentTypes: [],
  cryptoCodes: []
}
