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
import { createHmac } from 'crypto'

/** What the flags asked for. */
interface PublishFlags {
  dryRun: boolean
  stageOnly: string | undefined
  allowUnsigned: boolean
  withSigner: boolean
  allowDirty: boolean
  allowBrokenPlugins: boolean
  allowUnpushed: boolean
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
    allowDirty: has('--allow-dirty'),
    allowBrokenPlugins: has('--allow-broken-plugins'),
    allowUnpushed: has('--allow-unpushed'),
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
 * The commit being published, and whether GitHub can show it.
 *
 * The README's links into this repository are pinned to this commit, so a
 * commit that is not on any remote bakes 404s into a registry page npm
 * will not let anyone replace.
 */
export type HeadState =
  | { kind: 'pushed'; sha: string }
  | { kind: 'unpushed'; sha: string }
  /** HEAD was read, but the remote refs could not be refreshed. */
  | { kind: 'unverified'; sha: string; reason: string }
  | { kind: 'unknown'; reason: string }

/**
 * The remote branches a published commit may be pinned to.
 *
 * Long-lived ones only. A feature branch is rebased and force-pushed as a
 * matter of course, so a commit only it contains is gone from every branch
 * after the next force-push, and the registry page's links with it — and
 * npm will not let that page be replaced without a new version.
 */
const LONG_LIVED_BRANCHES = /^origin\/(develop|master|staging)$/

/**
 * What `git fetch`, `git rev-parse HEAD`, `git branch -r --contains HEAD`,
 * `git tag --contains HEAD` and `git ls-remote --tags origin` say.
 *
 * Pure, like `treeStateOf`, so the answers that matter — no HEAD at all, a
 * HEAD only a feature branch contains, refs that could not be refreshed —
 * can be run by a test. Pushed means a long-lived branch, or a tag the
 * remote has, contains HEAD, after a fetch: without the fetch a
 * remote-tracking ref still contains a commit GitHub dropped when the
 * branch was force-pushed or deleted, and a tag only this clone has names a
 * commit GitHub may never have seen. A fetch or remote listing that fails is
 * `unverified`.
 */
export function headStateOf(
  revParse: {
    error?: Error
    status: number | null
    stdout?: string | null
  },
  remoteBranches: { status: number | null; stdout?: string | null },
  tags: { status: number | null; stdout?: string | null } = {
    status: 0,
    stdout: ''
  },
  fetch: { error?: Error; status: number | null } = { status: 0 },
  remoteTags: { status: number | null; stdout?: string | null } = {
    status: 0,
    stdout: ''
  }
): HeadState {
  const sha = (revParse.stdout ?? '').trim()
  if (
    revParse.error != null ||
    revParse.status !== 0 ||
    !/^[0-9a-f]{40}$/.test(sha)
  ) {
    return {
      kind: 'unknown',
      reason:
        revParse.error != null
          ? `git could not be run (${revParse.error.message})`
          : `git rev-parse HEAD exited ${String(revParse.status)}`
    }
  }
  if (fetch.error != null || fetch.status !== 0) {
    return {
      kind: 'unverified',
      sha,
      reason:
        fetch.error != null
          ? `git fetch could not be run (${fetch.error.message})`
          : `git fetch exited ${String(fetch.status)}`
    }
  }
  // The remote's tag list is part of the answer: read as "no tags" on a
  // failure, it would refuse a tagged release as unpushed for the wrong
  // reason.
  if (remoteTags.status !== 0) {
    return {
      kind: 'unverified',
      sha,
      reason: `git ls-remote --tags exited ${String(remoteTags.status)}`
    }
  }
  const lines = (result: {
    status: number | null
    stdout?: string | null
  }): string[] =>
    result.status === 0
      ? (result.stdout ?? '')
          .split('\n')
          .map(line => line.replace(/^\*?\s*/, '').trim())
          .filter(line => line !== '' && !line.includes(' -> '))
      : []
  const onLongLived = lines(remoteBranches).some(ref =>
    LONG_LIVED_BRANCHES.test(ref)
  )
  // Only tags the remote has: `git tag --contains` lists local ones too,
  // and a release tagged here and not yet pushed is a commit GitHub lacks.
  const onRemote = new Set(
    lines(remoteTags)
      .map(line => /\trefs\/tags\/(.+?)(\^\{\})?$/.exec(line)?.[1])
      .filter((name): name is string => name != null)
  )
  const tagged = lines(tags).some(tag => onRemote.has(tag))
  return onLongLived || tagged
    ? { kind: 'pushed', sha }
    : { kind: 'unpushed', sha }
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
  headState: HeadState
  /** `edgeCliKey.json`, the CLI's own key pair, is present. */
  hasCliKey: boolean
  /** That pair shares its apiKey or apiSecret with the app's `edgeKey.json`. */
  cliKeyIsAppKey: boolean
  /** `knownPluginBreakage.js`'s two lists, joined. */
  knownBrokenPlugins: readonly string[]
}): string | undefined {
  const {
    flags,
    treeState,
    headState,
    hasCliKey,
    cliKeyIsAppKey,
    knownBrokenPlugins
  } = opts

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

  // Its own refusal, naming what git said, and with no override: the
  // README's links are pinned to HEAD, so a publish git cannot describe
  // cannot be given working links either. `--allow-dirty` used to be offered
  // here, and every case that reaches this — no git, no `.git`, "dubious
  // ownership" — fails to read HEAD too, so the override only moved the
  // failure past a full build.
  if (treeState.kind === 'unknown') {
    return (
      `Could not determine whether the working tree is clean: ${treeState.reason}. ` +
      'The registry copy has to be re-derivable from a commit, and the ' +
      'README links are pinned to it, so this stops rather than assuming. ' +
      'Fix git and run it again.'
    )
  }

  if (headState.kind === 'unknown') {
    return (
      `Could not read HEAD: ${headState.reason}. The README links are ` +
      'pinned to the commit being published. Fix git and run it again.'
    )
  }
  if (headState.kind === 'unverified' && !flags.allowUnpushed) {
    return (
      `Could not refresh or list the remote refs (${headState.reason}), so whether ` +
      `GitHub has HEAD (${headState.sha.slice(0, 9)}) is unknown, and the ` +
      "README's links point at it. Fix the fetch, or pass " +
      '--allow-unpushed if the links may break.'
    )
  }

  // Pushed before published: GitHub serves `blob/<sha>/…` only for a commit
  // it has, and a release commit made locally and pushed afterwards is the
  // ordinary order — which would publish a page of dead links.
  if (headState.kind === 'unpushed' && !flags.allowUnpushed) {
    return (
      `HEAD (${headState.sha.slice(0, 9)}) is on no long-lived remote ` +
      'branch (develop, master, staging) and no tag, and the README’s links ' +
      'point at it on GitHub. A feature branch does not count: its next ' +
      'force-push drops the commit. Publish from a merged commit, or pass ' +
      '--allow-unpushed if the links may break.'
    )
  }

  // The addon's shards reconstruct the secret it was built from, and the
  // runtime pad is a constant in this public repository, so a public tarball
  // hands that secret to anyone with `npm pack` and `strings`. It is built
  // from `edgeCliKey.json` alone, and never from the app's `edgeKey.json`.
  if (flags.withSigner && !hasCliKey) {
    return (
      'Refusing to publish the HMAC addon without edgeCliKey.json. The addon ' +
      'is built from that file alone, a key pair issued for the CLI: its ' +
      'shards reconstruct the secret it carries, and the runtime pad ' +
      '(NODE_API_SIGNER_BUNDLE_ID) is a constant in this public repository, ' +
      'so a public tarball exposes that secret to `npm pack` plus `strings`. ' +
      "Put the CLI's key pair in edgeCliKey.json, or publish without the " +
      'addon, which is the default.'
    )
  }

  if (flags.withSigner && cliKeyIsAppKey) {
    return (
      'Refusing to publish the HMAC addon: edgeCliKey.json holds the apiKey ' +
      'or apiSecret in edgeKey.json, the key the iOS and Android release ' +
      'builds sign with. The CLI needs a key pair of its own.'
    )
  }

  if (!flags.skipBuild && !hasCliKey && !flags.allowUnsigned) {
    return (
      'edgeCliKey.json is absent, so the Node HMAC addon cannot be built and ' +
      "the published CLI could not sign info-server requests. Put the CLI's " +
      'key pair in edgeCliKey.json, or pass --allow-unsigned to publish ' +
      'without it.'
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

/** An `apiKey` / `apiSecret` pair, as the key files hold it. */
export interface ApiKeyPair {
  apiKey: string
  apiSecret: string
}

/**
 * Whether two key pairs share an apiKey or an apiSecret.
 *
 * Either one is enough: the same apiKey presents as the app, and the same
 * apiSecret is the app's secret whatever id it travels under.
 */
export function sharesKey(a: ApiKeyPair, b: ApiKeyPair): boolean {
  const secret = (hex: string): string => hex.replace(/^0x/i, '').toLowerCase()
  return (
    (a.apiKey !== '' && a.apiKey === b.apiKey) ||
    (a.apiSecret !== '' && secret(a.apiSecret) === secret(b.apiSecret))
  )
}

/** What a signed publish asks the staged addon to sign. */
export const SIGNER_PROBE = 'GET\n/v1/infoRollup/edge-cli-publish-probe\n'

/**
 * Why a signed publish must stop once the addon is staged: it has to sign
 * with `edgeCliKey.json`'s key.
 *
 * The build makes the addon from that file alone, but `--no-build` stages
 * whatever `lib/` holds, which can be an addon built from some other secret.
 * Signing a probe with the staged binary and comparing the answer to an HMAC
 * of the CLI key reads what the addon carries rather than how it was made.
 */
export function stagedSignerRefusal(opts: {
  cliKey: ApiKeyPair
  /** The staged addon's answer to `SIGNER_PROBE`, or why it gave none. */
  staged: { apiKey: string; signature: string } | { error: string }
  signerFile: string
}): string | undefined {
  const { cliKey, staged, signerFile } = opts
  if ('error' in staged) {
    return (
      `The staged ${signerFile} could not sign: ${staged.error}. Nothing ` +
      'has been published.'
    )
  }
  const secret = Buffer.from(cliKey.apiSecret.replace(/^0x/i, ''), 'hex')
  const expected = createHmac('sha256', secret)
    .update(SIGNER_PROBE, 'utf8')
    .digest('base64')
  if (staged.apiKey !== cliKey.apiKey || staged.signature !== expected) {
    return (
      `The staged ${signerFile} does not sign with edgeCliKey.json's key, ` +
      'so it carries some other secret. Rebuild it with ' +
      '`npm run build:cli:all`, without --no-build, and publish again. ' +
      'Nothing has been published.'
    )
  }
  return undefined
}
