/**
 * What is known to be broken in the plugin packages the CLI bundles.
 *
 * Two readers, so one list. `checkPluginPackages.js` holds the installed
 * packages to it exactly — anything else broken fails, and so does one of
 * these starting to work — and `publishCli.ts` refuses to publish while it
 * has an entry, because a published version cannot be replaced and every
 * EVM chain missing from it is not something a user can work around.
 *
 * The fix for the first two is a release of `edge-currency-accountbased`:
 * its `paul/cli` `c53b1510` makes the `node` build script copy
 * `src/ethereum/abi`, and 4.99.0 through 4.102.0 predate it. The app is
 * unaffected — it loads that package's webpack chunks, which inline the
 * JSON.
 */
'use strict'

/** Relative requires whose file is not in the package. */
const KNOWN_MISSING = [
  'edge-currency-accountbased: ethereum/fees/ethMiningFees.js → ../abi/NODE_INTERFACE_ABI.json',
  'edge-currency-accountbased: ethereum/networkAdapters/RpcAdapter.js → ../abi/ETH_BAL_CHECKER_ABI.json'
]

/** Plugin families whose `*Tools.js` will not load. */
const KNOWN_UNLOADABLE = [
  'binance/BinanceTools.js',
  'ethereum/EthereumTools.js',
  'filecoin/FilecoinTools.js'
]

module.exports = { KNOWN_MISSING, KNOWN_UNLOADABLE }
