import { EdgeCorePluginsInit } from 'edge-core-js'

import { ENV } from '../env'

export const currencyPlugins: EdgeCorePluginsInit = {
  // edge-currency-accountbased:
  algorand: true,
  binance: true,
  binancesmartchain: ENV.BINANCE_SMART_CHAIN_INIT,
  hedera: true,
  eos: true,
  filecoin: true,
  telos: true,
  wax: true,
  polkadot: true,
  liberland: true,
  liberlandtestnet: false,
  ethereum: ENV.ETHEREUM_INIT,
  ethereumclassic: true,
  ethereumpow: ENV.ETHEREUM_POW_INIT,
  fantom: ENV.FANTOM_INIT,
  fio: ENV.FIO_INIT,
  kovan: ENV.KOVAN_INIT,
  optimism: ENV.OPTIMISM_INIT,
  pulsechain: ENV.PULSECHAIN_INIT,
  polygon: ENV.POLYGON_INIT,
  avalanche: ENV.AVALANCHE_INIT,
  ripple: true,
  rsk: true,
  stellar: true,
  tezos: true,
  solana: true,
  celo: true,
  tron: true,
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
