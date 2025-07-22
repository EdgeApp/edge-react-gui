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
  'bitcoincash',
  'bitcoingold',
  'bitcoinsv',
  'bitcointestnet',
  'bitcointestnet4',
  'dash',
  'digibyte',
  'dogecoin',
  'eboost',
  'ethereum',
  'ethereumclassic',
  'feathercoin',
  'groestlcoin',
  'litecoin',
  'monero',
  'pivx',
  'qtum',
  'ravencoin',
  'smartcash',
  'ufo',
  'vertcoin',
  'zcoin'
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
  'wallet:ton',
  'wallet:sui',
  'wallet:ethereumclassic',
  'wallet:binance',
  'wallet:solana',
  'wallet:zano',
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
  'wallet:thorchainrunestagenet',
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

  // Marketing:
  /**
   * Whether to show the "Buy Crypto" button from the wallet details scene.
   *
   * Defaults to `false`.
   */
  displayBuyCrypto?: boolean
  /**
   * @deprecated Whether to show Ionia rewards feature. Defaults to `false`.
   **/
  displayIoniaRewards?: boolean

  // Localized GUI text:
  dummyPublicAddress?: string
  minimumPopupModals?: {
    minimumNativeBalance: string
    modalMessage: string
    alertMessage: string
  }
  /**
   * Whether key import is supported. Defaults to `false`.
   */
  isImportKeySupported: boolean
  importKeyOptions?: ImportKeyOption[]

  // Flags that could move to EdgeCurrencyInfo:
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
  /**
   * This disables the transaction list for the wallet.
   * (Default: false)
   */
  isTransactionListUnsupported?: boolean
  isSplittingDisabled?: boolean
  isStakingSupported?: boolean
  stakeMaxApy?: number
  maxSpendTargets?: number
  /**
   * WalletConnect V2 chain identification information. Defining this will
   * enable WalletConnect V2 support for the wallet.
   */
  walletConnectV2ChainId?: WalletConnectChainId
  /**
   * Whether to show a secondary icon of the chain (network) for native
   * currency wallets. This is used for L2s where the native currency is
   * identical to the L1 native currency (e.g. ETH on Optimism).
   * (Default: false)
   **/
  showChainIcon?: boolean
  /**
   * The ticker for the [unstoppable domains](https://support.unstoppabledomains.com/support/solutions/articles/48001185621).
   */
  unstoppableDomainsTicker?: string
}

/*
 * Accepts a walletType or pluginId
 */
export const getSpecialCurrencyInfo = (
  pluginId: string
): SpecialCurrencyInfo => {
  if (SPECIAL_CURRENCY_INFO[pluginId]) {
    return SPECIAL_CURRENCY_INFO[pluginId]
  } else {
    return {
      initWalletName: lstrings.string_no_name,
      displayBuyCrypto: false,
      isImportKeySupported: false
    }
  }
}

export const SPECIAL_CURRENCY_INFO: {
  [pluginId: string]: SpecialCurrencyInfo
} = {
  abstract: {
    allowZeroTx: true,
    showChainIcon: true,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    initWalletName: lstrings.string_first_abstract_wallet_name,
    isImportKeySupported: true,
    noMaxSpend: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '2741'
    }
  },
  amoy: {
    allowZeroTx: true,
    displayBuyCrypto: false,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    initWalletName: lstrings.string_first_amoy_wallet_name,
    isImportKeySupported: true
  },
  bitcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    hasSegwit: true,
    initWalletName: lstrings.string_first_bitcoin_wallet_name,
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    unstoppableDomainsTicker: 'BTC'
  },
  bitcointestnet: {
    hasSegwit: true,
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_testnet_wallet_name,
    displayBuyCrypto: true,
    isImportKeySupported: true
  },
  bitcointestnet4: {
    hasSegwit: true,
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_testnet_wallet_name,
    displayBuyCrypto: false,
    isImportKeySupported: true
  },
  bitcoincash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoincash_wallet_name,
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    unstoppableDomainsTicker: 'BCH'
  },
  bitcoinsv: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_sv_wallet_name,
    keysOnlyMode: true,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'BSV'
  },
  digibyte: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_digibyte_wallet_name,
    displayBuyCrypto: true,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'DGB'
  },
  litecoin: {
    hasSegwit: true,
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_litecoin_wallet_name,
    displayBuyCrypto: true,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    unstoppableDomainsTicker: 'LTC'
  },
  rsk: {
    initWalletName: lstrings.string_first_rsk_wallet_name,
    dummyPublicAddress: '0x74f9452e22fe58e27575f176fc884729d88267ba', // rj116
    allowZeroTx: true,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '30'
    },
    unstoppableDomainsTicker: 'RSK'
  },
  stellar: {
    initWalletName: lstrings.string_first_stellar_wallet_name,
    dummyPublicAddress:
      'GBEVGJYAUKJ2TVPMC3GEPI2GGZQLMWZDRWJCVNBXCJ3ELYTDPHVQQM74',
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: lstrings.request_xlm_minimum_notification_body,
      alertMessage: lstrings.request_xlm_minimum_notification_alert_body
    },
    displayBuyCrypto: false,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'XLM'
  },
  ripple: {
    initWalletName: lstrings.string_first_ripple_wallet_name,
    showTokenNames: true,
    dummyPublicAddress: 'rfuESo7eHUnvebxgaFjfYxfwXhM2uBPAj3',
    minimumPopupModals: {
      minimumNativeBalance: '1000000',
      modalMessage: lstrings.request_xrp_minimum_notification_body_1xrp,
      alertMessage: lstrings.request_xrp_minimum_notification_alert_body_1xrp
    },
    displayBuyCrypto: false,
    tokenActivationAdditionalReserveText:
      lstrings.activate_wallet_token_scene_body_xrp_extra_point2xrp,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'XRP'
  },
  monero: {
    initWalletName: lstrings.string_first_monero_wallet_name,
    dummyPublicAddress:
      '46qxvuS78CNBoiiKmDjvjd5pMAZrTBbDNNHDoP52jKj9j5mk6m4R5nU6BDrWQURiWV9a2n5Sy8Qo4aJskKa92FX1GpZFiYA',
    isImportKeySupported: false,
    unstoppableDomainsTicker: 'XMR',
    maxSpendTargets: 16
  },
  cardano: {
    initWalletName: lstrings.string_first_cardano_wallet_name,
    noChangeMiningFee: true,
    noMaxSpend: true,
    dummyPublicAddress:
      'addr1qyh498v7479sljadw8mdlmshnlt3n30ewzpqnmvrsz2v8rpqt56tgy6jhzgcc7v8mlh7lhw9a9j2hdlmek4arx2238us9e5fq0',
    isImportKeySupported: true,
    isStakingSupported: true,
    unstoppableDomainsTicker: 'ADA'
  },
  cardanotestnet: {
    initWalletName: lstrings.string_first_cardano_preprod_wallet_name,
    noChangeMiningFee: true,
    noMaxSpend: true,
    dummyPublicAddress:
      'addr_test1qqke2p8jjn322vrm4pns3w0geks83yk965n2myqt4z5dvrcx5reaxqm5g2yhcn76d67lca5hcgfzun7zssej3ashtnxqkghlfn',
    isImportKeySupported: true
  },
  eos: {
    dummyPublicAddress: 'edgecreator2',
    initWalletName: lstrings.string_first_eos_wallet_name,
    isAccountActivationRequired: false,
    isImportKeySupported: true,
    keysOnlyMode: true,
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    unstoppableDomainsTicker: 'EOS'
  },
  telos: {
    initWalletName: lstrings.string_first_telos_wallet_name,
    keysOnlyMode: true,
    isAccountActivationRequired: false,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'TLOS'
  },
  wax: {
    initWalletName: lstrings.string_first_wax_wallet_name,
    isAccountActivationRequired: false,
    dummyPublicAddress: 'edgecreator2',
    needsAccountNameSetup: false,
    noChangeMiningFee: true,
    isImportKeySupported: true,
    keysOnlyMode: true,
    unstoppableDomainsTicker: 'WAXP'
  },
  ecash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ecash_wallet_name,
    displayBuyCrypto: true,
    isImportKeySupported: true,
    isStakingSupported: false,
    unstoppableDomainsTicker: 'ECASH'
  },
  ethereum: {
    initWalletName: lstrings.string_first_ethereum_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '1'
    },
    unstoppableDomainsTicker: 'ETH'
  },
  arbitrum: {
    initWalletName: lstrings.string_first_arbitrum_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    showChainIcon: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '42161'
    }
  },
  base: {
    initWalletName: lstrings.string_first_base_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    showChainIcon: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '8453'
    }
  },
  filecoin: {
    initWalletName: lstrings.string_first_filecoin_wallet_name,
    allowZeroTx: false,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: false,
    noMaxSpend: true,
    unstoppableDomainsTicker: 'FIL'
  },
  filecoinfevm: {
    initWalletName: lstrings.string_first_filecoin_fevm_wallet_name,
    allowZeroTx: false,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: true
  },
  filecoinfevmcalibration: {
    initWalletName: lstrings.string_first_filecoin_fevm_calibratio_wallet_name,
    allowZeroTx: false,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: true
  },
  tron: {
    initWalletName: lstrings.string_first_tron_wallet_name,
    dummyPublicAddress: 'TG8dEvp1JHJRRWEBzmURjbUwb4sbGbHgKs',
    allowZeroTx: true,
    noChangeMiningFee: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    unstoppableDomainsTicker: 'TRX'
  },
  ethereumclassic: {
    initWalletName: lstrings.string_first_ethereum_classic_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '61'
    },
    unstoppableDomainsTicker: 'ETC'
  },
  ethereumpow: {
    initWalletName: lstrings.string_first_ethereum_pow_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isTransactionListUnsupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '10001'
    }
  },
  optimism: {
    initWalletName: lstrings.string_first_optimism_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    showChainIcon: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '10'
    }
  },
  bobevm: {
    initWalletName: lstrings.string_first_bobevm_wallet_name,
    showChainIcon: true,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '60808'
    }
  },
  botanix: {
    initWalletName: lstrings.string_first_botanix_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '3637'
    }
  },
  zksync: {
    allowZeroTx: true,
    showChainIcon: true,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    initWalletName: lstrings.string_first_zksync_wallet_name,
    isImportKeySupported: true,
    noMaxSpend: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '324'
    }
  },
  tezos: {
    initWalletName: lstrings.string_first_tezos_wallet_name,
    noChangeMiningFee: true,
    // will share / copy public address instead of URI on Request scene
    isUriEncodedStructure: true,
    dummyPublicAddress: 'tz1cVgSd4oY25pDkH7vdvVp5DfPkZwT2hXwX',
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'XTZ'
  },
  axelar: {
    initWalletName: lstrings.string_first_axelar_wallet_name,
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
    dummyPublicAddress: 'cosmos1ucnamh638lpgqraetdmcaxk0gz79t4k2akytvf',
    isStakingSupported: false,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'cosmos',
      reference: 'cosmoshub-4'
    },
    unstoppableDomainsTicker: 'ATOM'
  },
  osmosis: {
    initWalletName: lstrings.string_first_osmosis_wallet_name,
    dummyPublicAddress: 'osmo156hdwk3gx4wkq0r5m0s3ag2yj5pawfeudml34a',
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'cosmos',
      reference: 'osmosis-1'
    }
  },
  sui: {
    initWalletName: lstrings.string_first_sui_wallet_name,
    dummyPublicAddress:
      '0x9e58c463e1eed8294d1161d90093afa588236064edac6d78960249e834653805',
    isImportKeySupported: true,
    noChangeMiningFee: true,
    unstoppableDomainsTicker: 'SUI'
  },
  ton: {
    initWalletName: lstrings.string_first_ton_wallet_name,
    dummyPublicAddress: 'UQAc_4sYewa5e5eN1D3nrt9wDy2akCCQ3VyNlhcxF4VozlO5',
    isImportKeySupported: false,
    noChangeMiningFee: true,
    unstoppableDomainsTicker: 'TON'
  },
  thorchainrune: {
    initWalletName: lstrings.string_first_thorchainrune_wallet_name,
    noChangeMiningFee: true,
    dummyPublicAddress: 'thor1mj5j3eke6m9tcvmn8lwwxdrputyvax45lqawch',
    isImportKeySupported: true,
    isStakingSupported: true,
    unstoppableDomainsTicker: 'RUNE'
  },
  thorchainrunestagenet: {
    initWalletName: lstrings.string_first_thorchainrunestagenet_wallet_name,
    noChangeMiningFee: true,
    dummyPublicAddress: 'sthor1mj5j3eke6m9tcvmn8lwwxdrputyvax45lqawch',
    isImportKeySupported: true
  },
  binance: {
    initWalletName: lstrings.string_first_bnb_wallet_name,
    isImportKeySupported: true,
    keysOnlyMode: true,
    dummyPublicAddress: 'bnb1rt449yu7us6hmk4pmyr8talc60ydkwp4qkvcl7'
  },
  binancesmartchain: {
    initWalletName: lstrings.string_first_binance_smart_chain_wallet_name,
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
    isImportKeySupported: true,
    dummyPublicAddress: 'DEd1rkRyr5bRkJHgaAKMSYjYC1KMz3Hc5bSs4Jiwt29x',
    noChangeMiningFee: true,
    unstoppableDomainsTicker: 'SOL'
  },
  celo: {
    initWalletName: lstrings.string_first_celo_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '42220'
    },
    unstoppableDomainsTicker: 'CELO'
  },
  fio: {
    allowZeroTx: true,
    initWalletName: lstrings.string_first_fio_wallet_name,
    dummyPublicAddress: 'FIO4uX8tSuBZyHJmpPfc5Q6WrZ9eXd33wdgfWvfJ2fjGsg9yH4Dkd',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    stakeMaxApy: 450
  },
  dash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_dash_wallet_name,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'DASH'
  },
  ravencoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ravencoin_wallet_name,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'RVN'
  },
  dogecoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_doge_wallet_name,
    displayIoniaRewards: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    unstoppableDomainsTicker: 'DOGE'
  },
  zcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_zcoin_wallet_name,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'FIRO'
  },
  smartcash: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_smartcash_wallet_name,
    isImportKeySupported: true,
    keysOnlyMode: true,
    unstoppableDomainsTicker: 'SMART'
  },
  vertcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_vertcoin_wallet_name,
    isImportKeySupported: true
  },
  bitcoingold: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_bitcoin_gold_wallet_name,
    isImportKeySupported: true,
    isSplittingDisabled: true,
    unstoppableDomainsTicker: 'BTG'
  },
  feathercoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_feather_coin_wallet_name,
    isImportKeySupported: true
  },
  groestlcoin: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_groestlcoin_wallet_name,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'GRS'
  },
  qtum: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_qtum_wallet_name,
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'QTUM'
  },
  eboost: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_eboost_wallet_name,
    isImportKeySupported: true,
    keysOnlyMode: true
  },
  ufo: {
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS,
    initWalletName: lstrings.string_first_ufo_wallet_name,
    isImportKeySupported: true
  },
  fantom: {
    initWalletName: lstrings.string_first_fantom_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isTransactionListUnsupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '250'
    },
    unstoppableDomainsTicker: 'FTM'
  },
  hedera: {
    initWalletName: lstrings.string_first_hedera_wallet_name,
    dummyPublicAddress: '0.0.14625',
    isImportKeySupported: true,
    noMaxSpend: true,
    noChangeMiningFee: true,
    unstoppableDomainsTicker: 'HBAR'
  },
  polkadot: {
    initWalletName: lstrings.string_first_polkadot_wallet_name,
    dummyPublicAddress: '16gmDVJdCaij79PwzCisu7GRudJKABFB8fB5RWpjKX8H4Eh8',
    noChangeMiningFee: true,
    minimumPopupModals: {
      minimumNativeBalance: '10000000000',
      modalMessage: lstrings.request_dot_minimum_notification_body,
      alertMessage: lstrings.request_dot_minimum_notification_alert_body
    },
    isImportKeySupported: true,
    unstoppableDomainsTicker: 'DOT'
  },
  liberland: {
    initWalletName: lstrings.string_first_liberland_wallet_name,
    dummyPublicAddress: '16gmDVJdCaij79PwzCisu7GRudJKABFB8fB5RWpjKX8H4Eh8',
    noChangeMiningFee: true,
    allowZeroTx: true,
    noMaxSpend: true,
    minimumPopupModals: {
      minimumNativeBalance: '1000000000000',
      modalMessage: lstrings.request_lld_minimum_notification_body,
      alertMessage: lstrings.request_lld_minimum_notification_alert_body
    },
    isTransactionListUnsupported: false,
    isImportKeySupported: true
  },
  liberlandtestnet: {
    initWalletName: lstrings.string_first_liberland_wallet_name,
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
  zano: {
    initWalletName: lstrings.string_first_zano_wallet_name,
    dummyPublicAddress:
      'ZxDVeKjCvceATxJ75a6BULddbcytgxHweGjRPqioF9pgF9YSUkFe7fo56WgGr6izuPjg74p4iJvPeY4xNntuoerK1WKNMJQoZ',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    maxSpendTargets: 16,
    importKeyOptions: [
      {
        optionName: 'passphrase',
        displayName: lstrings.create_wallet_import_options_passphrase,
        displayDescription: {
          message: lstrings.create_wallet_import_options_passphrase_description
        },
        required: false,
        inputType: 'default',
        inputValidation: (input: string) => typeof input === 'string'
      }
    ]
  },
  zcash: {
    initWalletName: lstrings.string_first_zcash_wallet_name,
    dummyPublicAddress:
      'zs10xwzhkwm0ayzqn99q04l6hhyy76cu6mf6m8cu4xv4pdles7a3puh2cnv7w32qhzktrrsqpwy3n5',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    keysOnlyMode: isZecBroken(),
    importKeyOptions: [
      {
        optionName: 'birthdayHeight',
        displayName: lstrings.create_wallet_import_options_birthday_height,
        displayDescription: {
          message:
            lstrings.create_wallet_import_options_birthday_height_description,
          knowledgeBaseUri:
            'https://edgeapp.zendesk.com/hc/en-us/articles/16347281770907'
        },
        required: true,
        inputType: 'number-pad',
        inputValidation: (input: string) =>
          /^\d+$/.test(input) && gte(input, '419200') // sapling activation height
      }
    ],
    unstoppableDomainsTicker: 'ZEC'
  },
  piratechain: {
    initWalletName: lstrings.string_first_piratechain_wallet_name,
    dummyPublicAddress:
      'zs1ps48sm9yusglfd2y28e7uhfkxfljy38papy00lzdmcdmctczx2hmvchcfjvp3n68zr2tu732y8k',
    noChangeMiningFee: true,
    isImportKeySupported: true,
    keysOnlyMode: Platform.OS === 'android' && Platform.constants.Version < 28,
    importKeyOptions: [
      {
        optionName: 'birthdayHeight',
        displayName: lstrings.create_wallet_import_options_birthday_height,
        displayDescription: {
          message:
            lstrings.create_wallet_import_options_birthday_height_description,
          knowledgeBaseUri:
            'https://edgeapp.zendesk.com/hc/en-us/articles/16347281770907'
        },
        required: true,
        inputType: 'number-pad',
        inputValidation: (input: string) =>
          /^\d+$/.test(input) && gte(input, '152855') // sapling activation height
      }
    ],
    unstoppableDomainsTicker: 'ARRR'
  },
  pivx: {
    displayBuyCrypto: true,
    hasSegwit: false,
    initWalletName: lstrings.string_first_pivx_wallet_name,
    isImportKeySupported: true,
    maxSpendTargets: UTXO_MAX_SPEND_TARGETS
  },
  polygon: {
    initWalletName: lstrings.string_first_polygon_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: true,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '137'
    },
    unstoppableDomainsTicker: 'MATIC'
  },
  pulsechain: {
    initWalletName: lstrings.string_first_pulsechain_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '369'
    }
  },
  avalanche: {
    initWalletName: lstrings.string_first_avalanche_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    isImportKeySupported: true,
    isStakingSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '43114'
    },
    unstoppableDomainsTicker: 'AVAX'
  },
  algorand: {
    initWalletName: lstrings.string_first_algorand_wallet_name,
    dummyPublicAddress:
      'VRWXR3ACL7TDKGHXEDP3N5C2QMXETLWFWSKDKWWZFXBITSP5OFFGWSHYVE',
    noChangeMiningFee: true,
    tokenActivationAdditionalReserveText:
      lstrings.activate_wallet_token_scene_body_algo_extra,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'algorand',
      reference: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73k'
    },
    unstoppableDomainsTicker: 'ALGO'
  },
  holesky: {
    initWalletName: lstrings.string_first_holesky_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '170000'
    }
  },
  hyperevm: {
    initWalletName: lstrings.string_first_hyperevm_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '999'
    }
  },
  sepolia: {
    initWalletName: lstrings.string_first_sepolia_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '11155111'
    }
  },
  sonic: {
    initWalletName: lstrings.string_first_sonic_wallet_name,
    dummyPublicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
    allowZeroTx: true,
    displayBuyCrypto: false,
    isImportKeySupported: true,
    isStakingSupported: false,
    walletConnectV2ChainId: {
      namespace: 'eip155',
      reference: '146'
    }
  }
}

/**
 * Returns true if the native code will crash on this device.
 * Older versions of iOS have the wrong SQL version,
 * and older Androids don't meet the minimum upstream requirement.
 */
function isZecBroken(): boolean {
  if (Platform.OS === 'ios') {
    const { osVersion = '17' } = Platform.constants
    return Number(osVersion.split('.')[0]) < 15
  }
  if (Platform.OS === 'android') {
    return Platform.constants.Version < 28
  }
  return false
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

export const UNSTOPPABLE_DOMAINS = [
  '.coin',
  '.wallet',
  '.bitcoin',
  '.x',
  '.888',
  '.nft',
  '.dao',
  '.blockchain',
  '.zil',
  '.crypto'
]
export const ENS_DOMAINS = ['.eth', '.luxe', '.kred', '.xyz', '.art']
