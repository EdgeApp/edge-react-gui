// @flow
import s from '../locales/strings.js'
export const ETHEREUM_WALLET = 'wallet:ethereum'
export const BITCOIN_WALLET = 'wallet:bitcoin'
export const BITCOINCASH_WALLET = 'wallet:bitcoincash'
export const MAX_TOKEN_CODE_CHARACTERS = 6

export const CURRENCY_SYMBOL_IMAGES = {
  BCH: 'https://developer.airbitz.co/content/bitcoincash-logo-solo-64.png',
  BTC: 'https://developer.airbitz.co/content/bitcoin-logo-solo-64.png',
  ETH: 'https://developer.airbitz.co/content/ethereum-logo-solo-64.png'
}

export const DEFAULT_STARTER_WALLET_NAMES = {
  BCH: s.strings.string_first_bitcoincash_wallet_name,
  BSV: s.strings.string_first_bitcoin_sv_wallet_name,
  BTC: s.strings.string_first_bitcoin_wallet_name,
  BTG: s.strings.string_first_bitcoin_gold_wallet_name,
  DASH: s.strings.string_first_dash_wallet_name,
  DGB: s.strings.string_first_digibyte_wallet_name,
  EOS: s.strings.string_first_eos_wallet_name,
  ETH: s.strings.string_first_ethereum_wallet_name,
  FTC: s.strings.string_first_feather_coin_wallet_name,
  GRS: s.strings.string_first_groestlcoin_wallet_name,
  HERC: s.strings.string_first_hercules_wallet_name,
  LTC: s.strings.string_first_litecoin_wallet_name,
  QTUM: s.strings.string_first_qtum_wallet_name,
  RVN: s.strings.string_first_ravencoin_wallet_name,
  SMART: s.strings.string_first_smartcash_wallet_name,
  UFO: s.strings.string_first_ufo_wallet_name,
  VTC: s.strings.string_first_vertcoin_wallet_name,
  XLM: s.strings.string_first_stellar_wallet_name,
  XMR: s.strings.string_first_monero_wallet_name,
  XRP: s.strings.string_first_ripple_wallet_name,
  XZC: s.strings.string_first_zcoin_wallet_name
}

// DO NOT PUT ANY TOKENS IN HERE!
export const CURRENCY_PLUGIN_NAMES = {
  BCH: 'bitcoincash',
  BSV: 'bitcoinsv',
  BTC: 'bitcoin',
  BTG: 'bitcoingold',
  DASH: 'dash',
  DGB: 'digibyte',
  EBST: 'eboost',
  EOS: 'eos',
  ETH: 'ethereum',
  FTC: 'feathercoin',
  GRS: 'groestlcoin',
  LTC: 'litecoin',
  QTUM: 'qtum',
  RVN: 'ravencoin',
  SMART: 'smartcash',
  UFO: 'ufo',
  VTC: 'vertcoin',
  XLM: 'stellar',
  XMR: 'monero',
  XRP: 'ripple',
  XZC: 'zcoin'
}

export const getSpecialCurrencyInfo = (currencyCode: string): Object => {
  if (SPECIAL_CURRENCY_INFO[currencyCode]) {
    return SPECIAL_CURRENCY_INFO[currencyCode]
  } else {
    return {}
  }
}

type SpecialCurrencyInfo = {
  [currencyCode: string]: {
    noMaxSpend?: boolean,
    needsAccountNameSetup?: boolean,
    noChangeMiningFee?: boolean,
    allowZeroTx?: boolean,
    dummyPublicAddress?: string,
    uniqueIdentifier?: {
      addButtonText: string,
      identifierName: string,
      identifierKeyboardType: string
    },
    minimumPopupModals?: {
      minimumNativeBalance: string,
      modalMessage: string
    }
  }
}

export const SPECIAL_CURRENCY_INFO: SpecialCurrencyInfo = {
  BTC: {
    displayBuyCrypto: true,
    isImportKeySupported: false
  },
  BCH: {
    displayBuyCrypto: true,
    isImportKeySupported: false
  },
  LTC: {
    displayBuyCrypto: true,
    isImportKeySupported: false
  },
  XLM: {
    dummyPublicAddress: 'GBEVGJYAUKJ2TVPMC3GEPI2GGZQLMWZDRWJCVNBXCJ3ELYTDPHVQQM74',
    noCustomMiningFee: true,
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo_id,
      identifierName: s.strings.unique_identifier_memo_id,
      identifierKeyboardType: 'numeric'
    },
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: s.strings.request_xlm_minimum_notification_body
    },
    displayBuyCrypto: false,
    isImportKeySupported: true
  },
  XRP: {
    dummyPublicAddress: 'rfuESo7eHUnvebxgaFjfYxfwXhM2uBPAj3',
    noCustomMiningFee: true,
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_destination_tag,
      identifierName: s.strings.unique_identifier_destination_tag,
      identifierKeyboardType: 'numeric'
    },
    minimumPopupModals: {
      minimumNativeBalance: '20000000',
      modalMessage: s.strings.request_xrp_minimum_notification_body
    },
    displayBuyCrypto: true,
    isImportKeySupported: true
  },
  XMR: {
    dummyPublicAddress: '46qxvuS78CNBoiiKmDjvjd5pMAZrTBbDNNHDoP52jKj9j5mk6m4R5nU6BDrWQURiWV9a2n5Sy8Qo4aJskKa92FX1GpZFiYA',
    noCustomMiningFee: true,
    noMaxSpend: true,
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_payment_id,
      identifierName: s.strings.unique_identifier_payment_id,
      identifierKeyboardType: 'default'
    },
    uniqueIdentifierToNotes: true,
    isImportKeySupported: false
  },
  EOS: {
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      identifierKeyboardType: 'default'
    },
    isImportKeySupported: false
  },
  ETH: {
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: true
  },
  DAI: {
    displayBuyCrypto: true,
    isImportKeySupported: true
  },
  HERC: {
    displayBuyCrypto: true,
    isImportKeySupported: false
  }
}

export const USD_FIAT = 'iso:USD'
export const getSymbolFromCurrency = (currencyCode: string) => {
  if (typeof currencyCode !== 'string') return ''
  const codeWithoutIso = currencyCode.replace('iso:', '')
  const code = codeWithoutIso.toUpperCase()
  if (!FIAT_CODES_SYMBOLS.hasOwnProperty(code)) return ''
  return FIAT_CODES_SYMBOLS[codeWithoutIso]
}
export const FIAT_CODES_SYMBOLS = {
  AED: 'د.إ',
  AFN: '؋',
  ALL: 'L',
  AMD: '֏',
  ANG: 'ƒ',
  AOA: 'Kz',
  ARS: '$',
  AUD: '$',
  AWG: 'ƒ',
  AZN: '₼',
  BAM: 'KM',
  BBD: '$',
  BDT: '৳',
  BGN: 'лв',
  BIF: 'Fr',
  BMD: '$',
  BND: '$',
  BOB: 'Bs.',
  BRL: 'R$',
  BSD: '$',
  BTN: 'Nu.',
  BWP: 'P',
  BYN: 'Br',
  BZD: '$',
  CAD: '$',
  CDF: 'Fr',
  CHF: 'Fr',
  CLP: '$',
  CNY: '¥',
  COP: '$',
  CRC: '₡',
  CUC: '$',
  CUP: '$',
  CVE: '$',
  CZK: 'Kč',
  DJF: 'Fr',
  DKK: 'kr',
  DOP: '$',
  DZD: 'د.ج',
  EGP: 'ج.م',
  ERN: 'Nfk',
  ETB: 'Br',
  EUR: '€',
  FJD: '$',
  FKP: '£',
  GBP: '£',
  GEL: '₾',
  GGP: '£',
  GHS: '₵',
  GIP: '£',
  GMD: 'D',
  GNF: 'Fr',
  GTQ: 'Q',
  GYD: '$',
  HKD: '$',
  HNL: 'L',
  HRK: 'kn',
  HTG: 'G',
  HUF: 'Ft',
  IDR: 'Rp',
  ILS: '₪',
  IMP: '£',
  INR: '₹',
  IQD: 'ع.د',
  IRR: '﷼',
  ISK: 'kr',
  JEP: '£',
  JMD: '$',
  JOD: 'د.ا',
  JPY: '¥',
  KES: 'Sh',
  KGS: 'с',
  KHR: '៛',
  KMF: 'Fr',
  KPW: '₩',
  KRW: '₩',
  KWD: 'د.ك',
  KYD: '$',
  KZT: '₸',
  LAK: '₭',
  LBP: 'ل.ل',
  LKR: 'Rs',
  LRD: '$',
  LSL: 'L',
  LYD: 'ل.د',
  MAD: 'د. م.',
  MDL: 'L',
  MGA: 'Ar',
  MKD: 'ден',
  MMK: 'Ks',
  MNT: '₮',
  MOP: 'P',
  MRO: 'UM',
  MRU: 'UM',
  MUR: '₨',
  MWK: 'MK',
  MXN: '$',
  MYR: 'RM',
  MZN: 'MT',
  NAD: '$',
  NGN: '₦',
  NIO: 'C$',
  NOK: 'kr',
  NPR: '₨',
  NZD: '$',
  OMR: 'ر.ع.',
  PAB: 'B/.',
  PEN: 'S/.',
  PGK: 'K',
  PHP: '₱',
  PKR: '₨',
  PLN: 'zł',
  PRB: 'р.',
  PYG: '₲',
  QAR: 'ر.ق',
  RON: 'lei',
  RSD: 'дин',
  RUB: '₽',
  RWF: 'Fr',
  SAR: 'ر.س',
  SBD: '$',
  SCR: '₨',
  SDG: 'ج.س.',
  SEK: 'kr',
  SGD: '$',
  SHP: '£',
  SLL: 'Le',
  SOS: 'Sh',
  SRD: '$',
  SSP: '£',
  STD: 'Db',
  SYP: 'ل.س',
  SZL: 'L',
  THB: '฿',
  TJS: 'ЅМ',
  TMT: 'm',
  TND: 'د.ت',
  TOP: 'T$',
  TRY: '₺',
  TTD: '$',
  TVD: '$',
  TWD: '$',
  TZS: 'Sh',
  UAH: '₴',
  UGX: 'Sh',
  USD: '$',
  UYU: '$',
  UZS: '',
  VEF: 'Bs',
  VND: '₫',
  VUV: 'Vt',
  WST: 'T',
  XAF: 'Fr',
  XCD: '$',
  XOF: 'Fr',
  XPF: 'Fr',
  YER: '﷼',
  ZAR: 'R',
  ZMW: 'ZK'
}
