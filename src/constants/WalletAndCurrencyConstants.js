// @flow

import { type WalletListMenuKey } from '../actions/WalletListMenuActions.js'
import s from '../locales/strings.js'

export const MAX_TOKEN_CODE_CHARACTERS = 7

export const FEE_COLOR_THRESHOLD = 2.0 // this is denominated in dollars
export const FEE_ALERT_THRESHOLD = 5.0 // this is denominated in dollars

export const CURRENCY_SYMBOL_IMAGES = {
  BCH: 'https://developer.airbitz.co/content/bitcoincash-logo-solo-64.png',
  BTC: 'https://developer.airbitz.co/content/bitcoin-logo-solo-64.png',
  ETH: 'https://developer.airbitz.co/content/ethereum-logo-solo-64.png',
  ETC: 'https://developer.airbitz.co/content/ethereum-classic-logo-solo-64.png'
}

// Translations for custom fee keys:
export const FEE_STRINGS = {
  gasLimit: s.strings.gasLimit,
  gasPrice: s.strings.gasPrice,
  satPerByte: s.strings.satPerByte
}

export const DEFAULT_STARTER_WALLET_NAMES = {
  BCH: s.strings.string_first_bitcoincash_wallet_name,
  BNB: s.strings.string_first_bnb_wallet_name,
  BSV: s.strings.string_first_bitcoin_sv_wallet_name,
  BTC: s.strings.string_first_bitcoin_wallet_name,
  BTG: s.strings.string_first_bitcoin_gold_wallet_name,
  DASH: s.strings.string_first_dash_wallet_name,
  DGB: s.strings.string_first_digibyte_wallet_name,
  DOGE: s.strings.string_first_doge_wallet_name,
  EBST: s.strings.string_first_eboost_wallet_name,
  EOS: s.strings.string_first_eos_wallet_name,
  ETH: s.strings.string_first_ethereum_wallet_name,
  FTC: s.strings.string_first_feather_coin_wallet_name,
  GRS: s.strings.string_first_groestlcoin_wallet_name,
  HERC: s.strings.string_first_hercules_wallet_name,
  LTC: s.strings.string_first_litecoin_wallet_name,
  QTUM: s.strings.string_first_qtum_wallet_name,
  RBTC: s.strings.string_first_rsk_wallet_name,
  RVN: s.strings.string_first_ravencoin_wallet_name,
  SMART: s.strings.string_first_smartcash_wallet_name,
  UFO: s.strings.string_first_ufo_wallet_name,
  VTC: s.strings.string_first_vertcoin_wallet_name,
  XLM: s.strings.string_first_stellar_wallet_name,
  XMR: s.strings.string_first_monero_wallet_name,
  XRP: s.strings.string_first_ripple_wallet_name,
  XTZ: s.strings.string_first_tezos_wallet_name,
  XZC: s.strings.string_first_zcoin_wallet_name
}

/**
 * Plugins in this list have settings scenes.
 * The order of this list sets the order of the rows.
 */
export const CURRENCY_SETTINGS_KEYS = [
  'bitcoin',
  'bitcointestnet',
  'bitcoincash',
  'ethereum',
  'ethereumclassic',
  'dash',
  'litecoin',
  'bitcoinsv',
  'zcoin',
  'digibyte',
  'qtum',
  'vertcoin',
  'feathercoin',
  'ravencoin',
  'bitcoingold',
  'smartcash',
  'groestlcoin',
  'eboost',
  'ufo'
]

/**
 * Determines the sort order of the various currencies the app supports.
 * Use `sortCurrencyInfos` to actually do the sorting.
 */
export const WALLET_TYPE_ORDER = [
  'wallet:bitcoin',
  'wallet:bitcoincash',
  'wallet:monero',
  'wallet:ethereum',
  'wallet:ethereumclassic',
  'wallet:binance',
  'wallet:bitcoinsv',
  'wallet:litecoin',
  'wallet:eos',
  'wallet:ripple',
  'wallet:rsk',
  'wallet:stellar',
  'wallet:dash',
  'wallet:tezos',
  'wallet:digibyte',
  'wallet:vertcoin',
  'wallet:ravencoin',
  'wallet:qtum',
  'wallet:feathercoin',
  'wallet:bitcoingold',
  'wallet:smartcash',
  'wallet:groestlcoin',
  'wallet:zcoin',
  'wallet:ufo'
]

// Put these in reverse order of preference
export const PREFERRED_TOKENS = ['WINGS', 'HERC', 'REP', 'AGLD', 'RIF']

// DO NOT PUT ANY TOKENS IN HERE!
export const CURRENCY_PLUGIN_NAMES = {
  BCH: 'bitcoincash',
  BNB: 'binance',
  BSV: 'bitcoinsv',
  BTC: 'bitcoin',
  BTG: 'bitcoingold',
  DASH: 'dash',
  DGB: 'digibyte',
  DOGE: 'dogecoin',
  EBST: 'eboost',
  EOS: 'eos',
  ETH: 'ethereum',
  ETC: 'ethereumclassic',
  FIO: 'fio',
  FTC: 'feathercoin',
  GRS: 'groestlcoin',
  LTC: 'litecoin',
  QTUM: 'qtum',
  RBTC: 'rsk',
  RVN: 'ravencoin',
  SMART: 'smartcash',
  TBTC: 'bitcointestnet',
  UFO: 'ufo',
  VTC: 'vertcoin',
  XLM: 'stellar',
  XMR: 'monero',
  XRP: 'ripple',
  XTZ: 'tezos',
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
    showEarnInterestCard?: boolean,
    minimumPopupModals?: {
      minimumNativeBalance: string,
      modalMessage: string
    }
  }
}

export const SPECIAL_CURRENCY_INFO: SpecialCurrencyInfo = {
  BTC: {
    displayBuyCrypto: true,
    isImportKeySupported: false,
    showEarnInterestCard: true
  },
  BCH: {
    displayBuyCrypto: true,
    isImportKeySupported: false,
    showEarnInterestCard: true
  },
  LTC: {
    displayBuyCrypto: true,
    isImportKeySupported: false,
    showEarnInterestCard: true
  },
  RBTC: {
    dummyPublicAddress: '0x74f9452e22fe58e27575f176fc884729d88267ba', // rj116
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    },
    isCustomTokensSupported: false,
    isTokensSupported: true
  },
  XLM: {
    dummyPublicAddress: 'GBEVGJYAUKJ2TVPMC3GEPI2GGZQLMWZDRWJCVNBXCJ3ELYTDPHVQQM74',
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
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    }
  },
  XRP: {
    dummyPublicAddress: 'rfuESo7eHUnvebxgaFjfYxfwXhM2uBPAj3',
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
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    }
  },
  XMR: {
    dummyPublicAddress: '46qxvuS78CNBoiiKmDjvjd5pMAZrTBbDNNHDoP52jKj9j5mk6m4R5nU6BDrWQURiWV9a2n5Sy8Qo4aJskKa92FX1GpZFiYA',
    noMaxSpend: true,
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
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    },
    isCustomTokensSupported: true,
    isTokensSupported: true,
    showEarnInterestCard: true
  },
  DAI: {
    displayBuyCrypto: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    }
  },
  HERC: {
    displayBuyCrypto: true,
    isImportKeySupported: false
  },
  XTZ: {
    noChangeMiningFee: true,
    // will share / copy public address instead of URI on Request scene
    isUriEncodedStructure: true,
    dummyPublicAddress: 'tz1cVgSd4oY25pDkH7vdvVp5DfPkZwT2hXwX',
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    }
  },
  BNB: {
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      identifierKeyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    },
    dummyPublicAddress: 'bnb1rt449yu7us6hmk4pmyr8talc60ydkwp4qkvcl7'
  },
  TUSD: {
    showEarnInterestCard: true
  },
  LBA: {
    showEarnInterestCard: true
  },
  BAT: {
    showEarnInterestCard: true
  }
}

/**
 * Customizes which coins get which options on the wallet list scene.
 */
export const WALLET_LIST_MENU: {
  currencyCodes?: string[],
  label: string,
  value: WalletListMenuKey
}[] = [
  {
    label: s.strings.fragment_wallets_sort,
    value: 'sort'
  },
  {
    label: s.strings.string_rename,
    value: 'rename'
  },
  {
    label: s.strings.string_delete,
    value: 'delete'
  },
  {
    label: s.strings.string_resync,
    value: 'resync'
  },
  {
    label: s.strings.fragment_wallets_export_transactions,
    value: 'exportWalletTransactions'
  },
  {
    label: s.strings.string_master_private_key,
    value: 'getSeed'
  },
  {
    currencyCodes: ['BTC', 'BCH'],
    label: s.strings.string_split_wallet,
    value: 'split'
  },
  {
    currencyCodes: ['ETH', 'RBTC'],
    label: s.strings.string_add_edit_tokens,
    value: 'manageTokens'
  },
  {
    currencyCodes: [
      'BTC',
      'BCH',
      'DASH',
      'FTC',
      'XZC',
      'LTC',
      'UFO',
      'QTUM',
      'VTC',
      'BTG',
      'DGB',
      'SMART',
      'GRS',
      'BSV',
      'EBST',
      'EOS',
      'DOGE',
      'RVN',
      'RBTC',
      'TBTC'
    ],
    label: s.strings.fragment_wallets_view_xpub,
    value: 'viewXPub'
  }
]

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

export const FIO_WALLET_TYPE = 'wallet:fio'
export const FIO_STR = 'FIO'
export const FIO_DOMAIN_DEFAULT = {
  name: 'edge',
  expiration: new Date().toDateString(),
  isPublic: true,
  walletId: ''
}
export const FIO_ADDRESS_DELIMITER = '@'
