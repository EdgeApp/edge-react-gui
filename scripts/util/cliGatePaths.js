'use strict'
/**
 * Which paths the CLI gates watch, and which modules they promise to cover.
 *
 * One list, read by `cliGateNeeded.js` for `precommit:cli` and by
 * `scripts/cliNodeSafeSmoke.js`, so the paths that run the gates and the
 * modules the smoke test loads cannot drift apart. A shared module the gate
 * paths missed would commit with the Node-safety smoke test and both
 * offline suites skipped, which is the one regression the gate exists to
 * catch, on the files it is pointed at.
 *
 * `uncoveredModules` is what stops that: a shared module outside every gate
 * path is a staged edit the gates cannot see, and `cliGateNeeded.js` refuses
 * to report "no CLI changes" while one exists.
 */

/**
 * GUI modules the CLI shares, which must stay loadable under plain Node.
 *
 * `scripts/cliNodeSafeSmoke.js` requires each one with `react-native*`
 * poisoned, so a GUI import that reaches one of these fails the gate instead
 * of the published CLI.
 */
const SHARED_MODULES = [
  'src/util/fiatConstants.ts',
  'src/util/PeriodicTask.ts',
  'src/util/network.ts',
  'src/util/utils.ts',
  'src/util/exchangeRates.ts',
  'src/locales/strings.ts',
  'src/locales/intl.ts',
  'src/locales/bootLocale.ts',
  'src/locales/nodeLocale.ts',
  'src/cli/bootNodeLocale.ts',
  'src/util/txDisplay/index.ts',
  'src/util/localAccountSettings.ts',
  'src/util/spamThreshold.ts',
  'src/util/txTagging/index.ts',
  'src/util/exchangeDenom.ts',
  'src/util/fillTxsFiat.ts',
  'src/util/txExport/index.ts',
  'src/util/exportTxInfo.ts',
  'src/util/memoUtils.ts',
  // The shared `sleep`. The smoke test has to load it, because a
  // `react-native` import added to a leaf the CLI runs breaks the published
  // engine on first start.
  'src/util/sleep.ts',
  'src/cli/engine/routes/rates.ts',
  'src/cli/engine/nodeApiSigner.ts',
  'src/util/keysServer.ts',
  'src/cli/engine/fetchPluginKeys.ts',
  'src/cli/engine/makeCoreContext.ts',
  // The swap request options and the referral files `fetch-swap-quotes`
  // builds them from, shared with the app's swap scenes.
  'src/util/swapRequestOptions.ts',
  'src/util/accountReferralFiles.ts'
]

/**
 * A staged change to any of these runs the CLI gates.
 *
 * `src/util` and `src/locales` whole, rather than the files the smoke test
 * names: the CLI imports a moving set of them, and a gate that runs too
 * often costs minutes where one that runs too rarely costs a broken publish.
 *
 * `package.json` is here because `src/cli/engine/fetchPluginKeys.ts` reads
 * `version` out of it for the header the engine sends the info server, and
 * because `src/cli/generated/npmPackage.json` mirrors this package's version
 * and pins the dependencies its module graph reaches. That artifact is
 * committed and CI checks it, so a routine version or dependency bump has to
 * run `cli:manifest:check` locally rather than fail in CI with nothing local
 * having warned. `scripts/prepare.sh` also regenerates it, so
 * `npm run prepare` heals it. Not an install: `.npmrc` sets
 * `ignore-scripts=true`, so neither `npm install` nor `npm ci` runs
 * `prepare`, which is why the README and `.travis.yml` run it by hand.
 */
const GATE_PATHS = [
  'src/cli',
  'scripts',
  'docs/EDGE_CLI.md',
  'docs/api',
  'src/util',
  'src/locales',
  'package.json',
  // And the lock, because the published manifest's dependency *values* are
  // the versions it resolves — not the app's ranges. A lock-only commit is
  // routine (`npm dedupe` at the end of `npm run fix`, a dependabot bump, an
  // ordinary `npm install` re-resolving a caret), and without this entry such
  // a commit would skip `cli:manifest:check`, leave
  // `src/cli/generated/npmPackage.json` stale, and fail CI at
  // `docs:api:committed` with nothing local having warned.
  'package-lock.json',
  // Modules the CLI's own value-import graph reaches that none of the
  // directory entries above covers. A commit staging only one of them would
  // otherwise print "no CLI changes" and skip every gate.
  // `ungatedCliModules()` below checks the graph against this list.
  'src/configKeysMerge.ts',
  'src/configKeysSchema.ts',
  'src/selectors/WalletSelectors.ts',
  'src/types/types.ts',
  // The info server's swap disables and the referral tweaks'
  // cleaners, which `fetch-swap-quotes` reads.
  'src/actions/ExchangeInfoActions.ts',
  'src/types/AppleAdsAttributionTypes.ts',
  'src/types/TweakTypes.ts'
]

/** Whether a repo-relative path is one the gates watch. */
function isGatedPath(file) {
  return GATE_PATHS.some(gate => file === gate || file.startsWith(`${gate}/`))
}

/**
 * Shared modules no gate path covers.
 *
 * Empty, or the gate is lying about its reach.
 */
function uncoveredModules() {
  return SHARED_MODULES.filter(mod => !isGatedPath(mod))
}

/**
 * The other direction: modules the CLI loads that the smoke test cannot see.
 *
 * `uncoveredModules` proves `GATE_PATHS` reaches every entry in
 * `SHARED_MODULES`. It says nothing about whether that list is the set the
 * CLI actually loads, and a `react-native` import in a module the CLI loads
 * but the list does not reach breaks the published engine on first start.
 *
 * Walked from the CLI's own entry points, so the list is checked against the
 * graph rather than against itself. `src/cli` is excluded because the smoke
 * test loads those through the two entry points instead.
 *
 * The `require` is lazy: this module is loaded by `cliGateNeeded.js` on every
 * commit, and the walk needs `typescript`.
 */
function unwatchedCliModules() {
  const { CLI_ENTRIES, ROOT, walkGraph } = require('./moduleGraph')
  const fs = require('fs')
  const path = require('path')
  // A listed module that is not in the tree is a named answer, not an
  // `ENOENT` out of the walker: the list is hand-written, so a renamed or
  // not-yet-added file is the ordinary way it goes wrong and the caller
  // wants to be told which entry it was.
  const absent = SHARED_MODULES.filter(
    mod => !fs.existsSync(path.join(ROOT, mod))
  )
  if (absent.length > 0) return absent.map(mod => `${mod} (listed, absent)`)
  const covered = new Set(walkGraph(SHARED_MODULES).modules)
  return walkGraph(CLI_ENTRIES)
    .modules.filter(mod => !mod.startsWith('src/cli/'))
    .filter(mod => !covered.has(mod))
}

/**
 * Modules the CLI loads that no gate path watches.
 *
 * The check the other two do not make. `uncoveredModules()` proves
 * `GATE_PATHS` covers `SHARED_MODULES`, a hand-written list against a
 * hand-written list, and `unwatchedCliModules()` proves the smoke test
 * reaches the graph. Neither asks whether every module the CLI imports is
 * under a path that makes the gate run. A commit staging only a module that
 * is not would skip `docs:api:gates`, `cli:manifest:check`,
 * `cli:plugins:check`, `test:cli:node-safe` and `test:cli:offline`.
 *
 * Lazy `require` for the same reason as `unwatchedCliModules`.
 */
function ungatedCliModules() {
  const { CLI_ENTRIES, walkGraph } = require('./moduleGraph')
  return walkGraph(CLI_ENTRIES).modules.filter(mod => !isGatedPath(mod))
}

module.exports = {
  GATE_PATHS,
  SHARED_MODULES,
  isGatedPath,
  uncoveredModules,
  ungatedCliModules,
  unwatchedCliModules
}
