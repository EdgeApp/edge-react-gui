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
export interface PublishFlags {
  dryRun: boolean
  stageOnly: string | undefined
  allowUnsigned: boolean
  withSigner: boolean
  signerSecretIsCliOnly: boolean
  allowDirty: boolean
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
 * Why a publish must stop, or undefined when it may go ahead.
 *
 * Three refusals rather than reports afterwards, because each of them is
 * irreversible once npm has the tarball.
 */
export function publishRefusal(opts: {
  flags: PublishFlags
  treeIsDirty: boolean
  hasKey: boolean
  packedFiles: readonly string[]
  signerFile: string
}): string | undefined {
  const { flags, treeIsDirty, hasKey, packedFiles, signerFile } = opts

  if (treeIsDirty && !flags.allowDirty) {
    return (
      'The working tree has uncommitted changes. Commit them, or pass ' +
      '--allow-dirty if this is deliberate.'
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

  // The last check before the stage is final, and the way `--with-signer`
  // failed was silent: the addon in the directory, absent from the tarball,
  // and the report saying "included". `files` is npm's allowlist, so this is
  // the one assertion that distinguishes the two.
  if (flags.withSigner && !packedFiles.includes(signerFile)) {
    return (
      `--with-signer was given but ${signerFile} is not in the manifest's ` +
      '`files`, so npm would pack a tarball without it and the package ' +
      'would be published as signed. Nothing has been published.'
    )
  }

  return undefined
}
