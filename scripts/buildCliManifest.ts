/**
 * Generates `src/cli/generated/npmPackage.json`, the manifest the published
 * CLI package ships.
 *
 * The dependency list is the whole reason this exists. `rollup.config.cli.mjs`
 * externalises `Object.keys(packageJson.dependencies)` — the app's entire
 * runtime dependency set — so the bundles leave every one of them as a bare
 * `require`, while actually needing about a dozen. A hand-written list would
 * be wrong the first time a module gained an import, and the failure mode is
 * the worst kind: `npm install` succeeds and the CLI dies on first run with
 * `Cannot find module`.
 *
 * So the list is read off the module graph, from both entry points, the same
 * way rollup decides what to externalise:
 *
 *   - a bare specifier reachable from either entry, that the app declares in
 *     `dependencies`, is declared: that is exactly the set rollup
 *     externalises, so the bundle will `require` it
 *   - a Node builtin needs no declaration
 *   - anything else rollup resolves and inlines, so declaring it would
 *     install a package the bundle does not load
 *
 * Type-only imports are skipped, because Babel strips them before rollup sees
 * them and a package imported only for its types is not a runtime dependency.
 *
 * The graph over-approximates, deliberately. It does not tree-shake at the
 * symbol level, so it sees imports whose bindings rollup goes on to drop —
 * `uuid`, reached through `src/util/utils.ts`, is in neither bundle. Erring
 * that way is the safe direction: an extra declared package installs and sits
 * unused, where a missing one is an `npm install` that succeeds and a CLI that
 * dies on first run.
 *
 * `--require-bundles` runs the bundle cross-check, the one check that proves
 * the published package can resolve what it requires, and refuses to finish
 * without `lib/`. It is opt-in both ways: a `lib/` nobody just built holds
 * whatever an earlier run left, and reading that fails correct commits.
 *
 * `--check` turns this into a staleness gate, like the documentation
 * generators: a new import cannot reach a commit while the manifest still
 * describes the old dependency set.
 */
import fs from 'fs'
import path from 'path'

import { CLI_PACKAGE_FILES, CLI_PACKAGE_META } from '../src/cli/npmMeta'
import { BUILTINS, CLI_ENTRIES, packageOf, walkGraph } from './util/moduleGraph'
import { writeIfChanged } from './writeIfChanged'

/**
 * Refuse to finish without the built bundles.
 *
 * `publishCli.ts` passes it, after `build:cli:all` rather than before, so
 * the require cross-check runs against the bundles that are about to be
 * published instead of against whatever `lib/` happened to hold.
 */
const REQUIRE_BUNDLES = process.argv.includes('--require-bundles')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'src/cli/generated/npmPackage.json')

const appPackage = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
) as {
  version: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

/**
 * The versions the app is actually tested with.
 *
 * `package-lock.json`, because that is what "the app's own range" resolved
 * to on the machine that ran the tests — and npm does not publish a lock, so
 * a published range would resolve again, elsewhere, later.
 */
const lockPackages =
  (
    JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8')
    ) as { packages?: Record<string, { version?: string }> }
  ).packages ?? {}

// The walker lives in `scripts/util/moduleGraph.js`, because the Node-safety
// smoke test needs the same answer and runs under plain Node.
const { modules, packages } = walkGraph(CLI_ENTRIES)
const files = modules.length

/**
 * The version the app's lock resolves a package to.
 *
 * Exact, not the app's caret range. "What the app is tested with" is
 * `package-lock.json`, which npm does not publish, so a range resolved
 * elsewhere: `date-fns ^2.22.1` is locked at `2.29.3`, `sha.js ^2.4.11` at
 * `2.4.12`, `base-x ^4.0.0` at `4.0.1`. An install of `@edgeapp/cli@4.52.0`
 * next month would have taken whatever the ranges then admitted, which is
 * the opposite of the lockstep the version pin is for.
 */
function lockedVersion(name: string): string | null {
  const entry = lockPackages[`node_modules/${name}`]
  return entry?.version ?? null
}

const dependencies: Record<string, string> = {}
const bundled: string[] = []
const undeclared: string[] = []
const unlocked: string[] = []
for (const name of [...packages].sort()) {
  if (appPackage.dependencies[name] != null) {
    const locked = lockedVersion(name)
    if (locked == null) {
      // A dependency the lock does not resolve is a lock that is out of step
      // with `package.json`, which is worth saying rather than silently
      // falling back to a range.
      unlocked.push(name)
      dependencies[name] = appPackage.dependencies[name]
    } else {
      dependencies[name] = locked
    }
  } else if (appPackage.devDependencies[name] != null) {
    bundled.push(name)
  } else {
    undeclared.push(name)
  }
}

/**
 * Peers of the CLI's own dependencies that an install would pull in.
 *
 * `edge-currency-accountbased` declares four React Native modules as
 * non-optional `peerDependencies` with an empty `peerDependenciesMeta`, so
 * npm 7+ installs them — measured on `{"edge-currency-accountbased":
 * "^4.99.0"}` alone: 920 packages, including `react-native` and `react`. The
 * app satisfies those peers from its own `dependencies`; a global CLI install
 * has no reason to carry React Native, and the engine never loads these
 * modules (`test:cli:node-safe` fails if anything on its graph does).
 *
 * Read from the installed tree, so this needs no network: a peer that
 * appears, or one that stops being optional, shows up here rather than in
 * someone's `npm install -g`.
 */
const NOT_WANTED_PEERS = [
  'react-native',
  'react-native-monero',
  'react-native-pirate-wallet',
  'react-native-zano',
  'react-native-zcash'
]
const forcedPeers: string[] = []
for (const name of Object.keys(dependencies)) {
  const peerPath = path.join(ROOT, 'node_modules', name, 'package.json')
  if (!fs.existsSync(peerPath)) continue
  const peerPackage = JSON.parse(fs.readFileSync(peerPath, 'utf8')) as {
    peerDependencies?: Record<string, string>
    peerDependenciesMeta?: Record<string, { optional?: boolean }>
  }
  for (const peer of Object.keys(peerPackage.peerDependencies ?? {})) {
    if (!NOT_WANTED_PEERS.includes(peer)) continue
    if (peerPackage.peerDependenciesMeta?.[peer]?.optional === true) continue
    forcedPeers.push(`${name} → ${peer}`)
  }
}

const meta = CLI_PACKAGE_META
// Lockstep with the app, so there is no second version to bump and a reader
// can tell at a glance which app release a published CLI corresponds to.
const version = appPackage.version
const manifest = {
  $comment:
    'GENERATED FILE — DO NOT EDIT. Produced by scripts/buildCliManifest.ts ' +
    'from src/cli/npmMeta.ts and the module graph under src/cli. ' +
    '`scripts/publishCli.ts` strips this key before publishing. ' +
    'Run `npm run cli:manifest` to regenerate.',
  name: meta.name,
  version,
  description: meta.description,
  keywords: meta.keywords,
  homepage: meta.homepage,
  repository: {
    type: 'git',
    url: meta.repositoryUrl,
    directory: meta.repositoryDirectory
  },
  license: meta.license,
  author: meta.author,
  engines: meta.engines,
  bin: { [meta.binName]: 'edgeCli.js' },
  files: CLI_PACKAGE_FILES,
  dependencies
}

const changed = writeIfChanged(OUT, JSON.stringify(manifest, null, 2) + '\n', {
  why: 'The CLI gained or lost an import, so its npm dependencies moved.',
  run: 'npm run cli:manifest'
})
console.log(
  `${changed ? '✓ wrote' : '· unchanged'} src/cli/generated/npmPackage.json ` +
    `(${
      Object.keys(dependencies).length
    } dependencies from ${files} modules, ` +
    `${bundled.length} bundled)`
)
if (bundled.length > 0) {
  console.log(`  bundled, not declared: ${bundled.join(', ')}`)
}
// When the bundles are built, say which declared packages neither of them
// actually requires. The graph over-approximates on purpose, and that is the
// safe direction — but an unused declaration still installs, and `date-fns`
// alone is 25 MB. It is reached through `src/locales/intl.ts`, whose `format`
// binding no CLI path calls today, so rollup shakes it out; it stays declared
// because the moment a CLI path does call it, a missing declaration is an
// `npm install` that succeeds and a CLI that cannot resolve a module.
const bundles = ['lib/edgeCli.js', 'lib/edgeEngine.js'].map(f =>
  path.join(ROOT, f)
)
// Only under `--require-bundles`, and that flag is the whole gate. A `lib/`
// that is merely *present* says nothing: it is gitignored, neither `verify`
// nor `precommit:cli` builds it, and what is there is whatever some earlier
// `npm run test:cli:offline:built` left. Reading it anyway turned the
// `required − declared` direction into a trap — drop the last import of a
// package and the fresh manifest correctly stops declaring it while the old
// bundle still `require`s it, so a correct commit failed with
// "✗ the built bundles require date-fns, which the manifest does not
// declare" and no message saying to rebuild, which `npm run cli:manifest`
// cannot fix because the list is graph-derived.
//
// The two callers that want the cross-check — `publishCli.ts` and
// `.travis.yml`'s `script` — already pass the flag after a build, so nothing
// is lost, and `cli:manifest:check` goes back to being only what its name
// says.
const built = REQUIRE_BUNDLES && bundles.every(f => fs.existsSync(f))
if (REQUIRE_BUNDLES && !built) {
  console.error(
    '✗ the built bundles are absent, so the one check that proves the ' +
      'published package can resolve its imports could not run. Run ' +
      '`npm run build:cli` first.'
  )
  process.exit(1)
}
if (!built) {
  console.log(
    '  the require cross-check runs under --require-bundles only, after a ' +
      'build (`npm run publish:cli` and Travis pass it)'
  )
}
if (built) {
  const required = new Set<string>()
  for (const file of bundles) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(/require\('([^']+)'\)/g)) {
      const specifier = match[1]
      if (specifier.startsWith('.') || BUILTINS.has(specifier)) continue
      required.add(packageOf(specifier))
    }
  }
  const missing = Object.keys(dependencies).filter(n => !required.has(n))
  if (missing.length > 0) {
    console.log(
      `  declared but not required by the built bundles: ${missing.join(', ')}`
    )
  }
  const undeclaredByBundle = [...required].filter(n => dependencies[n] == null)
  if (undeclaredByBundle.length > 0) {
    // This direction is a real defect: the published package could not
    // resolve them.
    console.error(
      `✗ the built bundles require ${undeclaredByBundle.join(', ')}, ` +
        'which the manifest does not declare.'
    )
    process.exit(1)
  }
}

if (unlocked.length > 0) {
  console.log(
    `  not resolved by package-lock.json, so published as the app's range: ${unlocked.join(
      ', '
    )}`
  )
}
if (forcedPeers.length > 0) {
  // Said every run, because the fix is not in this repository: npm installs
  // a non-optional peer of a dependency, and the only thing that keeps React
  // Native out of a global CLI install is `--omit=peer`, which the README
  // documents in its install line. If this list ever empties, that line can
  // go.
  console.log(
    `  pulls React Native in through a non-optional peer, so the install ` +
      `line says --omit=peer: ${forcedPeers.join(', ')}`
  )
}

if (undeclared.length > 0) {
  // Not fatal: rollup inlines them, so the published package is fine. It is
  // the *build* that rests on a package nobody declared, resolved only
  // because something else happens to depend on it — so a dependency bump
  // elsewhere can break this bundle with no change here. Worth a line every
  // time rather than a silent pass.
  console.log(
    `  resolved only transitively (declare these if the build should not ` +
      `depend on luck): ${undeclared.join(', ')}`
  )
}
