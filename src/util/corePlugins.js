// @flow

import ENV from '../../env.json'

// Shim old-format env.json files:
if (ENV.ETHEREUM_INIT == null && (ENV.ETHERSCAN_API_KEY || ENV.INFURA_PROJECT_ID)) {
  ENV.ETHEREUM_INIT = {
    // blockcypherApiKey: '...',
    etherscanApiKey: ENV.ETHERSCAN_API_KEY,
    infuraProjectId: ENV.INFURA_PROJECT_ID
  }
}

if (ENV.SHAPESHIFT_INIT == null && ENV.SHAPESHIFT_API_KEY && ENV.SHAPESHIFT_CLIENT_ID && ENV.SHAPESHIFT_SECRET) {
  ENV.SHAPESHIFT_INIT = {
    apiKey: ENV.SHAPESHIFT_API_KEY,
    clientId: ENV.SHAPESHIFT_CLIENT_ID,
    secret: ENV.SHAPESHIFT_SECRET
  }
}

if (ENV.CHANGE_NOW_INIT == null && ENV.CHANGE_NOW_API_KEY) {
  ENV.CHANGE_NOW_INIT = {
    apiKey: ENV.CHANGE_NOW_API_KEY
  }
}

export const currencyPlugins = {
  // edge-currency-accountbased:
  binance: true,
  binancesmartchain: ENV.BINANCE_SMART_CHAIN_INIT,
  hedera: true,
  eos: true,
  telos: true,
  wax: true,
  ethereum: ENV.ETHEREUM_INIT,
  ethereumclassic: true,
  fantom: ENV.FANTOM_INIT,
  fio: ENV.FIO_INIT || true,
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

export const ratePlugins = {
  bitmax: true,
  'shapeshift-rate': false,
  compound: true,
  coinbase: true,
  coincap: true,
  coinmonitor: true,
  coingecko: true,
  constantRate: true,
  coincapLegacy: false,
  edgeRates: true,
  nomics: ENV.NOMICS_INIT,
  currencyconverterapi: ENV.CURRENCYCONVERTERAPI_INIT,
  wazirx: true
}

export const swapPlugins = {
  changelly: ENV.CHANGELLY_INIT,
  changenow: ENV.CHANGE_NOW_INIT,
  exolix: ENV.EXOLIX_INIT,
  foxExchange: ENV.FOX_INIT,
  godex: ENV.GODEX_INIT,
  // shapeshift: ENV.SHAPESHIFT_INIT,
  sideshift: ENV.SIDESHIFT_INIT,
  switchain: ENV.SWITCHAIN_INIT,
  transfer: true
}

export const allPlugins = {
  ...currencyPlugins,
  ...ratePlugins,
  ...swapPlugins
}
