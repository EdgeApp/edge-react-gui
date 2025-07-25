import { EdgeCorePluginsInit } from 'edge-core-js'

import { ENV } from '../env'

export const currencyPlugins: EdgeCorePluginsInit = {
  // // edge-currency-accountbased:
  abstract: ENV.ABSTRACT_INIT,
  algorand: ENV.ALGORAND_INIT,
  amoy: ENV.AMOY_INIT,
  arbitrum: ENV.ARBITRUM_INIT,
  avalanche: ENV.AVALANCHE_INIT,
  axelar: ENV.AXELAR_INIT,
  base: ENV.BASE_INIT,
  binance: true,
  binancesmartchain: ENV.BINANCE_SMART_CHAIN_INIT,
  bobevm: true,
  botanix: ENV.BOTANIX_INIT,
  cardano: ENV.CARDANO_INIT,
  cardanotestnet: ENV.CARDANO_TESTNET_INIT,
  celo: ENV.CELO_INIT,
  coreum: ENV.COREUM_INIT,
  cosmoshub: ENV.COSMOSHUB_INIT,
  ecash: ENV.ECASH_INIT,
  eos: true,
  ethereum: ENV.ETHEREUM_INIT,
  ethereumclassic: true,
  ethereumpow: ENV.ETHEREUM_POW_INIT,
  fantom: ENV.FANTOM_INIT,
  filecoin: ENV.FILECOIN_INIT,
  filecoinfevm: ENV.FILECOINFEVM_INIT,
  filecoinfevmcalibration: ENV.FILECOINFEVM_CALIBRATION_INIT,
  fio: ENV.FIO_INIT,
  hedera: ENV.HEDERA_INIT,
  holesky: ENV.HOLESKY_INIT,
  hyperevm: ENV.HYPEREVM_INIT,
  liberland: ENV.LIBERLAND_INIT,
  liberlandtestnet: false,
  optimism: ENV.OPTIMISM_INIT,
  osmosis: ENV.OSMOSIS_INIT,
  piratechain: true,
  polkadot: ENV.POLKADOT_INIT,
  polygon: ENV.POLYGON_INIT,
  pulsechain: ENV.PULSECHAIN_INIT,
  ripple: true,
  rsk: ENV.RSK_INIT,
  sepolia: ENV.SEPOLIA_INIT,
  solana: ENV.SOLANA_INIT,
  sonic: ENV.SONIC_INIT,
  stellar: true,
  sui: true,
  telos: true,
  tezos: true,
  thorchainrune: ENV.THORCHAIN_INIT,
  thorchainrunestagenet: ENV.THORCHAIN_INIT,
  ton: ENV.TON_INIT,
  tron: true,
  wax: true,
  zano: true,
  zcash: true,
  zksync: ENV.ZKSYNC_INIT,
  // edge-currency-bitcoin:
  bitcoin: ENV.BITCOIN_INIT,
  bitcoincash: ENV.BITCOINCASH_INIT,
  bitcoincashtestnet: false,
  bitcoingold: true,
  bitcoingoldtestnet: false,
  bitcoinsv: true,
  bitcointestnet: true,
  bitcointestnet4: true,
  dash: ENV.DASH_INIT,
  digibyte: ENV.DIGIBYTE_INIT,
  dogecoin: ENV.DOGE_INIT,
  eboost: true,
  feathercoin: true,
  groestlcoin: ENV.GROESTLCOIN_INIT,
  litecoin: ENV.LITECOIN_INIT,
  pivx: ENV.PIVX_INIT,
  qtum: true,
  ravencoin: true,
  smartcash: true,
  ufo: true,
  vertcoin: true,
  zcoin: ENV.ZCOIN_INIT,
  // edge-currency-monero:
  monero: ENV.MONERO_INIT
}

export const swapPlugins = {
  // Centralized Swaps
  changehero: ENV.CHANGEHERO_INIT,
  changenow: ENV.CHANGE_NOW_INIT,
  exolix: ENV.EXOLIX_INIT,
  godex: ENV.GODEX_INIT,
  lifi: ENV.LIFI_INIT,
  letsexchange: ENV.LETSEXCHANGE_INIT,
  sideshift: ENV.SIDESHIFT_INIT,
  swapuz: ENV.SWAPUZ_INIT,

  // Defi Swaps
  rango: ENV.RANGO_INIT,
  spookySwap: false,
  mayaprotocol: ENV.MAYA_PROTOCOL_INIT,
  thorchain: ENV.THORCHAIN_INIT,
  swapkit: ENV.SWAPKIT_INIT,
  tombSwap: ENV.TOMB_SWAP_INIT,
  unizen: false,
  velodrome: true,
  xrpdex: ENV.XRPDEX_INIT,
  '0xgasless': ENV['0XGASLESS_INIT'],

  cosmosibc: true,
  fantomsonicupgrade: true,
  transfer: true
}

export const allPlugins = {
  ...currencyPlugins,
  ...swapPlugins
}
