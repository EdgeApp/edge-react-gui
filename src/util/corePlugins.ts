import { EdgeCorePluginsInit } from 'edge-core-js'

import { ENV } from '../env'

export const currencyPlugins: EdgeCorePluginsInit = {
  // edge-currency-accountbased:
  arbitrum: ENV.ARBITRUM_INIT,
  algorand: true,
  avalanche: ENV.AVALANCHE_INIT,
  base: ENV.BASE_INIT,
  binance: true,
  binancesmartchain: ENV.BINANCE_SMART_CHAIN_INIT,
  celo: true,
  coreum: ENV.COREUM_INIT,
  eos: true,
  ethereum: ENV.ETHEREUM_INIT,
  ethereumclassic: true,
  ethereumpow: ENV.ETHEREUM_POW_INIT,
  fantom: ENV.FANTOM_INIT,
  filecoin: true,
  filecoinfevm: true,
  filecoinfevmcalibration: true,
  fio: ENV.FIO_INIT,
  goerli: ENV.GOERLI_INIT,
  hedera: true,
  kovan: ENV.KOVAN_INIT,
  liberland: true,
  liberlandtestnet: false,
  optimism: ENV.OPTIMISM_INIT,
  osmosis: ENV.OSMOSIS_INIT,
  polkadot: true,
  polygon: ENV.POLYGON_INIT,
  pulsechain: ENV.PULSECHAIN_INIT,
  ripple: true,
  rsk: true,
  solana: ENV.SOLANA_INIT,
  stellar: true,
  telos: true,
  tezos: true,
  thorchainrune: ENV.THORCHAIN_INIT,
  tron: true,
  wax: true,
  zksync: true,
  // edge-currency-bitcoin:
  bitcoin: true,
  bitcoincash: true,
  bitcoincashtestnet: false,
  bitcoingold: true,
  bitcoingoldtestnet: false,
  bitcoinsv: true,
  bitcointestnet: true,
  dash: true,
  digibyte: true,
  dogecoin: true,
  eboost: true,
  feathercoin: true,
  groestlcoin: true,
  litecoin: true,
  qtum: true,
  ravencoin: true,
  smartcash: true,
  ufo: true,
  vertcoin: true,
  zcoin: true,
  // edge-currency-monero:
  monero: ENV.MONERO_INIT,
  piratechain: true,
  zcash: true
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
  tombSwap: ENV.TOMB_SWAP_INIT,
  spookySwap: false,
  thorchain: ENV.THORCHAIN_INIT,
  thorchainda: ENV.THORCHAIN_INIT,
  velodrome: true,
  xrpdex: ENV.XRPDEX_INIT,

  transfer: true
}

export const allPlugins = {
  ...currencyPlugins,
  ...swapPlugins
}
