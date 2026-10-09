/**
 * The decisions `publishCli.ts` makes before it builds or publishes anything.
 *
 * Lifted out of that script because it does its work at module scope and so
 * cannot be imported: `publishFlags.test.ts` asserted regexes against the
 * script's own *text* — `expect(source).toMatch(/value\.startsWith\('--'\)/)`
 * — which passes for a reformat that breaks the logic and fails for a
 * prettier line break that does not. The defect those regexes stand in for
 * is `--out` with the value left off falling through to
 * `npm publish --access public`, which the script documents as
 * irreversible: npm will not replace a version, so a mis-fired publish burns
 * the app's current version number. That is worth a test that runs the code.
 *
 * Pure: no filesystem, no `process.argv`, no spawning. The script stays the
 * shell that reads argv, touches the disk and runs npm.
 */

/** What the flags asked for. */
interface PublishFlags {
  dryRun: boolean
  stageOnly: string | undefined
  allowUnsigned: boolean
  withSigner: boolean
  signerSecretIsCliOnly: boolean
  allowDirty: boolean
  allowBrokenPlugins: boolean
  skipBuild: boolean
  tag: string | undefined
}

/**
 * A flag's value, or a stop.
 *
 * It used to be `argv[i + 1]`, so `npm run publish:cli -- --out` with the
 * path left off answered `undefined`, the `if (stageOnly != null)` gate was
 * false, and the script fell through to `npm publish --access public` — the
 * flag a reader reaches for to *avoid* publishing was the one whose typo
 * published. `--out --dry-run` was worse in the other direction: it staged
 * into a directory literally named `--dry-run` and did stop, so two
 * spellings of one mistake behaved oppositely.
 */
export function flagValue(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag)
  if (i === -1) return undefined
  const value = argv[i + 1]
  if (value == null || value.startsWith('--')) {
    throw new Error(
      `${flag} needs a value. Nothing has been built or published.`
    )
  }
  return value
}

/** Every flag the publish script takes, read in one pass. */
export function parsePublishFlags(argv: string[]): PublishFlags {
  const has = (flag: string): boolean => argv.includes(flag)
  return {
    dryRun: has('--dry-run'),
    stageOnly: flagValue(argv, '--out'),
    allowUnsigned: has('--allow-unsigned'),
    withSigner: has('--with-signer'),
    signerSecretIsCliOnly: has('--signer-secret-is-cli-only'),
    allowDirty: has('--allow-dirty'),
    allowBrokenPlugins: has('--allow-broken-plugins'),
    skipBuild: has('--no-build'),
    tag: flagValue(argv, '--tag')
  }
}

/**
 * The `files` allowlist the published manifest should carry.
 *
 * npm's `files` is an allowlist, so `--with-signer` has to add the addon to
 * it and not merely copy the file into the stage. It did only the latter: a
 * package.json with the unsigned four and an `edge_api_signer.node` beside
 * the bundles packs the four and drops the addon, so the flag published a
 * tarball that could not sign while the report said it had shipped.
 */
export function packedFilesFor(opts: {
  withSigner: boolean
  packageFiles: readonly string[]
  signerFile: string
}): string[] {
  const { withSigner, packageFiles, signerFile } = opts
  return withSigner ? [...packageFiles, signerFile] : [...packageFiles]
}

/**
 * Whether the tarball that will be published can sign.
 *
 * Read off the manifest that will be published *and* the staged directory,
 * because either alone lies in one direction: the manifest alone says
 * "signed" for an addon npm will pack but that was never built, and the
 * directory alone says "signed" for an addon a reused `--out` left behind,
 * which suppressed the README's unsigned warning with no `--with-signer`
 * given at all.
 */
export function isSignedPublish(opts: {
  packedFiles: readonly string[]
  signerFile: string
  signerStaged: boolean
}): boolean {
  const { packedFiles, signerFile, signerStaged } = opts
  return packedFiles.includes(signerFile) && signerStaged
}

/**
 * What `git status` established about the working tree.
 *
 * Three states, because "could not ask git" is not "clean". The dirty-tree
 * check used to read a `capture()` that answers `''` whenever the child
 * exits non-zero or fails to spawn, so every git failure passed the guard
 * silently — and this is the guard on the one action the script says cannot
 * be undone, since npm will not replace a version. A CI container where git
 * reports "detected dubious ownership in repository" (exit 128), an
 * extracted source tarball with no `.git`, and git missing from `PATH` all
 * published an unreproducible tree under the app's current version.
 */
export type TreeState =
  | { kind: 'clean' }
  | { kind: 'dirty' }
  | { kind: 'unknown'; reason: string }

/**
 * What one `git status --porcelain` run says about the tree.
 *
 * Here rather than in the script, so the mapping that was the bug — every
 * failure read as clean — is something a test can run: a spawn that never
 * started, a non-zero exit, and the two answers that count.
 */
export function treeStateOf(result: {
  error?: Error
  status: number | null
  stdout?: string | null
  stderr?: string | null
}): TreeState {
  if (result.error != null) {
    return {
      kind: 'unknown',
      reason: `git could not be run (${result.error.message})`
    }
  }
  if (result.status !== 0) {
    const stderr = (result.stderr ?? '').trim()
    return {
      kind: 'unknown',
      reason: `git status exited ${String(result.status)}${
        stderr === '' ? '' : `: ${stderr}`
      }`
    }
  }
  return (result.stdout ?? '').trim() === ''
    ? { kind: 'clean' }
    : { kind: 'dirty' }
}

/**
 * Why a publish must stop before anything is built.
 *
 * Two functions rather than one, because the refusals fall into two phases
 * and one function meant each caller had to *fabricate* the inputs for the
 * checks that did not apply to it yet: the pre-build call passed
 * `packedFiles: withSigner ? [CLI_SIGNER_FILE] : []` purely so the allowlist
 * check could not fire before a manifest existed, and the staged call passed
 * `treeIsDirty: false` purely so the dirty-tree check could not fire twice.
 * Which refusals a call could reach was therefore decided by arguments that
 * were not facts, and anyone adding a fifth had to work out per call site
 * which inputs were real.
 *
 * Refusals rather than reports afterwards, because each of them is
 * irreversible once npm has the tarball.
 */
export function preBuildRefusal(opts: {
  flags: PublishFlags
  treeState: TreeState
  hasKey: boolean
  /** `knownPluginBreakage.js`'s two lists, joined. */
  knownBrokenPlugins: readonly string[]
}): string | undefined {
  const { flags, treeState, hasKey, knownBrokenPlugins } = opts

  // A version is published once, and the CLI moves in lockstep with the
  // app, so publishing while every EVM chain cannot create or load a wallet
  // burns the version number until the next app bump. The breakage is in a
  // dependency this repository cannot patch, but it can decline to ship it.
  if (knownBrokenPlugins.length > 0 && !flags.allowBrokenPlugins) {
    return (
      `${knownBrokenPlugins.length} plugin breakages are known in the ` +
      'bundled plugin packages (scripts/util/knownPluginBreakage.js), so ' +
      'the published CLI could not carry those chains: ' +
      `${knownBrokenPlugins.join('; ')}. Release and bump the fixed ` +
      'dependency first, or pass --allow-broken-plugins if publishing ' +
      'without them is deliberate.'
    )
  }

  if (treeState.kind === 'dirty' && !flags.allowDirty) {
    return (
      'The working tree has uncommitted changes. Commit them, or pass ' +
      '--allow-dirty if this is deliberate.'
    )
  }

  // Its own refusal, naming what git said. `--allow-dirty` is the override
  // because it is already the flag that means "I accept a tarball no commit
  // can reproduce"; the difference is that this one cannot even be checked.
  if (treeState.kind === 'unknown' && !flags.allowDirty) {
    return (
      `Could not determine whether the working tree is clean: ${treeState.reason}. ` +
      'The registry copy has to be re-derivable from a commit, so this ' +
      'stops rather than assuming. Fix git, or pass --allow-dirty if this ' +
      'is deliberate.'
    )
  }

  // Said out loud, because the addon's shards reconstruct the same
  // `apiSecret` the iOS and Android release builds sign with and the runtime
  // pad is a constant in this public repository: a public tarball would hand
  // that secret to anyone with `npm pack` and `strings`.
  if (flags.withSigner && !flags.signerSecretIsCliOnly) {
    return (
      'Refusing to publish the HMAC addon. Its shards reconstruct the same ' +
      'apiSecret the iOS and Android release builds sign with, and the ' +
      'runtime pad (NODE_API_SIGNER_BUNDLE_ID) is a constant in this public ' +
      'repository — so a public tarball exposes that secret to `npm pack` ' +
      'plus `strings`. Issue the CLI its own apiKey/apiSecret pair, build ' +
      'with that edgeKey.json, and pass --signer-secret-is-cli-only to say ' +
      'so; or publish without the addon, which is the default.'
    )
  }

  if (!flags.skipBuild && !hasKey && !flags.allowUnsigned) {
    return (
      'edgeKey.json is absent, so the Node HMAC addon cannot be built and ' +
      'the published CLI could not sign info-server requests. Put the key ' +
      'in place, or pass --allow-unsigned to publish without it.'
    )
  }

  return undefined
}

/**
 * Why a publish must stop once the manifest that will be published is known.
 *
 * The last check before the stage is final, and the way `--with-signer`
 * failed was silent: the addon in the directory, absent from the tarball,
 * and the report saying "included". `files` is npm's allowlist, so this is
 * the one assertion that distinguishes the two.
 */
export function stagedManifestRefusal(opts: {
  flags: PublishFlags
  packedFiles: readonly string[]
  signerFile: string
}): string | undefined {
  const { flags, packedFiles, signerFile } = opts

  if (flags.withSigner && !packedFiles.includes(signerFile)) {
    return (
      `--with-signer was given but ${signerFile} is not in the manifest's ` +
      '`files`, so npm would pack a tarball without it and the package ' +
      'would be published as signed. Nothing has been published.'
    )
  }

  return undefined
}
