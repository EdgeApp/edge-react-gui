// @flow

import { type WalletListMenuKey } from '../actions/WalletListMenuActions.js'
import s from '../locales/strings.js'

export const MAX_TOKEN_CODE_CHARACTERS = 7

export const FEE_COLOR_THRESHOLD = 2.0 // this is denominated in dollars
export const FEE_ALERT_THRESHOLD = 5.0 // this is denominated in dollars

export const MAX_ADDRESS_CHARACTERS = 17 // for displaying a truncated wallet address
export const MAX_CRYPTO_AMOUNT_CHARACTERS = 10 // includes both whole and fractional characters
export const FIAT_PRECISION = 2

export const EDGE_CONTENT_SERVER = 'https://content.edge.app'

export const CURRENCY_SYMBOL_IMAGES = {
  BCH: `${EDGE_CONTENT_SERVER}/bitcoincash-logo-solo-64.png`,
  BTC: `${EDGE_CONTENT_SERVER}/bitcoin-logo-solo-64.png`,
  ETH: `${EDGE_CONTENT_SERVER}/ethereum-logo-solo-64.png`,
  ETC: `${EDGE_CONTENT_SERVER}/ethereum-classic-logo-solo-64.png`
}

// Translations for custom fee keys:
export const FEE_STRINGS = {
  gasLimit: s.strings.gasLimit,
  gasPrice: s.strings.gasPrice,
  satPerByte: s.strings.satPerByte
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
  'dogecoin',
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
  'wallet:zcash',
  'wallet:ethereumclassic',
  'wallet:binance',
  'wallet:solana',
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
  'wallet:ufo',
  'wallet:telos',
  'wallet:wax',
  'wallet:fantom',
  'wallet:hedera',
  'wallet:polygon',
  'wallet:avalanche',
  'wallet:binancesmartchain'
]

// Put these in reverse order of preference
export const PREFERRED_TOKENS = ['WINGS', 'HERC', 'REPV2', 'RIF']

// Strip away 'wallet:' prefix and '-bip' suffix, if present
export const getPluginId = (walletType: string): string => walletType.replace('wallet:', '').split('-')[0]

type SpecialCurrencyInfo = {|
  initWalletName: string,
  chainCode: string,

  // Marketing:
  displayBuyCrypto?: boolean,

  // Localized GUI text:
  dummyPublicAddress?: string,
  minimumPopupModals?: {
    minimumNativeBalance: string,
    modalMessage: string,
    alertMessage: string
  },
  uniqueIdentifierInfo?: {
    addButtonText: string,
    identifierName: string,
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad'
  },
  isImportKeySupported?:
    | false
    | {
        privateKeyLabel: string,
        privateKeyInstructions: string
      },

  // Flags that could move to EdgeCurrencyInfo:
  allowZeroTx?: boolean,
  isAccountActivationRequired?: boolean,
  isCustomTokensSupported?: boolean,
  isUriEncodedStructure?: boolean,
  needsAccountNameSetup?: boolean,
  skipAccountNameValidation?: boolean,
  noChangeMiningFee?: boolean,
  noMaxSpend?: boolean,
  keysOnlyMode?: boolean,
  isPrivateKeySweepable?: boolean,
  isBitPayProtocolSupported?: boolean,
  isSplittingDisabled?: boolean,
  isStakingSupported?: boolean,
  stakeActions?: { [stakeActionKey: string]: string },
  stakeLockPeriod?: number,
  stakeMaxApy?: number
|}

/*
 * Accepts a walletType or pluginId
 */
export const getSpecialCurrencyInfo = (input: string): SpecialCurrencyInfo => {
  const pluginId = getPluginId(input ?? '')
  if (SPECIAL_CURRENCY_INFO[pluginId]) {
    return SPECIAL_CURRENCY_INFO[pluginId]
  } else {
    return {
      initWalletName: '',
      chainCode: '',
      displayBuyCrypto: false
    }
  }
}

export const SPECIAL_CURRENCY_INFO: {
  [pluginId: string]: SpecialCurrencyInfo
} = {
  bitcoin: {
    initWalletName: s.strings.string_first_bitcoin_wallet_name,
    chainCode: 'BTC',
    displayBuyCrypto: true,
    isImportKeySupported: false,
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  bitcointestnet: {
    initWalletName: s.strings.string_first_bitcoin_testnet_wallet_name,
    chainCode: 'TESTBTC',
    displayBuyCrypto: true,
    isImportKeySupported: false,
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  bitcoincash: {
    initWalletName: s.strings.string_first_bitcoincash_wallet_name,
    chainCode: 'BCH',
    displayBuyCrypto: true,
    isImportKeySupported: false,
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  bitcoinsv: {
    initWalletName: s.strings.string_first_bitcoin_sv_wallet_name,
    chainCode: 'BSV',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  digibyte: {
    initWalletName: s.strings.string_first_digibyte_wallet_name,
    chainCode: 'DGB',
    displayBuyCrypto: true,
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  litecoin: {
    initWalletName: s.strings.string_first_litecoin_wallet_name,
    chainCode: 'LTC',
    displayBuyCrypto: true,
    isImportKeySupported: false,
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  rsk: {
    initWalletName: s.strings.string_first_rsk_wallet_name,
    chainCode: 'RBTC',
    dummyPublicAddress: '0x74f9452e22fe58e27575f176fc884729d88267ba', // rj116
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    isSplittingDisabled: true,
    isCustomTokensSupported: true
  },
  stellar: {
    initWalletName: s.strings.string_first_stellar_wallet_name,
    chainCode: 'XLM',
    dummyPublicAddress: 'GBEVGJYAUKJ2TVPMC3GEPI2GGZQLMWZDRWJCVNBXCJ3ELYTDPHVQQM74',
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo_id,
      identifierName: s.strings.unique_identifier_memo_id,
      keyboardType: 'default'
    },
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: s.strings.request_xlm_minimum_notification_body,
      alertMessage: s.strings.request_xlm_minimum_notification_alert_body
    },
    displayBuyCrypto: false,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_key_instructions
    }
  },
  ripple: {
    initWalletName: s.strings.string_first_ripple_wallet_name,
    chainCode: 'XRP',
    dummyPublicAddress: 'rfuESo7eHUnvebxgaFjfYxfwXhM2uBPAj3',
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_destination_tag,
      identifierName: s.strings.unique_identifier_destination_tag,
      keyboardType: 'numeric'
    },
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: s.strings.request_xrp_minimum_notification_body,
      alertMessage: s.strings.request_xrp_minimum_notification_alert_body
    },
    displayBuyCrypto: false,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_key_instructions
    }
  },
  monero: {
    initWalletName: s.strings.string_first_monero_wallet_name,
    chainCode: 'XMR',
    dummyPublicAddress: '46qxvuS78CNBoiiKmDjvjd5pMAZrTBbDNNHDoP52jKj9j5mk6m4R5nU6BDrWQURiWV9a2n5Sy8Qo4aJskKa92FX1GpZFiYA',
    noMaxSpend: true,
    isImportKeySupported: false
  },
  eos: {
    initWalletName: s.strings.string_first_eos_wallet_name,
    chainCode: 'EOS',
    isAccountActivationRequired: true,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_active_key_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_active_key_instructions
    },
    isCustomTokensSupported: true
  },
  telos: {
    initWalletName: s.strings.string_first_telos_wallet_name,
    chainCode: 'TLOS',
    isAccountActivationRequired: true,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_active_key_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_active_key_instructions
    },
    isCustomTokensSupported: true
  },
  wax: {
    initWalletName: s.strings.string_first_wax_wallet_name,
    chainCode: 'WAX',
    isAccountActivationRequired: false,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: false,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_active_key_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_active_key_instructions
    },
    isCustomTokensSupported: true,
    keysOnlyMode: true
  },
  ethereum: {
    initWalletName: s.strings.string_first_ethereum_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true,
    isBitPayProtocolSupported: false
  },
  ethereumclassic: {
    initWalletName: s.strings.string_first_ethereum_classic_wallet_name,
    chainCode: 'ETC',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isSplittingDisabled: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    }
  },
  tezos: {
    initWalletName: s.strings.string_first_tezos_wallet_name,
    chainCode: 'XTZ',
    noChangeMiningFee: true,
    // will share / copy public address instead of URI on Request scene
    isUriEncodedStructure: true,
    dummyPublicAddress: 'tz1cVgSd4oY25pDkH7vdvVp5DfPkZwT2hXwX',
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    }
  },
  binance: {
    initWalletName: s.strings.string_first_bnb_wallet_name,
    chainCode: 'BNB',
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    dummyPublicAddress: 'bnb1rt449yu7us6hmk4pmyr8talc60ydkwp4qkvcl7'
  },
  binancesmartchain: {
    initWalletName: s.strings.string_first_binance_smart_chain_wallet_name,
    chainCode: 'BNB',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isCustomTokensSupported: true
  },
  solana: {
    initWalletName: s.strings.string_first_solana_wallet_name,
    chainCode: 'SOL',
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    },
    dummyPublicAddress: 'DEd1rkRyr5bRkJHgaAKMSYjYC1KMz3Hc5bSs4Jiwt29x',
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      keyboardType: 'default'
    },
    noChangeMiningFee: true
  },
  celo: {
    initWalletName: s.strings.string_first_celo_wallet_name,
    chainCode: 'CELO',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true,
    isSplittingDisabled: true
  },
  fio: {
    initWalletName: s.strings.string_first_fio_wallet_name,
    chainCode: 'FIO',
    dummyPublicAddress: 'FIO4uX8tSuBZyHJmpPfc5Q6WrZ9eXd33wdgfWvfJ2fjGsg9yH4Dkd',
    noChangeMiningFee: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    isStakingSupported: true,
    stakeActions: {
      add: 'stakeFioTokens',
      remove: 'unStakeFioTokens'
    },
    stakeLockPeriod: 1000 * 60 * 60 * 24 * 7,
    stakeMaxApy: 450
  },
  dash: {
    initWalletName: s.strings.string_first_dash_wallet_name,
    chainCode: 'DASH',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  ravencoin: {
    initWalletName: s.strings.string_first_ravencoin_wallet_name,
    chainCode: 'RVN',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  dogecoin: {
    initWalletName: s.strings.string_first_doge_wallet_name,
    chainCode: 'DOGE',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  zcoin: {
    initWalletName: s.strings.string_first_zcoin_wallet_name,
    chainCode: 'FIRO',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  smartcash: {
    initWalletName: s.strings.string_first_smartcash_wallet_name,
    chainCode: 'SMART',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  vertcoin: {
    initWalletName: s.strings.string_first_vertcoin_wallet_name,
    chainCode: 'VTC',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  bitcoingold: {
    initWalletName: s.strings.string_first_bitcoin_gold_wallet_name,
    chainCode: 'BTG',
    isPrivateKeySweepable: true,
    isSplittingDisabled: true,
    isBitPayProtocolSupported: true
  },
  feathercoin: {
    initWalletName: s.strings.string_first_feather_coin_wallet_name,
    chainCode: 'FTC',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  groestlcoin: {
    initWalletName: s.strings.string_first_groestlcoin_wallet_name,
    chainCode: 'GRS',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  qtum: {
    initWalletName: s.strings.string_first_qtum_wallet_name,
    chainCode: 'QTUM',
    isPrivateKeySweepable: true,
    isBitPayProtocolSupported: true
  },
  eboost: {
    initWalletName: s.strings.string_first_eboost_wallet_name,
    chainCode: 'EBST',
    isPrivateKeySweepable: true
  },
  ufo: {
    initWalletName: s.strings.string_first_ufo_wallet_name,
    chainCode: 'ufo',
    isPrivateKeySweepable: true
  },
  fantom: {
    initWalletName: s.strings.string_first_fantom_wallet_name,
    chainCode: 'FTM',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_instructions
    },
    isCustomTokensSupported: true
  },
  hedera: {
    initWalletName: s.strings.string_first_hedera_wallet_name,
    chainCode: 'HBAR',
    dummyPublicAddress: '0.0.14625',
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    isAccountActivationRequired: true,
    skipAccountNameValidation: true,
    noMaxSpend: true,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      keyboardType: 'default'
    }
  },
  zcash: {
    initWalletName: s.strings.string_first_zcash_wallet_name,
    chainCode: 'ZEC',
    dummyPublicAddress: 'zs10xwzhkwm0ayzqn99q04l6hhyy76cu6mf6m8cu4xv4pdles7a3puh2cnv7w32qhzktrrsqpwy3n5',
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      keyboardType: 'default'
    }
  },
  polygon: {
    initWalletName: s.strings.string_first_polygon_wallet_name,
    chainCode: 'MATIC',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true
  },
  avalanche: {
    initWalletName: s.strings.string_first_avalanche_wallet_name,
    chainCode: 'AVAX',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: s.strings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: s.strings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true
  }
}

/**
 * Customizes which coins get which options on the wallet list scene.
 */
export const WALLET_LIST_OPTIONS_ICON = '\u2026'
export const WALLET_LIST_MENU: Array<{
  currencyCodes?: string[],
  label: string,
  value: WalletListMenuKey
}> = [
  {
    label: s.strings.string_rename,
    value: 'rename'
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
    currencyCodes: Object.keys(SPECIAL_CURRENCY_INFO)
      .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isCustomTokensSupported)
      .map(pluginId => SPECIAL_CURRENCY_INFO[pluginId].chainCode),
    label: s.strings.string_add_edit_tokens,
    value: 'manageTokens'
  },
  {
    currencyCodes: [
      'BCH',
      'BSV',
      'BTC',
      'BTG',
      'DASH',
      'DGB',
      'DOGE',
      'EBST',
      'EOS',
      'FIRO',
      'FTC',
      'GRS',
      'LTC',
      'QTUM',
      'RVN',
      'SMART',
      'TESTBTC',
      'TLOS',
      'UFO',
      'VTC',
      'WAX',
      'XMR',
      'ZEC'
    ],
    label: s.strings.fragment_wallets_view_xpub,
    value: 'viewXPub'
  },
  {
    label: s.strings.string_get_raw_keys,
    value: 'getRawKeys'
  },
  {
    label: s.strings.string_archive_wallet,
    value: 'delete'
  }
]

export const USD_FIAT = 'iso:USD'
export const getSymbolFromCurrency = (currencyCode: string) => {
  if (typeof currencyCode !== 'string') return ''
  const codeWithoutIso = currencyCode.replace('iso:', '')
  const out = FIAT_CODES_SYMBOLS[codeWithoutIso.toUpperCase()]
  return out != null ? out : ''
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

export const STAKING_BALANCES = {
  staked: ':STAKED',
  locked: ':LOCKED'
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

export const UNSTOPPABLE_DOMAINS = ['.coin', '.wallet', '.bitcoin', '.x', '.888', '.nft', '.dao', '.blockchain', '.zil', '.crypto']
export const ENS_DOMAINS = ['.eth', '.luxe', '.kred', '.xyz', '.art']
