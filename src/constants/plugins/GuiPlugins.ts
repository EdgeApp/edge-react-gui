import { amountQuoteFiatPlugin } from '../../plugins/gui/amountQuotePlugin'
import { GuiPlugin, GuiPluginRow } from '../../types/GuiPluginTypes'

export const guiPlugins: { [pluginId: string]: GuiPlugin } = {
  ach: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:USD',
    displayName: 'ACH Bank Transfer'
  },
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
    baseUri: 'https://sell.moonpay.io',
    baseQuery: { apiKey: 'pk_live_Y1vQHUgfppB4oMEZksB8DYNQAdA4sauy', paymentMethod: 'ach_bank_transfer' },
    queryPromoCode: 'apiKey',
    displayName: 'MoonPay',
    permissions: ['camera'],
    mandatoryPermissions: true,
    fixCurrencyCodes: {
      BAT: { pluginId: 'ethereum', tokenId: '0d8775f648430679a709e98d2b0cb6250d2887ef' },
      BCH: { pluginId: 'bitcoincash', tokenId: null },
      BNB: { pluginId: 'binance', tokenId: null },
      BTC: { pluginId: 'bitcoin', tokenId: null },
      CELO: { pluginId: 'celo', tokenId: null },
      CHZ: { pluginId: 'ethereum', tokenId: '3506424f91fd33084466f402d5d97f05f8e3b4af' },
      COMP: { pluginId: 'ethereum', tokenId: 'c00e94cb662c3520282e6f5717214004a7f26888' },
      DAI: { pluginId: 'ethereum', tokenId: '6b175474e89094c44da98b954eedeac495271d0f' },
      DASH: { pluginId: 'dash', tokenId: null },
      DGB: { pluginId: 'digibyte', tokenId: null },
      DOGE: { pluginId: 'dogecoin', tokenId: null },
      DOT: { pluginId: 'polkadot', tokenId: null },
      EOS: { pluginId: 'eos', tokenId: null },
      ETC: { pluginId: 'ethereumclassic', tokenId: null },
      ETH: { pluginId: 'ethereum', tokenId: null },
      FLOW: { pluginId: 'flow', tokenId: null },
      HBAR: { pluginId: 'hedera', tokenId: null },
      LTC: { pluginId: 'litecoin', tokenId: null },
      MATIC_POLYGON: { pluginId: 'polygon', tokenId: null },
      QTUM: { pluginId: 'qtum', tokenId: null },
      RVN: { pluginId: 'ravencoin', tokenId: null },
      TUSD: { pluginId: 'ethereum', tokenId: '0000000000085d4780b73119b644ae5ecd22b376' },
      USDC: { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      USDT: { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
      XLM: { pluginId: 'stellar', tokenId: null },
      XRP: { pluginId: 'ripple', tokenId: null },
      XTZ: { pluginId: 'tezos', tokenId: null },
      ZRX: { pluginId: 'ethereum', tokenId: 'e41d2489571d322189246dafa5ebde1f4699f498' }
    }
  },
  bitsofgold: {
    pluginId: 'bitsofgold',
    storeId: 'bitsofgold',
    baseUri: 'https://www.bitsofgold.co.il',
    queryPromoCode: 'promo_code',
    displayName: 'Bits of Gold',
    permissions: ['camera']
  },
  creditcard: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    displayName: 'Credit Card'
  },
  colombiabank: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:COP',
    defaultFiatAmount: '100000',
    displayName: 'XX Do not show'
  },
  debit: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    displayName: 'Debit Card'
  },
  directtobank: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:AUD',
    displayName: ''
  },
  fasterpayments: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:GBP',
    displayName: ''
  },
  iach: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:USD',
    displayName: 'Instant ACH Bank Transfer'
  },
  ideal: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:EUR',
    displayName: 'XX Do not show'
  },
  interac: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:CAD',
    displayName: ''
  },
  mexicobank: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:MXN',
    defaultFiatAmount: '5000',
    displayName: 'XX Do not show'
  },
  payid: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:AUD',
    displayName: ''
  },
  pix: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:BRL',
    defaultFiatAmount: '1000',
    displayName: ''
  },
  pse: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:COP',
    defaultFiatAmount: '100000',
    displayName: ''
  },
  turkishbank: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:TRY',
    defaultFiatAmount: '2000',
    displayName: ''
  },
  sepa: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    needsCountryCode: true,
    queryPromoCode: 'client_value',
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:EUR',
    displayName: 'Bity'
  },
  spei: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:MXN',
    defaultFiatAmount: '5000',
    displayName: 'XX Do not show'
  },
  bitrefill: {
    pluginId: 'bitrefill',
    storeId: 'co.edgesecure.bitrefill',
    baseUri:
      'https://embed.bitrefill.com/?ref=nUqaI7Qe&theme=dark&paymentMethods=bitcoin,ethereum,usdt_trc20,usdt_erc20,usdt_polygon,usdc_erc20,usdc_polygon,litecoin,dogecoin,dash',
    lockUriPath: true,
    displayName: 'Bitrefill'
  },
  wire: {
    pluginId: 'amountquote',
    storeId: '',
    baseUri: '',
    lockUriPath: true,
    nativePlugin: amountQuoteFiatPlugin,
    forceFiatCurrencyCode: 'iso:USD',
    displayName: 'Bank Wire Transfer'
  },
  xanpool: {
    pluginId: 'xanpool',
    storeId: 'xanpool',
    baseUri: 'https://widget.xanpool.com',
    baseQuery: { apiKey: 'ae524a0144ccd8dc087af39eabb7a02a', isWebView: 'true' },
    displayName: 'Xanpool',
    permissions: ['camera']
  },
  // Partner whitelabel plugins
  coinhub: {
    pluginId: 'coinhub',
    storeId: 'coinhub',
    baseUri: 'https://coinhubatm.app',
    displayName: 'Coinhub ATMs',
    permissions: ['location']
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
