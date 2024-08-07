import { EdgeCorePluginsInit } from 'edge-core-js'

import { ENV } from '../env'

export const currencyPlugins: EdgeCorePluginsInit = {
  // edge-currency-accountbased:
  amoy: ENV.AMOY_INIT,
  arbitrum: ENV.ARBITRUM_INIT,
  algorand: true,
  avalanche: ENV.AVALANCHE_INIT,
  axelar: true,
  base: ENV.BASE_INIT,
  binance: true,
  binancesmartchain: ENV.BINANCE_SMART_CHAIN_INIT,
  bobevm: true,
  cardano: ENV.CARDANO_INIT,
  cardanotestnet: false, // ENV.CARDANO_INIT,
  celo: true,
  coreum: ENV.COREUM_INIT,
  cosmoshub: true,
  eos: true,
  ethereum: ENV.ETHEREUM_INIT,
  ethereumclassic: true,
  ethereumpow: ENV.ETHEREUM_POW_INIT,
  fantom: ENV.FANTOM_INIT,
  filecoin: ENV.FILECOIN_INIT,
  filecoinfevm: true,
  filecoinfevmcalibration: true,
  fio: ENV.FIO_INIT,
  hedera: true,
  holesky: ENV.HOLESKY_INIT,
  liberland: true,
  liberlandtestnet: false,
  optimism: ENV.OPTIMISM_INIT,
  osmosis: ENV.OSMOSIS_INIT,
  piratechain: true,
  polkadot: true,
  polygon: ENV.POLYGON_INIT,
  pulsechain: ENV.PULSECHAIN_INIT,
  ripple: true,
  rsk: true,
  sepolia: ENV.SEPOLIA_INIT,
  solana: ENV.SOLANA_INIT,
  stellar: true,
  telos: true,
  tezos: true,
  thorchainrune: ENV.THORCHAIN_INIT,
  tron: true,
  wax: true,
  zksync: ENV.ZKSYNC_INIT,
  zcash: true,
  // edge-currency-bitcoin:
  bitcoin: ENV.BITCOIN_INIT,
  bitcoincash: ENV.BITCOINCASH_INIT,
  bitcoincashtestnet: false,
  bitcoingold: true,
  bitcoingoldtestnet: false,
  bitcoinsv: true,
  bitcointestnet: true,
  dash: ENV.DASH_INIT,
  digibyte: ENV.DIGIBYTE_INIT,
  dogecoin: ENV.DOGE_INIT,
  eboost: true,
  feathercoin: true,
  groestlcoin: ENV.GROESTLCOIN_INIT,
  litecoin: ENV.LITECOIN_INIT,
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
  thorchain: ENV.THORCHAIN_INIT,
  thorchainda: ENV.THORCHAIN_INIT,
  tombSwap: ENV.TOMB_SWAP_INIT,
  velodrome: true,
  xrpdex: ENV.XRPDEX_INIT,
  '0xgasless': ENV['0XGASLESS_INIT'],

  cosmosibc: true,
  transfer: true
}

export const allPlugins = {
  ...currencyPlugins,
  ...swapPlugins
}
