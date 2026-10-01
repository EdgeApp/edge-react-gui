/**
 * The published CLI package's hand-written metadata.
 *
 * Everything here is a decision. Everything derivable — the dependency list
 * above all — is generated into `src/cli/generated/npmPackage.json` by
 * `scripts/buildCliManifest.ts`, because the dependencies a published CLI
 * needs are not the app's: `rollup.config.cli.mjs` externalises every key of
 * the app's `dependencies`, so what the bundles actually require can only be
 * read off the module graph. Hand-maintaining that list is how a published
 * package ends up missing a package it requires at runtime.
 *
 * The version is not here either: the CLI ships in lockstep with the app, so
 * `buildCliManifest.ts` takes it from the app's own `package.json` and there
 * is no second number to forget to bump. The cost of lockstep is that a
 * version can be published once — npm refuses to replace an existing one — so
 * a CLI-only fix rides on the next app version bump rather than going out on
 * its own.
 *
 * This module is imported by the generator and by nothing the bundles reach,
 * so it adds nothing to either bundle.
 */

/** One native addon shipped as its own per-platform package. */
export interface NativePackage {
  /** The npm package name, e.g. `@edgeapp/cli-darwin-arm64`. */
  name: string
  /** `process.platform` values it is built for. */
  os: string[]
  /** `process.arch` values it is built for. */
  cpu: string[]
}

export interface CliPackageMeta {
  name: string
  description: string
  /** The command name `npm install -g` and `npx` expose. */
  binName: string
  keywords: string[]
  license: string
  author: string
  homepage: string
  repositoryUrl: string
  /** Where the sources live inside the repository, for npm's provenance UI. */
  repositoryDirectory: string
  /** The floor the rollup build targets; see `babelOpts` in the config. */
  engines: { node: string }
  /**
   * Per-platform native packages, published separately and declared as
   * `optionalDependencies`.
   *
   * Each is published at the app's version too, so a platform package and
   * the CLI that looks for it can never disagree.
   *
   * Empty until the fan-out exists. An `optionalDependency` that fails to
   * install is not an install failure, which is what makes the pattern work:
   * npm skips the ones whose `os`/`cpu` do not match and installs only the
   * one that does. Until then the addon rides inside the main package for
   * whichever platform the build server ran on, and
   * `loadNodeApiSignerNative` answers `null` elsewhere — the CLI still runs,
   * unsigned.
   */
  nativePackages: NativePackage[]
}

export const CLI_PACKAGE_META: CliPackageMeta = {
  name: '@edgeapp/cli',
  description:
    'Command-line access to an Edge account: wallets, balances, transactions and swaps.',
  binName: 'edge-cli',
  keywords: ['edge', 'cryptocurrency', 'wallet', 'cli', 'bitcoin', 'ethereum'],
  license: 'SEE LICENSE IN LICENSE',
  author: 'Edge, Inc.',
  homepage: 'https://edge.app',
  // The https form, not the app's `git@` one: npm rewrites an scp-style URL
  // on publish and warns about it, and a public package should be clonable by
  // anyone reading its registry page.
  repositoryUrl: 'git+https://github.com/EdgeApp/edge-react-gui.git',
  repositoryDirectory: 'src/cli',
  engines: { node: '>=18' },
  nativePackages: []
}

/** Files the published package contains, relative to its root. */
export const CLI_PACKAGE_FILES = [
  'edgeCli.js',
  'edgeEngine.js',
  'edge_api_signer.node',
  'README.md',
  'LICENSE'
]
