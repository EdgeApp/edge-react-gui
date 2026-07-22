import type { EdgeCorePluginsInit, JsonObject } from 'edge-core-js'

import { ENV } from '../env'

const core = ENV.corePlugins as EdgeCorePluginsInit
const swap = ENV.swapPlugins as EdgeCorePluginsInit

// Read a plugin init from the ENV map, falling back to a default enablement
// value when the plugin is absent from the config/keys files.
const coreInit = (
  id: string,
  fallback: boolean | JsonObject = false
): boolean | JsonObject => core[id] ?? fallback
const swapInit = (
  id: string,
  fallback: boolean | JsonObject = false
): boolean | JsonObject => swap[id] ?? fallback

export const currencyPlugins: EdgeCorePluginsInit = {
  // edge-currency-accountbased:
  abstract: coreInit('abstract'),
  algorand: coreInit('algorand', true),
  amoy: coreInit('amoy'),
  arbitrum: coreInit('arbitrum'),
  avalanche: coreInit('avalanche'),
  axelar: coreInit('axelar', true),
  base: coreInit('base'),
  binance: true,
  binancesmartchain: coreInit('binancesmartchain'),
  bobevm: true,
  botanix: coreInit('botanix'),
  cardano: coreInit('cardano'),
  cardanotestnet: coreInit('cardanotestnet'),
  mayachain: coreInit('mayachain'),
  celo: coreInit('celo'),
  coreum: coreInit('coreum'),
  cosmoshub: coreInit('cosmoshub'),
  ecash: coreInit('ecash'),
  eos: true,
  ethereum: coreInit('ethereum'),
  ethereumclassic: true,
  ethereumpow: coreInit('ethereumpow'),
  fantom: coreInit('fantom'),
  filecoin: coreInit('filecoin'),
  filecoinfevm: coreInit('filecoinfevm'),
  filecoinfevmcalibration: coreInit('filecoinfevmcalibration'),
  fio: coreInit('fio', true),
  hedera: coreInit('hedera', true),
  holesky: coreInit('holesky'),
  hyperevm: coreInit('hyperevm'),
  liberland: coreInit('liberland', true),
  liberlandtestnet: false,
  opbnb: coreInit('opbnb'),
  monad: coreInit('monad'),
  monero: coreInit('monero'),
  nym: coreInit('nym'),
  optimism: coreInit('optimism'),
  osmosis: coreInit('osmosis'),
  piratechain: true,
  polkadot: coreInit('polkadot', true),
  polygon: coreInit('polygon'),
  pulsechain: coreInit('pulsechain'),
  ripple: true,
  rsk: coreInit('rsk'),
  sepolia: coreInit('sepolia'),
  solana: coreInit('solana'),
  sonic: coreInit('sonic'),
  stellar: true,
  sui: true,
  telos: true,
  tezos: true,
  thorchainrune: coreInit('thorchainrune'),
  thorchainrunestagenet: coreInit('thorchainrune'),
  ton: coreInit('ton'),
  tron: true,
  wax: true,
  zano: true,
  zcash: true,
  zksync: coreInit('zksync'),
  // edge-currency-bitcoin:
  bitcoin: coreInit('bitcoin'),
  bitcoincash: coreInit('bitcoincash'),
  bitcoincashtestnet: false,
  bitcoingold: true,
  bitcoingoldtestnet: false,
  bitcoinsv: true,
  bitcointestnet: true,
  bitcointestnet4: true,
  dash: coreInit('dash'),
  digibyte: coreInit('digibyte'),
  dogecoin: coreInit('dogecoin'),
  eboost: true,
  feathercoin: true,
  groestlcoin: coreInit('groestlcoin'),
  litecoin: coreInit('litecoin'),
  pivx: coreInit('pivx'),
  qtum: true,
  ravencoin: true,
  smartcash: true,
  ufo: true,
  vertcoin: true,
  zcoin: coreInit('zcoin')
}

export const swapPlugins = {
  // Centralized Swaps
  changehero: swapInit('changehero'),
  changenow: swapInit('changenow'),
  changelly: swapInit('changelly'),
  exolix: swapInit('exolix'),
  godex: swapInit('godex'),
  lifi: swapInit('lifi'),
  letsexchange: swapInit('letsexchange'),
  nexchange: swapInit('nexchange'),
  sideshift: swapInit('sideshift'),
  swapuz: swapInit('swapuz'),
  xgram: swapInit('xgram'),
  nymswap: swapInit('nymswap'),

  // Defi Swaps
  bridgeless: swapInit('bridgeless', { referralId: undefined }),
  rango: swapInit('rango'),
  spookySwap: false,
  mayaprotocol: swapInit('mayaprotocol'),
  thorchain: swapInit('thorchain'),
  swapkit: swapInit('swapkit'),
  swapkitv3: swapInit('swapkitv3'),
  tombSwap: swapInit('tombSwap'),
  unizen: false,
  velodrome: true,
  xrpdex: swapInit('xrpdex'),
  '0xgasless': swapInit('0xgasless'),

  cosmosibc: true,
  fantomsonicupgrade: true,
  transfer: true
}

export const allPlugins = {
  ...currencyPlugins,
  ...swapPlugins
}
