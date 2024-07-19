import { gte } from 'biggystring'
import { Platform } from 'react-native'

import { lstrings } from '../locales/strings'
import { WalletConnectChainId } from '../types/types'
import { removeIsoPrefix } from '../util/utils'

export const MAX_TOKEN_CODE_CHARACTERS = 7

export const FEE_COLOR_THRESHOLD = 2.0 // this is denominated in dollars
export const FEE_ALERT_THRESHOLD = 5.0 // this is denominated in dollars

export const MAX_ADDRESS_CHARACTERS = 17 // for displaying a truncated wallet address
export const MAX_CRYPTO_AMOUNT_CHARACTERS = 10 // includes both whole and fractional characters
export const FIAT_PRECISION = 2
const UTXO_MAX_SPEND_TARGETS = 32

// Sync status consts
export const MIN_RATIO = 0.02
export const MAX_RATIO = 0.95
export const RESYNC_THRESHOLD = 0.05
export const DONE_THRESHOLD = 0.999

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
  'wallet:liberlandtestnet',
  'wallet:coreum',
  'wallet:osmosis',
  'wallet:thorchainrune',
  'wallet:bobevm'
]

// Put these in reverse order of preference
export const PREFERRED_TOKENS = ['WINGS', 'HERC', 'REPV2', 'RIF']

export interface ImportKeyOption {
  optionName: string
  displayName: string
  displayDescription?: {
    message: string
    knowledgeBaseUri?: string
  }
  required: boolean
  inputType: 'default' | 'number-pad'
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
  isUriEncodedStructure?: boolean
  needsAccountNameSetup?: boolean
  noChangeMiningFee?: boolean
  noMaxSpend?: boolean
  keysOnlyMode?: boolean
  isPaymentProtocolSupported?: boolean
  isTransactionListUnsupported?: boolean
  isSplittingDisabled?: boolean
  isStakingSupported?: boolean
  stakeActions?: { [stakeActionKey: string]: string }
  stakeMaxApy?: number
  maxSpendTargets?: number
  walletConnectV2ChainId?: WalletConnectChainId
  chainIcon?: boolean
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
  amoy: {
    allowZeroTx: true,
    chainCode: 'ETH',
    displayBuyCrypto: false,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    initWalletName: lstrings.string_first_amoy_wallet_name,
    isImportKeySupported: true,
    isPaymentProtocolSupported: false
  },
  bitcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    hasSegwit: true,
    initWalletName: lstrings.string_first_bitcoin_wallet_name,
    chainCode: 'BTC',
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPaymentProtocolSupported: true
  },
  bitcointestnet: {
    hasSegwit: true,
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_testnet_wallet_name,
    chainCode: 'TESTBTC',
    displayBuyCrypto: true,
    isImportKeySupported: true,
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
    isPaymentProtocolSupported: true
  },
  bitcoinsv: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_sv_wallet_name,
    chainCode: 'BSV',
    keysOnlyMode: true,
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  digibyte: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_digibyte_wallet_name,
    chainCode: 'DGB',
    displayBuyCrypto: true,
    isImportKeySupported: true,
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
    isPaymentProtocolSupported: true
  },
  rsk: {
    initWalletName: lstrings.string_first_rsk_wallet_name,
    chainCode: 'RBTC',
    dummyPublicAddress: '0x74f9452e22fe58e27575f176fc884729d88267ba', // rj116
    allowZeroTx: true,
    isImportKeySupported: true,
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
  cardano: {
    initWalletName: lstrings.string_first_cardano_wallet_name,
    chainCode: 'ADA',
    noChangeMiningFee: true,
    noMaxSpend: true,
    dummyPublicAddress: 'addr1qyh498v7479sljadw8mdlmshnlt3n30ewzpqnmvrsz2v8rpqt56tgy6jhzgcc7v8mlh7lhw9a9j2hdlmek4arx2238us9e5fq0',
    isImportKeySupported: true
  },
  cardanotestnet: {
    initWalletName: lstrings.string_first_cardano_preprod_wallet_name,
    chainCode: 'ADA',
    noChangeMiningFee: true,
    noMaxSpend: true,
    dummyPublicAddress: 'addr_test1qqke2p8jjn322vrm4pns3w0geks83yk965n2myqt4z5dvrcx5reaxqm5g2yhcn76d67lca5hcgfzun7zssej3ashtnxqkghlfn',
    isImportKeySupported: true
  },
  eos: {
    chainCode: 'EOS',
    dummyPublicAddress: 'edgecreator2',
    initWalletName: lstrings.string_first_eos_wallet_name,
    isAccountActivationRequired: false,
    isImportKeySupported: true,
    keysOnlyMode: true,
    needsAccountNameSetup: true,
    noChangeMiningFee: true
  },
  telos: {
    initWalletName: lstrings.string_first_telos_wallet_name,
    chainCode: 'TLOS',
    keysOnlyMode: true,
    isAccountActivationRequired: false,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    isImportKeySupported: true
  },
  wax: {
    initWalletName: lstrings.string_first_wax_wallet_name,
    chainCode: 'WAX',
    isAccountActivationRequired: false,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: false,
    noChangeMiningFee: true,
    isImportKeySupported: true,
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
    isPaymentProtocolSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '1'
    }
  },
  arbitrum: {
    initWalletName: lstrings.string_first_arbitrum_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isPaymentProtocolSupported: false,
    chainIcon: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '42161'
    }
  },
  base: {
    initWalletName: lstrings.string_first_base_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isPaymentProtocolSupported: false,
    chainIcon: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '8453'
    }
  },
  filecoin: {
    initWalletName: lstrings.string_first_filecoin_wallet_name,
    chainCode: 'FIL',
    allowZeroTx: false,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: false,
    isPaymentProtocolSupported: false,
    noMaxSpend: true
  },
  filecoinfevm: {
    initWalletName: lstrings.string_first_filecoin_fevm_wallet_name,
    chainCode: 'FIL',
    allowZeroTx: false,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPaymentProtocolSupported: false
  },
  filecoinfevmcalibration: {
    initWalletName: lstrings.string_first_filecoin_fevm_calibratio_wallet_name,
    chainCode: 'tFIL',
    allowZeroTx: false,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPaymentProtocolSupported: false
  },
  tron: {
    initWalletName: lstrings.string_first_tron_wallet_name,
    chainCode: 'TRX',
    dummyPublicAddress: 'TG8dEvp1JHJRRWEBzmURjbUwb4sbGbHgKs',
    allowZeroTx: true,
    noChangeMiningFee: true,
    isImportKeySupported: true,
    isPaymentProtocolSupported: false,
    isStakingSupported: true
  },
  ethereumclassic: {
    initWalletName: lstrings.string_first_ethereum_classic_wallet_name,
    chainCode: 'ETC',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
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
    isPaymentProtocolSupported: false,
    isStakingSupported: true,
    chainIcon: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '10'
    }
  },
  bobevm: {
    initWalletName: lstrings.string_first_bobevm_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '60808'
    }
  },
  zksync: {
    initWalletName: lstrings.string_first_zksync_wallet_name,
    chainCode: 'OP',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isPaymentProtocolSupported: false,
    chainIcon: true,
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
  axelar: {
    initWalletName: lstrings.string_first_axelar_wallet_name,
    chainCode: 'AXL',
    dummyPublicAddress: 'axelar1hap5ld4fl82wjn67j96unpgee5yxh0njs0eswf',
    isStakingSupported: false,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'cosmos',
      reference: 'axelar-dojo-1'
    }
  },
  coreum: {
    initWalletName: lstrings.string_first_coreum_wallet_name,
    chainCode: 'COREUM',
    dummyPublicAddress: 'core18rv2a6cjkk3lnayy29hez6s2ftpe9llqnce2vu',
    isStakingSupported: true,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'cosmos',
      reference: 'coreum-mainnet-1'
    }
  },
  cosmoshub: {
    initWalletName: lstrings.string_first_cosmoshub_wallet_name,
    chainCode: 'ATOM',
    dummyPublicAddress: 'cosmos1ucnamh638lpgqraetdmcaxk0gz79t4k2akytvf',
    isStakingSupported: false,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'cosmos',
      reference: 'cosmoshub-4'
    }
  },
  osmosis: {
    initWalletName: lstrings.string_first_osmosis_wallet_name,
    chainCode: 'OSMO',
    dummyPublicAddress: 'osmo156hdwk3gx4wkq0r5m0s3ag2yj5pawfeudml34a',
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'cosmos',
      reference: 'osmosis-1'
    }
  },
  thorchainrune: {
    initWalletName: lstrings.string_first_thorchainrune_wallet_name,
    chainCode: 'RUNE',
    noChangeMiningFee: true,
    dummyPublicAddress: 'thor1mj5j3eke6m9tcvmn8lwwxdrputyvax45lqawch',
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
    isStakingSupported: true,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
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
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '42220'
    }
  },
  fio: {
    allowZeroTx: true,
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
    stakeMaxApy: 450
  },
  dash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_dash_wallet_name,
    chainCode: 'DASH',
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  ravencoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ravencoin_wallet_name,
    chainCode: 'RVN',
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  dogecoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_doge_wallet_name,
    chainCode: 'DOGE',
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    isPaymentProtocolSupported: true
  },
  zcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_zcoin_wallet_name,
    chainCode: 'FIRO',
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  smartcash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_smartcash_wallet_name,
    chainCode: 'SMART',
    isImportKeySupported: true,
    isPaymentProtocolSupported: true,
    keysOnlyMode: true
  },
  vertcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_vertcoin_wallet_name,
    chainCode: 'VTC',
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  bitcoingold: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_gold_wallet_name,
    chainCode: 'BTG',
    isImportKeySupported: true,
    isSplittingDisabled: true,
    isPaymentProtocolSupported: true
  },
  feathercoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_feather_coin_wallet_name,
    chainCode: 'FTC',
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  groestlcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_groestlcoin_wallet_name,
    chainCode: 'GRS',
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  qtum: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_qtum_wallet_name,
    chainCode: 'QTUM',
    isImportKeySupported: true,
    isPaymentProtocolSupported: true
  },
  eboost: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_eboost_wallet_name,
    chainCode: 'EBST',
    isImportKeySupported: true,
    keysOnlyMode: true
  },
  ufo: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ufo_wallet_name,
    chainCode: 'ufo',
    isImportKeySupported: true
  },
  fantom: {
    initWalletName: lstrings.string_first_fantom_wallet_name,
    chainCode: 'FTM',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '250'
    }
  },
  hedera: {
    initWalletName: lstrings.string_first_hedera_wallet_name,
    chainCode: 'HBAR',
    dummyPublicAddress: '0.0.14625',
    isImportKeySupported: true,
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
    noMaxSpend: true,
    minimumPopupModals: {
      minimumNativeBalance: '1000000000000',
      modalMessage: lstrings.request_lld_minimum_notification_body,
      alertMessage: lstrings.request_lld_minimum_notification_alert_body
    },
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
    isTransactionListUnsupported: true,
    isImportKeySupported: true
  },
  zcash: {
    initWalletName: lstrings.string_first_zcash_wallet_name,
    chainCode: 'ZEC',
    dummyPublicAddress: 'zs10xwzhkwm0ayzqn99q04l6hhyy76cu6mf6m8cu4xv4pdles7a3puh2cnv7w32qhzktrrsqpwy3n5',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    keysOnlyMode:
      Platform.OS === 'ios'
        ? // Get the major version number:
          Number(Platform.constants.osVersion.split('.')[0]) < 15
        : Platform.OS === 'android'
        ? Platform.constants.Version < 28
        : false,
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
    keysOnlyMode: Platform.OS === 'android' ? Platform.constants.Version < 28 : Platform.OS === 'ios',
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
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '43114'
    }
  },
  algorand: {
    initWalletName: lstrings.string_first_algorand_wallet_name,
    chainCode: 'ALGO',
    dummyPublicAddress: 'VRWXR3ACL7TDKGHXEDP3N5C2QMXETLWFWSKDKWWZFXBITSP5OFFGWSHYVE',
    noChangeMiningFee: true,
    tokenActivationAdditionalReserveText: lstrings.activate_wallet_token_scene_body_algo_extra,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'algorand',
      reference: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73k'
    }
  },
  holesky: {
    initWalletName: lstrings.string_first_holesky_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isPaymentProtocolSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '170000'
    }
  },
  sepolia: {
    initWalletName: lstrings.string_first_sepolia_wallet_name,
    chainCode: 'ETH',
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isPaymentProtocolSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '11155111'
    }
  }
}

export const USD_FIAT = 'iso:USD'
/**
 * Get the fiat symbol from an iso:[fiat] OR fiat currency code
 */
export const getFiatSymbol = (isoOrFiatCurrencyCode: string) => {
  if (typeof isoOrFiatCurrencyCode !== 'string') return ''
  const codeWithoutIso = removeIsoPrefix(isoOrFiatCurrencyCode)
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

export const FIO_WALLET_TYPE = 'wallet:fio'
export const FIO_STR = 'FIO'
export const FIO_PLUGIN_ID = 'fio'
export const FIO_DOMAIN_DEFAULT = {
  name: 'edge',
  expiration: new Date().toDateString(),
  isPublic: true,
  walletId: ''
}
export const FIO_ADDRESS_DELIMITER = '@'

export const UNSTOPPABLE_DOMAINS = ['.coin', '.wallet', '.bitcoin', '.x', '.888', '.nft', '.dao', '.blockchain', '.zil', '.crypto']
export const ENS_DOMAINS = ['.eth', '.luxe', '.kred', '.xyz', '.art']
