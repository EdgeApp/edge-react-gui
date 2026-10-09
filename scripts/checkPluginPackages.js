#!/usr/bin/env node
/**
 * Pre-commit / CI gate: the plugin packages the CLI bundles must load.
 *
 * QA found that **no EVM wallet can be created or loaded**:
 * `create-currency-wallet --wallet-type=wallet:ethereum` answers
 * `500 INTERNAL_ERROR "Cannot find module '../abi/ETH_BAL_CHECKER_ABI.json'"`,
 * and the same throw is why `wallet:ethereum` wallets on a real account
 * silently never loaded for three QA rounds — core swallows it while
 * building the engine, so it reaches neither the engine log nor the startup
 * log. `edge-currency-accountbased` ships
 * `lib/ethereum/networkAdapters/RpcAdapter.js`, which requires that JSON,
 * and the package has no `lib/ethereum/abi/` directory at all. That is 29
 * plugin ids under `lib/ethereum/info/` — ethereum, base, arbitrum,
 * optimism, polygon, binancesmartchain, avalanche and the rest — every one
 * of which `currency-configs` advertises.
 *
 * Two more chains are dead for a different reason, which is why there are
 * two checks here: `lib/filecoin/FilecoinTools.js` and
 * `lib/binance/BinanceTools.js` call `bip32.default(ecc)`, the v4 factory
 * API, while the `bip32` that resolves is 2.0.6 — accountbased declares no
 * `bip32` dependency, so it gets the copy `edge-currency-plugins` pinned,
 * and the module throws at load.
 *
 *   1. Every *relative* `require` in a bundled package's `lib` resolves.
 *      Catches a file the package forgot to ship.
 *   2. Every plugin family's `*Tools.js` loads. Catches a bare dependency
 *      whose version does not match, which a scan cannot see.
 *
 * A script rather than a jest case, for check 2: one of these modules uses a
 * dynamic `import()`, and jest's module runtime kills the worker with
 * `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG` instead of throwing
 * something catchable. A plain Node process handles it.
 *
 * The two allowlists are what is broken today, recorded rather than ignored:
 * anything else fails, **and so does one of these starting to work**, which
 * is what gets an entry deleted when the dependency is released instead of
 * leaving a permanent tolerance. While either list has an entry,
 * `docs/EDGE_CLI.md`'s "Which assets work" table has to name it — that is
 * check 3, because the table is the only place a caller learns which chains
 * a Node CLI cannot carry.
 *
 * Usage: node scripts/checkPluginPackages.js
 */
'use strict'

const fs = require('fs')
const path = require('path')
const Module = require('module')

const root = path.join(__dirname, '..')

const PACKAGES = [
  'edge-currency-accountbased',
  'edge-currency-plugins',
  'edge-exchange-plugins'
]

/**
 * Relative requires whose file is not in the package.
 *
 * The fix is a release of `edge-currency-accountbased`: its `paul/cli`
 * `c53b1510` makes the `node` build script copy `src/ethereum/abi`, and
 * 4.99.0 predates it. The app is unaffected — it loads that package's
 * webpack chunks, which inline the JSON.
 */
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

/** Each family named in the guide's table, so a caller can find out. */
const MUST_BE_DOCUMENTED = ['filecoin', 'binance', 'ETH_BAL_CHECKER_ABI']

const problems = []

function scanRelativeRequires() {
  const missing = []
  let files = 0
  for (const pkg of PACKAGES) {
    const base = path.join(root, 'node_modules', pkg, 'lib')
    if (!fs.existsSync(base)) continue
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
          continue
        }
        if (!entry.name.endsWith('.js')) continue
        ++files
        const text = fs.readFileSync(full, 'utf8')
        // `require('./x')` as written, which is what the compiled output
        // uses. A computed specifier is not something this can resolve and
        // not something these packages emit.
        for (const match of text.matchAll(/require\((['"])(\.[^'"]+)\1\)/g)) {
          try {
            Module.createRequire(full).resolve(match[2])
          } catch {
            missing.push(
              `${pkg}: ${path.relative(base, full)} → ${match[2]}`
            )
          }
        }
      }
    }
    walk(base)
  }
  if (files < 100) {
    problems.push(
      `only ${files} plugin files scanned — is node_modules installed?`
    )
  }
  compare('unresolvable relative require', missing, KNOWN_MISSING)
  return files
}

function loadEveryPluginFamily() {
  const base = path.join(
    root,
    'node_modules',
    'edge-currency-accountbased',
    'lib'
  )
  const broken = []
  let tools = 0
  if (!fs.existsSync(base)) return 0
  for (const family of fs.readdirSync(base, { withFileTypes: true })) {
    if (!family.isDirectory()) continue
    for (const entry of fs.readdirSync(path.join(base, family.name))) {
      if (!/Tools\.js$/.test(entry)) continue
      ++tools
      try {
        require(path.join(base, family.name, entry))
      } catch {
        broken.push(`${family.name}/${entry}`)
      }
    }
  }
  if (tools < 15) {
    problems.push(`only ${tools} plugin Tools modules found — is the package installed?`)
  }
  compare('plugin family that will not load', broken, KNOWN_UNLOADABLE)
  return tools
}

/** Both directions: a new break, and one that is no longer broken. */
function compare(what, found, known) {
  const foundSet = new Set(found)
  const knownSet = new Set(known)
  for (const item of found) {
    if (!knownSet.has(item)) problems.push(`new ${what}: ${item}`)
  }
  for (const item of known) {
    if (!foundSet.has(item)) {
      problems.push(
        `${what} "${item}" works now — delete it from the allowlist in ` +
          'scripts/checkPluginPackages.js, and update the "Which assets ' +
          'work" table in docs/EDGE_CLI.md'
      )
    }
  }
}

function checkGuide() {
  if (KNOWN_MISSING.length === 0 && KNOWN_UNLOADABLE.length === 0) return
  const guide = fs.readFileSync(path.join(root, 'docs/EDGE_CLI.md'), 'utf8')
  for (const needle of MUST_BE_DOCUMENTED) {
    if (!guide.includes(needle)) {
      problems.push(
        `docs/EDGE_CLI.md does not mention "${needle}", and a broken ` +
          'plugin family is only discoverable from that table'
      )
    }
  }
}

const files = scanRelativeRequires()
const tools = loadEveryPluginFamily()
checkGuide()

if (problems.length > 0) {
  console.error('✗ plugin packages:\n')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('')
  process.exit(1)
}
console.log(
  `✓ ${files} plugin files scanned and ${tools} plugin families loaded; ` +
    `${KNOWN_MISSING.length + KNOWN_UNLOADABLE.length} known breakages, all ` +
    'documented'
)
