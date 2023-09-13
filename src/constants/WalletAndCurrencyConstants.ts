import { gte } from 'biggystring'

import { OutlinedTextInputProps } from '../components/themed/OutlinedTextInput'
import { lstrings } from '../locales/strings'
import { StringMap, WalletConnectChainId } from '../types/types'

export const MAX_TOKEN_CODE_CHARACTERS = 7

export const FEE_COLOR_THRESHOLD = 2.0 // this is denominated in dollars
export const FEE_ALERT_THRESHOLD = 5.0 // this is denominated in dollars

export const MAX_ADDRESS_CHARACTERS = 17 // for displaying a truncated wallet address
export const MAX_CRYPTO_AMOUNT_CHARACTERS = 10 // includes both whole and fractional characters
export const FIAT_PRECISION = 2
const UTXO_MAX_SPEND_TARGETS = 32

// Translations for custom fee keys:
export const FEE_STRINGS = {
  gasLimit: lstrings.gasLimit,
  gasPrice: lstrings.gasPrice,
  satPerByte: lstrings.satPerByte
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
  'monero',
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
  'wallet:zksync',
  'wallet:tron',
  'wallet:polkadot',
  'wallet:optimism',
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
  'wallet:piratechain',
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
  'wallet:binancesmartchain',
  'wallet:liberland',
  'wallet:liberlandtestnet'
]

// Put these in reverse order of preference
export const PREFERRED_TOKENS = ['WINGS', 'HERC', 'REPV2', 'RIF']

// Strip away 'wallet:' prefix and '-bip' suffix, if present
export const getPluginId = (walletType: string): string => walletType.replace('wallet:', '').split('-')[0]

export interface ImportKeyOption {
  optionName: string
  displayName: string
  displayDescription?: {
    message: string
    knowledgeBaseUri?: string
  }
  required: boolean
  inputType: OutlinedTextInputProps['keyboardType']
  inputValidation: (input: string) => boolean
}

interface SpecialCurrencyInfo {
  initWalletName: string
  chainCode: string

  // Marketing:
  displayBuyCrypto?: boolean
  displayIoniaRewards?: boolean

  // Localized GUI text:
  dummyPublicAddress?: string
  minimumPopupModals?: {
    minimumNativeBalance: string
    modalMessage: string
    alertMessage: string
  }
  isImportKeySupported: boolean
  importKeyOptions?: ImportKeyOption[]

  // Flags that could move to EdgeCurrencyInfo:
  fioChainCode?: string
  allowZeroTx?: boolean
  hasSegwit?: boolean
  isAccountActivationRequired?: boolean
  tokenActivationAdditionalReserveText?: string
  showTokenNames?: boolean
  isCustomTokensSupported?: boolean
  isUriEncodedStructure?: boolean
  needsAccountNameSetup?: boolean
  skipAccountNameValidation?: boolean
  noChangeMiningFee?: boolean
  noMaxSpend?: boolean
  keysOnlyMode?: boolean
  isPrivateKeySweepable?: boolean
  isPaymentProtocolSupported?: boolean
  isTransactionListUnsupported?: boolean
  isSplittingDisabled?: boolean
  isStakingSupported?: boolean
  stakeActions?: { [stakeActionKey: string]: string }
  stakeLockPeriod?: number
  stakeMaxApy?: number
  maxSpendTargets?: number
  walletConnectV2ChainId?: WalletConnectChainId
}

/*
 * Accepts a walletType or pluginId
 */
export const getSpecialCurrencyInfo = (pluginId: string): SpecialCurrencyInfo => {
  if (SPECIAL_CURRENCY_INFO[pluginId]) {
    return SPECIAL_CURRENCY_INFO[pluginId]
  } else {
    return {
      initWalletName: lstrings.string_no_name,
      chainCode: '',
      displayBuyCrypto: false,
      isImportKeySupported: false
    }
  }
}

export const SPECIAL_CURRENCY_INFO: {
  [pluginId: string]: SpecialCurrencyInfo
} = {
  bitcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    hasSegwit: true,
    initWalletName: lstrings.string_first_bitcoin_wallet_name,
    chainCode: 'BTC',
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  bitcointestnet: {
    hasSegwit: true,
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_testnet_wallet_name,
    chainCode: 'TESTBTC',
    displayBuyCrypto: true,
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  bitcoincash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoincash_wallet_name,
    chainCode: 'BCH',
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  bitcoinsv: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_sv_wallet_name,
    chainCode: 'BSV',
    keysOnlyMode: true,
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  digibyte: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_digibyte_wallet_name,
    chainCode: 'DGB',
    displayBuyCrypto: true,
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  litecoin: {
    hasSegwit: true,
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_litecoin_wallet_name,
    chainCode: 'LTC',
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  rsk: {
    initWalletName: lstrings.string_first_rsk_wallet_name,
    chainCode: 'RBTC',
    dummyPublicAddress: '0x74f9452e22fe58e27575f176fc884729d88267ba', // rj116
    allowZeroTx: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '30'
    }
  },
  stellar: {
    initWalletName: lstrings.string_first_stellar_wallet_name,
    chainCode: 'XLM',
    dummyPublicAddress: 'GBEVGJYAUKJ2TVPMC3GEPI2GGZQLMWZDRWJCVNBXCJ3ELYTDPHVQQM74',
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: lstrings.request_xlm_minimum_notification_body,
      alertMessage: lstrings.request_xlm_minimum_notification_alert_body
    },
    displayBuyCrypto: false,
    isImportKeySupported: true
  },
  ripple: {
    initWalletName: lstrings.string_first_ripple_wallet_name,
    showTokenNames: true,
    chainCode: 'XRP',
    dummyPublicAddress: 'rfuESo7eHUnvebxgaFjfYxfwXhM2uBPAj3',
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: lstrings.request_xrp_minimum_notification_body,
      alertMessage: lstrings.request_xrp_minimum_notification_alert_body
    },
    displayBuyCrypto: false,
    tokenActivationAdditionalReserveText: lstrings.activate_wallet_token_scene_body_xrp_extra,
    isImportKeySupported: true
  },
  monero: {
    initWalletName: lstrings.string_first_monero_wallet_name,
    chainCode: 'XMR',
    dummyPublicAddress: '46qxvuS78CNBoiiKmDjvjd5pMAZrTBbDNNHDoP52jKj9j5mk6m4R5nU6BDrWQURiWV9a2n5Sy8Qo4aJskKa92FX1GpZFiYA',
    isImportKeySupported: false
  },
  eos: {
    chainCode: 'EOS',
    dummyPublicAddress: 'edgecreator2',
    initWalletName: lstrings.string_first_eos_wallet_name,
    isAccountActivationRequired: true,
    isCustomTokensSupported: true,
    isImportKeySupported: true,
    keysOnlyMode: true,
    needsAccountNameSetup: true,
    noChangeMiningFee: true
  },
  telos: {
    initWalletName: lstrings.string_first_telos_wallet_name,
    chainCode: 'TLOS',
    isAccountActivationRequired: true,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true
  },
  wax: {
    initWalletName: lstrings.string_first_wax_wallet_name,
    chainCode: 'WAX',
    isAccountActivationRequired: false,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: false,
    noChangeMiningFee: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    keysOnlyMode: true
  },
  ethereum: {
    initWalletName: lstrings.string_first_ethereum_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '1'
    }
  },
  filecoin: {
    initWalletName: lstrings.string_first_filecoin_wallet_name,
    chainCode: 'FIL',
    allowZeroTx: false,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: false,
    isCustomTokensSupported: false,
    isPaymentProtocolSupported: false,
    noMaxSpend: true
  },
  tron: {
    initWalletName: lstrings.string_first_tron_wallet_name,
    chainCode: 'TRX',
    dummyPublicAddress: 'TG8dEvp1JHJRRWEBzmURjbUwb4sbGbHgKs',
    allowZeroTx: true,
    noChangeMiningFee: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    isStakingSupported: true
  },
  kovan: {
    initWalletName: lstrings.string_first_ethereum_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '42'
    }
  },
  ethereumclassic: {
    initWalletName: lstrings.string_first_ethereum_classic_wallet_name,
    chainCode: 'ETC',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
    isTransactionListUnsupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '61'
    }
  },
  ethereumpow: {
    initWalletName: lstrings.string_first_ethereum_pow_wallet_name,
    chainCode: 'ETHW',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    isTransactionListUnsupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '10001'
    }
  },
  optimism: {
    initWalletName: lstrings.string_first_optimism_wallet_name,
    chainCode: 'OP',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    isStakingSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '10'
    }
  },
  zksync: {
    initWalletName: lstrings.string_first_zksync_wallet_name,
    chainCode: 'OP',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    isTransactionListUnsupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '324'
    }
  },
  tezos: {
    initWalletName: lstrings.string_first_tezos_wallet_name,
    chainCode: 'XTZ',
    noChangeMiningFee: true,
    // will share / copy public address instead of URI on Request scene
    isUriEncodedStructure: true,
    dummyPublicAddress: 'tz1cVgSd4oY25pDkH7vdvVp5DfPkZwT2hXwX',
    isImportKeySupported: true
  },
  binance: {
    initWalletName: lstrings.string_first_bnb_wallet_name,
    chainCode: 'BNB',
    isImportKeySupported: true,
    dummyPublicAddress: 'bnb1rt449yu7us6hmk4pmyr8talc60ydkwp4qkvcl7'
  },
  binancesmartchain: {
    initWalletName: lstrings.string_first_binance_smart_chain_wallet_name,
    chainCode: 'BNB',
    fioChainCode: 'BSC',
    allowZeroTx: true,
    isImportKeySupported: true,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isCustomTokensSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '56'
    }
  },
  solana: {
    initWalletName: lstrings.string_first_solana_wallet_name,
    chainCode: 'SOL',
    isImportKeySupported: true,
    dummyPublicAddress: 'DEd1rkRyr5bRkJHgaAKMSYjYC1KMz3Hc5bSs4Jiwt29x',
    noChangeMiningFee: true
  },
  celo: {
    initWalletName: lstrings.string_first_celo_wallet_name,
    chainCode: 'CELO',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '42220'
    }
  },
  fio: {
    initWalletName: lstrings.string_first_fio_wallet_name,
    chainCode: 'FIO',
    dummyPublicAddress: 'FIO4uX8tSuBZyHJmpPfc5Q6WrZ9eXd33wdgfWvfJ2fjGsg9yH4Dkd',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    stakeActions: {
      add: 'stakeFioTokens',
      remove: 'unStakeFioTokens'
    },
    stakeLockPeriod: 1000 * 60 * 60 * 24 * 7,
    stakeMaxApy: 450
  },
  dash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_dash_wallet_name,
    chainCode: 'DASH',
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  ravencoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ravencoin_wallet_name,
    chainCode: 'RVN',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  dogecoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_doge_wallet_name,
    chainCode: 'DOGE',
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  zcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_zcoin_wallet_name,
    chainCode: 'FIRO',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  smartcash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_smartcash_wallet_name,
    chainCode: 'SMART',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true,
    keysOnlyMode: true
  },
  vertcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_vertcoin_wallet_name,
    chainCode: 'VTC',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  bitcoingold: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_gold_wallet_name,
    chainCode: 'BTG',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isSplittingDisabled: true,
    isPaymentProtocolSupported: true
  },
  feathercoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_feather_coin_wallet_name,
    chainCode: 'FTC',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  groestlcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_groestlcoin_wallet_name,
    chainCode: 'GRS',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  qtum: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_qtum_wallet_name,
    chainCode: 'QTUM',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  eboost: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_eboost_wallet_name,
    chainCode: 'EBST',
    isImportKeySupported: true,
    isPrivateKeySweepable: true,
    keysOnlyMode: true
  },
  ufo: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ufo_wallet_name,
    chainCode: 'ufo',
    isImportKeySupported: true,
    isPrivateKeySweepable: true
  },
  fantom: {
    initWalletName: lstrings.string_first_fantom_wallet_name,
    chainCode: 'FTM',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
    isStakingSupported: true,
    isCustomTokensSupported: true
  },
  hedera: {
    initWalletName: lstrings.string_first_hedera_wallet_name,
    chainCode: 'HBAR',
    dummyPublicAddress: '0.0.14625',
    isImportKeySupported: true,
    isAccountActivationRequired: true,
    skipAccountNameValidation: true,
    noMaxSpend: true,
    noChangeMiningFee: true
  },
  polkadot: {
    initWalletName: lstrings.string_first_polkadot_wallet_name,
    chainCode: 'DOT',
    dummyPublicAddress: '16gmDVJdCaij79PwzCisu7GRudJKABFB8fB5RWpjKX8H4Eh8',
    noChangeMiningFee: true,
    minimumPopupModals: {
      minimumNativeBalance: '10000000000',
      modalMessage: lstrings.request_dot_minimum_notification_body,
      alertMessage: lstrings.request_dot_minimum_notification_alert_body
    },
    isImportKeySupported: true
  },
  liberland: {
    initWalletName: lstrings.string_first_liberland_wallet_name,
    chainCode: 'LLD',
    dummyPublicAddress: '16gmDVJdCaij79PwzCisu7GRudJKABFB8fB5RWpjKX8H4Eh8',
    noChangeMiningFee: true,
    allowZeroTx: true,
    minimumPopupModals: {
      minimumNativeBalance: '1000000000000',
      modalMessage: lstrings.request_lld_minimum_notification_body,
      alertMessage: lstrings.request_lld_minimum_notification_alert_body
    },
    isCustomTokensSupported: false,
    isTransactionListUnsupported: true,
    isImportKeySupported: true
  },
  liberlandtestnet: {
    initWalletName: lstrings.string_first_liberland_wallet_name,
    chainCode: 'LDN',
    dummyPublicAddress: '16gmDVJdCaij79PwzCisu7GRudJKABFB8fB5RWpjKX8H4Eh8',
    noChangeMiningFee: true,
    allowZeroTx: true,
    minimumPopupModals: {
      minimumNativeBalance: '1000000000000',
      modalMessage: lstrings.request_lld_minimum_notification_body,
      alertMessage: lstrings.request_lld_minimum_notification_alert_body
    },
    isCustomTokensSupported: false,
    isTransactionListUnsupported: true,
    isImportKeySupported: true
  },
  zcash: {
    initWalletName: lstrings.string_first_zcash_wallet_name,
    chainCode: 'ZEC',
    dummyPublicAddress: 'zs10xwzhkwm0ayzqn99q04l6hhyy76cu6mf6m8cu4xv4pdles7a3puh2cnv7w32qhzktrrsqpwy3n5',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    importKeyOptions: [
      {
        optionName: 'birthdayHeight',
        displayName: lstrings.create_wallet_import_options_birthday_height,
        displayDescription: {
          message: lstrings.create_wallet_import_options_birthday_height_description,
          knowledgeBaseUri: 'https://edgeapp.zendesk.com/hc/en-us/articles/16347281770907'
        },
        required: true,
        inputType: 'number-pad',
        inputValidation: (input: string) => /^\d+$/.test(input) && gte(input, '419200') // sapling activation height
      }
    ]
  },
  piratechain: {
    initWalletName: lstrings.string_first_piratechain_wallet_name,
    chainCode: 'ARRR',
    dummyPublicAddress: 'zs1ps48sm9yusglfd2y28e7uhfkxfljy38papy00lzdmcdmctczx2hmvchcfjvp3n68zr2tu732y8k',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    keysOnlyMode: true,
    importKeyOptions: [
      {
        optionName: 'birthdayHeight',
        displayName: lstrings.create_wallet_import_options_birthday_height,
        displayDescription: {
          message: lstrings.create_wallet_import_options_birthday_height_description,
          knowledgeBaseUri: 'https://edgeapp.zendesk.com/hc/en-us/articles/16347281770907'
        },
        required: true,
        inputType: 'number-pad',
        inputValidation: (input: string) => /^\d+$/.test(input) && gte(input, '152855') // sapling activation height
      }
    ]
  },
  polygon: {
    initWalletName: lstrings.string_first_polygon_wallet_name,
    chainCode: 'MATIC',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: true,
    isCustomTokensSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '137'
    }
  },
  pulsechain: {
    initWalletName: lstrings.string_first_pulsechain_wallet_name,
    chainCode: 'PLS',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: false,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '369'
    }
  },
  avalanche: {
    initWalletName: lstrings.string_first_avalanche_wallet_name,
    chainCode: 'AVAX',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isCustomTokensSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '43114'
    }
  },
  algorand: {
    initWalletName: lstrings.string_first_algorand_wallet_name,
    chainCode: 'ALGO',
    dummyPublicAddress: 'VRWXR3ACL7TDKGHXEDP3N5C2QMXETLWFWSKDKWWZFXBITSP5OFFGWSHYVE',
    isCustomTokensSupported: true,
    noChangeMiningFee: true,
    tokenActivationAdditionalReserveText: lstrings.activate_wallet_token_scene_body_algo_extra,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'algorand',
      reference: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8='
    }
  }
}

export const USD_FIAT = 'iso:USD'
export const getSymbolFromCurrency = (currencyCode: string) => {
  if (typeof currencyCode !== 'string') return ''
  const codeWithoutIso = currencyCode.replace('iso:', '')
  const out = FIAT_CODES_SYMBOLS[codeWithoutIso.toUpperCase()]
  return out != null ? out : ''
}
export const FIAT_CODES_SYMBOLS: { [code: string]: string } = {
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

export const STAKING_BALANCES: StringMap = {
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
