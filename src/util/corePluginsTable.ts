import type { EdgeCorePluginsInit, JsonObject } from 'edge-core-js'

/**
 * The app's plugin table: which plugins exist, which turn on without keys,
 * and the ones on or off whatever the keys say.
 *
 * The builders take the resolved plugin maps rather than reading the app's
 * `pluginMaps`, so the CLI's engine builds its `pluginsInit` from the same
 * table, fed the same merge of `config.json` and the keys.
 *
 * Node-safe: no react-native, no Redux, no app config.
 */

/** The two maps the table reads, as `resolvePluginMaps` produces them. */
export interface CorePluginMaps {
  corePlugins: Record<string, unknown>
  swapPlugins: Record<string, unknown>
  /** `config.json`'s `BETA_FEATURES`: a beta build offers test networks. */
  betaFeatures?: boolean
}

// Read a plugin init from a resolved map, falling back to a default
// enablement value when the plugin is absent from the config/keys files.
const initFrom =
  (map: Record<string, unknown>) =>
  (id: string, fallback: boolean | JsonObject = false): boolean | JsonObject =>
    (map as EdgeCorePluginsInit)[id] ?? fallback

export function buildAccountbasedPlugins(
  maps: CorePluginMaps
): EdgeCorePluginsInit {
  const coreInit = initFrom(maps.corePlugins)
  return {
    abstract: coreInit('abstract'),
    algorand: coreInit('algorand', true),
    amoy: coreInit('amoy'),
    arbitrum: coreInit('arbitrum'),
    arc: coreInit('arc'),
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
    robinhood: coreInit('robinhood'),
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
    zksync: coreInit('zksync')
  }
}

/**
 * Plugin ids served by `edge-currency-plugins`, whose engines all scan an
 * xpub for UTXOs. `getUtxoPluginIds` in WalletAndCurrencyConstants.ts derives
 * from this, so a chain added here is automatically picked up there.
 */
export function buildUtxoPlugins(maps: CorePluginMaps): EdgeCorePluginsInit {
  const coreInit = initFrom(maps.corePlugins)
  return {
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
    ecash: coreInit('ecash'),
    ecashbitcoin: coreInit('ecashbitcoin'),
    // A test network, so only beta builds offer it, even as a Bitcoin split:
    ecashbitcoinbetanet:
      maps.betaFeatures === true ? coreInit('ecashbitcoinbetanet') : false,
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
}

export function buildCurrencyPlugins(
  maps: CorePluginMaps
): EdgeCorePluginsInit {
  return {
    ...buildAccountbasedPlugins(maps),
    ...buildUtxoPlugins(maps)
  }
}

export function buildSwapPlugins(maps: CorePluginMaps): EdgeCorePluginsInit {
  const swapInit = initFrom(maps.swapPlugins)

  return {
    // Centralized Swaps
    changehero: swapInit('changehero'),
    changenow: swapInit('changenow'),
    changelly: swapInit('changelly'),
    exolix: swapInit('exolix'),
    godex: swapInit('godex'),
    houdini: swapInit('houdini'),
    lifi: swapInit('lifi'),
    mptrade: swapInit('mptrade'),
    nexchange: swapInit('nexchange'),
    sideshift: swapInit('sideshift'),
    swapter: swapInit('swapter'),
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
    // Same provider and credentials as `mptrade`; this registration is the
    // DEX-classified half, whose route set is Solana-to-Solana today.
    mptradedefi: swapInit('mptrade'),
    tombSwap: swapInit('tombSwap'),
    unizen: false,
    velodrome: true,
    xrpdex: swapInit('xrpdex'),
    '0xgasless': swapInit('0xgasless'),

    cosmosibc: true,
    fantomsonicupgrade: true,
    transfer: true
  }
}
