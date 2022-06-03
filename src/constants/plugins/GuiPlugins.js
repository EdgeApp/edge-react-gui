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
    baseQuery: { apiKey: 'pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy', enableRecurringBuys: 'true' },
    queryPromoCode: 'apiKey',
    displayName: 'MoonPay',
    permissions: ['camera'],
    mandatoryPermissions: true,
    fixCurrencyCodes: {
      BAT: { pluginId: 'ethereum', tokenId: '0d8775f648430679a709e98d2b0cb6250d2887ef' },
      BCH: { pluginId: 'bitcoincash' },
      BNB: { pluginId: 'binance' },
      BTC: { pluginId: 'bitcoin' },
      CELO: { pluginId: 'celo' },
      CHZ: { pluginId: 'ethereum', tokenId: '3506424f91fd33084466f402d5d97f05f8e3b4af' },
      COMP: { pluginId: 'ethereum', tokenId: 'c00e94cb662c3520282e6f5717214004a7f26888' },
      DAI: { pluginId: 'ethereum', tokenId: '6b175474e89094c44da98b954eedeac495271d0f' },
      DASH: { pluginId: 'dash' },
      DGB: { pluginId: 'digibyte' },
      DOGE: { pluginId: 'dogecoin' },
      DOT: { pluginId: 'polkadot' },
      EOS: { pluginId: 'eos' },
      ETC: { pluginId: 'ethereumclassic' },
      ETH: { pluginId: 'ethereum' },
      FLOW: { pluginId: 'flow' },
      HBAR: { pluginId: 'hedera' },
      LTC: { pluginId: 'litecoin' },
      MATIC_POLYGON: { pluginId: 'polygon' },
      QTUM: { pluginId: 'qtum' },
      RVN: { pluginId: 'ravencoin' },
      TUSD: { pluginId: 'ethereum', tokenId: '0000000000085d4780b73119b644ae5ecd22b376' },
      USDC: { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      USDT: { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
      XLM: { pluginId: 'stellar' },
      XRP: { pluginId: 'ripple' },
      XTZ: { pluginId: 'tezos' },
      ZRX: { pluginId: 'ethereum', tokenId: 'e41d2489571d322189246dafa5ebde1f4699f498' }
    }
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
  ionia: {
    pluginId: 'ionia',
    storeId: 'ionia',
    baseUri: 'https://ioniaedge.web.app',
    displayName: 'Ionia'
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
