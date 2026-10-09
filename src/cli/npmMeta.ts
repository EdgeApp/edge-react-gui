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
}

// The per-platform native packages are not here. The scaffolding for them —
// a `NativePackage` shape, a `nativePackages: []` that nothing ever filled,
// and the `optionalDependencies` branch in the generator — was a code path
// that could not run, with `os` and `cpu` fields nothing read. Git history
// has the shape for the day those packages exist.
//
// The HMAC addon is not published either, and that is a decision rather than
// a gap. Two things were wrong with shipping it:
//
//   * Its shards reconstruct the *same* `apiSecret` the iOS and Android
//     release builds sign with — only the runtime pad differs, and that pad
//     is `NODE_API_SIGNER_BUNDLE_ID`, a constant in this public repository.
//     `npm pack` plus `strings` plus a value from GitHub is a materially
//     cheaper retrieval than pulling it out of a store binary, which is the
//     only channel the obfuscation was built against.
//   * One prebuilt addon in a package with no `os`/`cpu` is a package that
//     works on the build machine's platform and nowhere else.
//
// So a published CLI is unsigned, which means it needs an `edgeApiKey` of its
// own: `keys.json` beside the command or in `~/.edge-cli/`, or `-k`. The
// engine says exactly that when it has neither (`makeCoreContext.ts`), and
// `--fake` needs nothing at all. `publishCli.ts --with-signer` can still ship
// the addon, and refuses to unless the caller also says out loud that the
// secret it carries is the CLI's own and not the mobile one.

export const CLI_PACKAGE_META: CliPackageMeta = {
  name: '@edgeapp/cli',
  description:
    'Command-line access to an Edge account: wallets, balances, transactions and swaps.',
  binName: 'edge-cli',
  keywords: ['edge', 'cryptocurrency', 'wallet', 'cli', 'bitcoin', 'ethereum'],
  // The SPDX id for the `LICENSE` this package actually ships, which is a
  // verbatim BSD 3-Clause text — deliberately not the app's
  // `SEE LICENSE IN LICENSE`. That string costs the app nothing, because
  // `private: true` means nobody reads it; on the registry it is the field
  // every licence scanner, SBOM generator and corporate dependency policy
  // reads, and it is the SPDX spelling for "a custom licence a machine
  // cannot evaluate". A wallet CLI presenting as unidentified-custom fails
  // exactly the automated review it has to pass to be adopted.
  license: 'BSD-3-Clause',
  author: 'Edge, Inc.',
  homepage: 'https://edge.app',
  // The https form, not the app's `git@` one: npm rewrites an scp-style URL
  // on publish and warns about it, and a public package should be clonable by
  // anyone reading its registry page.
  repositoryUrl: 'git+https://github.com/EdgeApp/edge-react-gui.git',
  repositoryDirectory: 'src/cli',
  engines: { node: '>=18' }
}

/** Files the published package contains, relative to its root. */
export const CLI_PACKAGE_FILES = [
  'edgeCli.js',
  'edgeEngine.js',
  'README.md',
  'LICENSE'
]

/**
 * The addon's filename, and the one file `--with-signer` adds to the list.
 *
 * Separate from `CLI_PACKAGE_FILES` because the default publish must not
 * carry it: see the note above.
 */
export const CLI_SIGNER_FILE = 'edge_api_signer.node'
