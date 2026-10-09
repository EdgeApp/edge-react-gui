'use strict'
/**
 * Which paths the CLI gates watch, and which modules they promise to cover.
 *
 * One list, because there were nearly three. `package.json`'s `precommit:cli`
 * had its own hand-written pathspec — `src/cli scripts docs/EDGE_CLI.md
 * docs/api` — and the smoke test below it loads twenty modules under
 * `src/util` and `src/locales`, none of which that pathspec named. So a developer who
 * re-added a `react-native` import to `src/util/utils.ts`, or edited
 * `src/util/txDisplay/displayInfo.ts`, committed with the Node-safety smoke
 * test and both offline suites skipped — the one regression the gate exists
 * to catch, on the files it is pointed at.
 *
 * `uncoveredModules` is what stops that happening again: a shared module
 * outside every gate path is a staged edit the gates cannot see, and
 * `cliGateNeeded.js` refuses to report "no CLI changes" while one exists.
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
  // One `sleep`, replacing three private copies — and the smoke test has to
  // load it, because a `react-native` import added to a leaf the CLI runs
  // breaks the published engine on first start.
  'src/util/sleep.ts',
  'src/cli/engine/routes/rates.ts',
  'src/cli/engine/nodeApiSigner.ts',
  'src/util/keysServer.ts',
  'src/cli/engine/fetchPluginKeys.ts',
  'src/cli/engine/makeCoreContext.ts'
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
 * committed and CI checks it, so
 * a routine bump — "Bump version to v4.52.0", "Upgrade edge-core-js@^2.51.0"
 * — turned `develop` red with nothing local having warned: the gates did not
 * watch `package.json`, and they did not run `cli:manifest:check` even when
 * they did run. Both are fixed; `scripts/prepare.sh` also regenerates it, so
 * an install self-heals.
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
  // a commit skipped `cli:manifest:check`, left
  // `src/cli/generated/npmPackage.json` stale, and turned `develop` red at
  // `docs:api:committed` with nothing local having warned.
  'package-lock.json',
  // Four modules the CLI's own value-import graph reaches that none of the
  // directory entries above covers. `uncoveredModules()` only proved
  // `GATE_PATHS` reaches the hand-written `SHARED_MODULES`, and
  // `unwatchedCliModules()` checks smoke coverage, so neither saw that a
  // commit staging only one of these printed "no CLI changes" and skipped
  // every gate — on `src/configKeysMerge.ts`, which this branch edits.
  // `ungatedCliModules()` below now checks the graph directly, so the list
  // cannot drift again.
  'src/configKeysMerge.ts',
  'src/configKeysSchema.ts',
  'src/selectors/WalletSelectors.ts',
  'src/types/types.ts'
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
 * CLI actually loads, and it was not: `src/util/PeriodicTask.ts` is a value
 * import of `src/cli/engine/sweepTicker.ts`, which `SessionStore` and
 * `ObjectHandleStore` both run, and no entry in the list reached it. A
 * `react-native` import added there passed the gate and would have broken
 * the published engine on first start.
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
 * `GATE_PATHS` covers `SHARED_MODULES` — a hand-written list against a
 * hand-written list — and `unwatchedCliModules()` proves the smoke test
 * reaches the graph. Neither asks the question the gate's own header
 * answers "cannot happen again": is every module the CLI imports under a
 * path that makes the gate run? It was not, for four of them, so a commit
 * staging only `src/configKeysMerge.ts` skipped `docs:api:gates`,
 * `cli:manifest:check`, `cli:plugins:check`, `test:cli:node-safe` and
 * `test:cli:offline`.
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
