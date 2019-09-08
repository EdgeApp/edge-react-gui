// @flow

import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import type { BuySellPlugin } from '../../types/types.js'
import { buyPluginFilter } from './buyPluginFilter.js'
import { sellPluginFilter } from './sellPluginFilter.js'

const hostedUri = Platform.OS === 'android' ? 'file:///android_asset/plugins/' : `file:///${RNFS.MainBundlePath}/plugins/`

export const allPlugins: Array<BuySellPlugin> = [
  {
    pluginId: 'com.libertyx',
    uri: 'https://libertyx.com/a/',
    name: 'LibertyX',
    subtitle: 'Buy Bitcoin with cash or debit card at US merchants\nBTC\nFee: 3-8% / Settlement: Instant',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/05/libertyXlogo.png',
    permissions: ['location'],
    originWhitelist: ['https://libertyx.com']
  },
  {
    pluginId: 'io.moonpay.buy',
    uri: 'https://buy.moonpay.io?apiKey=pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy',
    name: 'MoonPay',
    subtitle: 'Buy crypto with credit card or Apple Pay\nBTC, ETH, XRP, LTC, BCH\nFee: 5.5% / Settlement: 10 mins',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/05/icon_black_small.png'
  },
  {
    pluginId: 'com.safello',
    uri: 'https://safello.com/edge/',
    name: 'Safello',
    subtitle: 'Buy crypto with Swish (in Sweden) or credit card\nBTC, ETH, XRP, BCH\nFee: 5.75% / Settlement: Instant',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/06/Safello-Logo-Green-background.png',
    originWhitelist: ['https://safello.com', 'https://app.safello.com']
  },
  {
    pluginId: 'bitsofgold',
    uri: 'https://www.bitsofgold.co.il/order/sell?order_id=null&page=0&utm_source=Edge&utm_medium=mobile_app&utm_campaign=co',
    name: 'Bits of Gold',
    subtitle: 'Sell Bitcoin to bank account in Israel and Europe\nBTC\nFee: 5% / Settlement: 2 days',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/08/bits-of-gold-logo-sm.png'
  },
  {
    pluginId: 'banxa',
    uri: 'https://edge.banxa.com',
    name: 'Banxa',
    subtitle: 'Buy crypto in Australia with POLi bank transfer or Newsagent\nBTC, ETH\nFee: 1-3% / Settlement: 5 min - 24 hrs',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/08/banxa.png'
  },
  {
    pluginId: 'co.edgesecure.simplex',
    uri: hostedUri + 'co.edgesecure.simplex/index.html',
    name: 'Simplex',
    subtitle: 'Buy or sell crypto with a credit card\nBTC, ETH, BCH, LTC, XRP\nFee: 6% / Settlement: 1-48 hours',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/03/simplex-logo-sm-square.png'
  },
  {
    pluginId: 'co.edgesecure.wyre',
    uri: hostedUri + 'co.edgesecure.wyre/index.html',
    name: 'Wyre',
    subtitle: 'Buy or sell crypto with US bank accounts\nBTC, ETH, DAI\nFee: 1% / Settlement: 2-5 days',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/01/wyre-logo-square-small.png',
    supportEmail: 'support@sendwyre.com',
    permissions: ['camera']
  },
  {
    pluginId: 'co.edgesecure.bitrefill',
    uri: hostedUri + 'co.edgesecure.bitrefill/index.html',
    name: 'Bitrefill',
    subtitle: 'Buy gift cards and refill phones\nAccepts BTC, DASH, ETH, and LTC',
    imageUrl: 'https://edge.app/wp-content/uploads/2019/01/bitrefill-2.png',
    isLegacy: true
  }
]

export const devPlugin: BuySellPlugin = {
  pluginId: 'custom',
  uri: '',
  name: 'Custom Dev',
  subtitle: 'Development Testing',
  imageUrl: 'http://edge.app/wp-content/uploads/2019/01/wyre-logo-square-small.png'
}

/**
 * Quick & dirty merge function to handle the plugin filters.
 */
function deepMerge (a: Object, b: Object) {
  // Slight bias in favor of a, for non-object keys:
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return a

  const out = {}
  for (const key in a) {
    out[key] = key in b ? deepMerge(a[key], b[key]) : a[key]
  }
  for (const key in b) {
    if (!(key in a)) out[key] = b[key]
  }
  return out
}

export { buyPluginFilter, sellPluginFilter }
export const buySellPluginFilter = deepMerge(buyPluginFilter, sellPluginFilter)
