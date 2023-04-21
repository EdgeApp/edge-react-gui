import { lstrings } from '../locales/strings'
import { StringMap } from '../types/types'

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
  'wallet:binancesmartchain'
]

// Put these in reverse order of preference
export const PREFERRED_TOKENS = ['WINGS', 'HERC', 'REPV2', 'RIF']

// Strip away 'wallet:' prefix and '-bip' suffix, if present
export const getPluginId = (walletType: string): string => walletType.replace('wallet:', '').split('-')[0]

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
  uniqueIdentifierInfo?: {
    addButtonText: string
    identifierName: string
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad'
  }
  isImportKeySupported?:
    | false
    | {
        privateKeyLabel: string
        privateKeyInstructions: string
      }

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
}

/*
 * Accepts a walletType or pluginId
 */
export const getSpecialCurrencyInfo = (walletType: string = ''): SpecialCurrencyInfo => {
  const pluginId = getPluginId(walletType)
  if (SPECIAL_CURRENCY_INFO[pluginId]) {
    return SPECIAL_CURRENCY_INFO[pluginId]
  } else {
    return {
      initWalletName: lstrings.string_no_name,
      chainCode: '',
      displayBuyCrypto: false
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
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
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
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  bitcoincash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoincash_wallet_name,
    chainCode: 'BCH',
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isStakingSupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  bitcoinsv: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_sv_wallet_name,
    chainCode: 'BSV',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  digibyte: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_digibyte_wallet_name,
    chainCode: 'DGB',
    displayBuyCrypto: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
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
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isStakingSupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  rsk: {
    initWalletName: lstrings.string_first_rsk_wallet_name,
    chainCode: 'RBTC',
    dummyPublicAddress: '0x74f9452e22fe58e27575f176fc884729d88267ba', // rj116
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true
  },
  stellar: {
    initWalletName: lstrings.string_first_stellar_wallet_name,
    chainCode: 'XLM',
    dummyPublicAddress: 'GBEVGJYAUKJ2TVPMC3GEPI2GGZQLMWZDRWJCVNBXCJ3ELYTDPHVQQM74',
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo_id,
      identifierName: lstrings.unique_identifier_memo_id,
      keyboardType: 'default'
    },
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: lstrings.request_xlm_minimum_notification_body,
      alertMessage: lstrings.request_xlm_minimum_notification_alert_body
    },
    displayBuyCrypto: false,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_key_instructions
    }
  },
  ripple: {
    initWalletName: lstrings.string_first_ripple_wallet_name,
    showTokenNames: true,
    chainCode: 'XRP',
    dummyPublicAddress: 'rfuESo7eHUnvebxgaFjfYxfwXhM2uBPAj3',
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_destination_tag,
      identifierName: lstrings.unique_identifier_destination_tag,
      keyboardType: 'numeric'
    },
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: lstrings.request_xrp_minimum_notification_body,
      alertMessage: lstrings.request_xrp_minimum_notification_alert_body
    },
    displayBuyCrypto: false,
    tokenActivationAdditionalReserveText: lstrings.activate_wallet_token_scene_body_xrp_extra,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_key_instructions
    }
  },
  monero: {
    initWalletName: lstrings.string_first_monero_wallet_name,
    chainCode: 'XMR',
    dummyPublicAddress: '46qxvuS78CNBoiiKmDjvjd5pMAZrTBbDNNHDoP52jKj9j5mk6m4R5nU6BDrWQURiWV9a2n5Sy8Qo4aJskKa92FX1GpZFiYA',
    isImportKeySupported: false
  },
  eos: {
    initWalletName: lstrings.string_first_eos_wallet_name,
    chainCode: 'EOS',
    isAccountActivationRequired: true,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_active_key_input_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_active_key_instructions
    },
    isCustomTokensSupported: true
  },
  telos: {
    initWalletName: lstrings.string_first_telos_wallet_name,
    chainCode: 'TLOS',
    isAccountActivationRequired: true,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_active_key_input_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_active_key_instructions
    },
    isCustomTokensSupported: true
  },
  wax: {
    initWalletName: lstrings.string_first_wax_wallet_name,
    chainCode: 'WAX',
    isAccountActivationRequired: false,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: false,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_active_key_input_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_active_key_instructions
    },
    isCustomTokensSupported: true,
    keysOnlyMode: true
  },
  ethereum: {
    initWalletName: lstrings.string_first_ethereum_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isStakingSupported: true,
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false
  },
  tron: {
    initWalletName: lstrings.string_first_tron_wallet_name,
    chainCode: 'TRX',
    dummyPublicAddress: 'TG8dEvp1JHJRRWEBzmURjbUwb4sbGbHgKs',
    allowZeroTx: true,
    noChangeMiningFee: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_note,
      identifierName: lstrings.unique_identifier_note,
      keyboardType: 'default'
    },
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
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false
  },
  ethereumclassic: {
    initWalletName: lstrings.string_first_ethereum_classic_wallet_name,
    chainCode: 'ETC',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    }
  },
  ethereumpow: {
    initWalletName: lstrings.string_first_ethereum_pow_wallet_name,
    chainCode: 'ETHW',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false,
    isTransactionListUnsupported: true
  },
  optimism: {
    initWalletName: lstrings.string_first_optimism_wallet_name,
    chainCode: 'OP',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true,
    isPaymentProtocolSupported: false
  },
  tezos: {
    initWalletName: lstrings.string_first_tezos_wallet_name,
    chainCode: 'XTZ',
    noChangeMiningFee: true,
    // will share / copy public address instead of URI on Request scene
    isUriEncodedStructure: true,
    dummyPublicAddress: 'tz1cVgSd4oY25pDkH7vdvVp5DfPkZwT2hXwX',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    }
  },
  binance: {
    initWalletName: lstrings.string_first_bnb_wallet_name,
    chainCode: 'BNB',
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    },
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    dummyPublicAddress: 'bnb1rt449yu7us6hmk4pmyr8talc60ydkwp4qkvcl7'
  },
  binancesmartchain: {
    initWalletName: lstrings.string_first_binance_smart_chain_wallet_name,
    chainCode: 'BNB',
    fioChainCode: 'BSC',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isCustomTokensSupported: true
  },
  solana: {
    initWalletName: lstrings.string_first_solana_wallet_name,
    chainCode: 'SOL',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_instructions
    },
    dummyPublicAddress: 'DEd1rkRyr5bRkJHgaAKMSYjYC1KMz3Hc5bSs4Jiwt29x',
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    },
    noChangeMiningFee: true
  },
  celo: {
    initWalletName: lstrings.string_first_celo_wallet_name,
    chainCode: 'CELO',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true
  },
  fio: {
    initWalletName: lstrings.string_first_fio_wallet_name,
    chainCode: 'FIO',
    dummyPublicAddress: 'FIO4uX8tSuBZyHJmpPfc5Q6WrZ9eXd33wdgfWvfJ2fjGsg9yH4Dkd',
    noChangeMiningFee: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
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
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_dash_wallet_name,
    chainCode: 'DASH',
    displayIoniaRewards: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  ravencoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ravencoin_wallet_name,
    chainCode: 'RVN',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  dogecoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_doge_wallet_name,
    chainCode: 'DOGE',
    displayIoniaRewards: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isStakingSupported: true,
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  zcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_zcoin_wallet_name,
    chainCode: 'FIRO',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  smartcash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_smartcash_wallet_name,
    chainCode: 'SMART',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true,
    keysOnlyMode: true
  },
  vertcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_vertcoin_wallet_name,
    chainCode: 'VTC',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  bitcoingold: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_gold_wallet_name,
    chainCode: 'BTG',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isSplittingDisabled: true,
    isPaymentProtocolSupported: true
  },
  feathercoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_feather_coin_wallet_name,
    chainCode: 'FTC',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  groestlcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_groestlcoin_wallet_name,
    chainCode: 'GRS',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  qtum: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_qtum_wallet_name,
    chainCode: 'QTUM',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    isPaymentProtocolSupported: true
  },
  eboost: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_eboost_wallet_name,
    chainCode: 'EBST',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true,
    keysOnlyMode: true
  },
  ufo: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ufo_wallet_name,
    chainCode: 'ufo',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isPrivateKeySweepable: true
  },
  fantom: {
    initWalletName: lstrings.string_first_fantom_wallet_name,
    chainCode: 'FTM',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_instructions
    },
    isStakingSupported: true,
    isCustomTokensSupported: true
  },
  hedera: {
    initWalletName: lstrings.string_first_hedera_wallet_name,
    chainCode: 'HBAR',
    dummyPublicAddress: '0.0.14625',
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isAccountActivationRequired: true,
    skipAccountNameValidation: true,
    noMaxSpend: true,
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    }
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
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_polkadot_input_key_or_seed_instructions
    }
  },
  zcash: {
    initWalletName: lstrings.string_first_zcash_wallet_name,
    chainCode: 'ZEC',
    dummyPublicAddress: 'zs10xwzhkwm0ayzqn99q04l6hhyy76cu6mf6m8cu4xv4pdles7a3puh2cnv7w32qhzktrrsqpwy3n5',
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    }
  },
  piratechain: {
    initWalletName: lstrings.string_first_piratechain_wallet_name,
    chainCode: 'ARRR',
    dummyPublicAddress: 'zs1ps48sm9yusglfd2y28e7uhfkxfljy38papy00lzdmcdmctczx2hmvchcfjvp3n68zr2tu732y8k',
    noChangeMiningFee: true,
    uniqueIdentifierInfo: {
      addButtonText: lstrings.unique_identifier_dropdown_option_memo,
      identifierName: lstrings.unique_identifier_memo,
      keyboardType: 'default'
    }
  },
  polygon: {
    initWalletName: lstrings.string_first_polygon_wallet_name,
    chainCode: 'MATIC',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isCustomTokensSupported: true
  },
  avalanche: {
    initWalletName: lstrings.string_first_avalanche_wallet_name,
    chainCode: 'AVAX',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
    },
    isStakingSupported: true,
    isCustomTokensSupported: true
  },
  algorand: {
    initWalletName: lstrings.string_first_algorand_wallet_name,
    chainCode: 'ALGO',
    dummyPublicAddress: 'VRWXR3ACL7TDKGHXEDP3N5C2QMXETLWFWSKDKWWZFXBITSP5OFFGWSHYVE',
    isCustomTokensSupported: true,
    noChangeMiningFee: true,
    tokenActivationAdditionalReserveText: lstrings.activate_wallet_token_scene_body_algo_extra,
    isImportKeySupported: {
      privateKeyLabel: lstrings.create_wallet_import_input_key_or_seed_prompt,
      privateKeyInstructions: lstrings.create_wallet_import_input_key_or_seed_instructions
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
