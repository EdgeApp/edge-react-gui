import { EdgeCorePluginsInit } from 'edge-core-js'

import ENV from '../../env.json'

export const currencyPlugins: EdgeCorePluginsInit = {
  // edge-currency-accountbased:
  binance: true,
  binancesmartchain: ENV.BINANCE_SMART_CHAIN_INIT,
  hedera: true,
  eos: true,
  telos: true,
  wax: true,
  polkadot: true,
  ethereum: ENV.ETHEREUM_INIT,
  ethereumclassic: true,
  ethereumpow: ENV.ETHEREUM_POW_INIT,
  fantom: ENV.FANTOM_INIT,
  fio: ENV.FIO_INIT,
  kovan: ENV.KOVAN_INIT,
  polygon: ENV.POLYGON_INIT,
  avalanche: true,
  ripple: true,
  rsk: true,
  stellar: true,
  tezos: true,
  solana: true,
  celo: true,
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
  zcash: true
}

export const swapPlugins = {
  // Centralized Swaps
  changehero: ENV.CHANGEHERO_INIT,
  changenow: ENV.CHANGE_NOW_INIT,
  exolix: ENV.EXOLIX_INIT,
  foxExchange: ENV.FOX_INIT,
  godex: ENV.GODEX_INIT,
  letsexchange: ENV.LETSEXCHANGE_INIT,
  // shapeshift: ENV.SHAPESHIFT_INIT,
  sideshift: ENV.SIDESHIFT_INIT,
  swapuz: ENV.SWAPUZ_INIT,
  switchain: ENV.SWITCHAIN_INIT,

  // Defi Swaps
  tombSwap: ENV.TOMB_SWAP_INIT,
  spookySwap: false,
  thorchain: ENV.THORCHAIN_INIT,
  thorchainda: ENV.THORCHAIN_INIT,

  transfer: true
}

export const allPlugins = {
  ...currencyPlugins,
  ...swapPlugins
}
