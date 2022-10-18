import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import { creditCardPlugin } from '../../plugins/gui/creditCardPlugin'
import { GuiPlugin, GuiPluginRow } from '../../types/GuiPluginTypes'

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
  creditcard: {
    pluginId: 'creditcard',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: creditCardPlugin,
    displayName: 'Credit Card'
  },
  iach: {
    pluginId: 'creditcard',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: creditCardPlugin,
    displayName: 'Instant ACH'
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
    permissions: ['camera'],
    fixCurrencyCodes: {
      ETH: { pluginId: 'ethereum' },
      BTC: { pluginId: 'bitcoin' },
      DAI: { pluginId: 'ethereum', tokenId: '6b175474e89094c44da98b954eedeac495271d0f' },
      USDC: { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }
    }
    // supportEmail: 'support@sendwyre.com'
  },
  bity: {
    pluginId: 'bity',
    storeId: 'com.bity',
    baseUri: hostedUri + 'com.bity/index.html',
    lockUriPath: true,
    needsCountryCode: true,
    queryPromoCode: 'client_value',
    displayName: 'Bity'
    // supportßEmail: 'support@bity.com'
  },
  bitrefill: {
    pluginId: 'bitrefill',
    storeId: 'co.edgesecure.bitrefill',
    baseUri: 'https://embed.bitrefill.com/?ref=nUqaI7Qe&theme=dark&paymentMethods=bitcoin,ethereum,dogecoin,litecoin,dash',
    lockUriPath: true,
    displayName: 'Bitrefill'
  },
  bitaccess: {
    pluginId: 'bitaccess',
    storeId: 'bitaccess',
    baseUri: 'https://edge.bitaccessbtm.com',
    displayName: 'Bitaccess',
    permissions: ['location', 'camera']
  },
  xanpool: {
    pluginId: 'xanpool',
    storeId: 'xanpool',
    baseUri: 'https://widget.xanpool.com',
    baseQuery: { apiKey: 'ae524a0144ccd8dc087af39eabb7a02a', isWebView: 'true' },
    displayName: 'Xanpool',
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
  deepPath: '',
  deepQuery: {},

  title: 'Custom Dev',
  description: '',
  partnerIconPath: undefined,
  paymentTypeLogoKey: 'paynow',
  paymentTypes: [],
  cryptoCodes: []
}
