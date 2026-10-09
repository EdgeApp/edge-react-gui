import { describe, expect, it } from '@jest/globals'

import {
  flagValue,
  headStateOf,
  isSignedPublish,
  packedFilesFor,
  parsePublishFlags,
  preBuildRefusal,
  stagedManifestRefusal,
  type TreeState,
  treeStateOf
} from '../../../scripts/util/publishArgs'

/**
 * The publish script's decisions, run rather than grepped.
 *
 * `publishFlags.test.ts` asserted regexes against the *text* of
 * `publishCli.ts` — `expect(source).toMatch(/value\.startsWith\('--'\)/)` —
 * because the script does its work at module scope and cannot be imported.
 * Those assertions pass for a reformat that breaks the logic and fail for a
 * prettier line break that does not, and the defect they stand in for is
 * `--out` with the value left off falling through to
 * `npm publish --access public`, which the script documents as
 * irreversible: npm will not replace a version, so a mis-fired publish burns
 * the app's current version number and the next CLI fix waits for an app
 * bump. The decisions now live in `scripts/util/publishArgs.ts`, which the
 * script imports, so this runs the same code the script runs.
 */
const PACKAGE_FILES = ['edgeCli.js', 'edgeEngine.js', 'README.md', 'LICENSE']
const SIGNER = 'edge_api_signer.node'

const noFlags = parsePublishFlags([])

describe('flagValue', () => {
  it('refuses a flag whose value is missing', () => {
    // The whole case. `--out` with the path left off answered `undefined`,
    // the `stageOnly != null` gate was false, and the script published.
    expect(() => flagValue(['--out'], '--out')).toThrow(
      /--out needs a value\. Nothing has been built or published\./
    )
  })

  it('refuses a flag whose value is another flag', () => {
    // The other spelling of the same mistake, which behaved oppositely: it
    // staged into a directory literally named `--dry-run`, and did stop.
    expect(() => flagValue(['--out', '--dry-run'], '--out')).toThrow(
      /--out needs a value/
    )
  })

  it('answers undefined for a flag that is absent', () => {
    expect(flagValue(['--dry-run'], '--out')).toBeUndefined()
  })

  it('answers the value when one is given', () => {
    expect(flagValue(['--out', '/tmp/stage'], '--out')).toBe('/tmp/stage')
    expect(flagValue(['--tag', 'next', '--dry-run'], '--tag')).toBe('next')
  })

  it('does not mistake a negative-looking value for a flag', () => {
    // `-1` is not `--1`: only a double dash is a flag here.
    expect(flagValue(['--out', '-1'], '--out')).toBe('-1')
  })
})

describe('parsePublishFlags', () => {
  it('reads every flag the script takes', () => {
    const flags = parsePublishFlags([
      '--dry-run',
      '--out',
      '/tmp/stage',
      '--allow-unsigned',
      '--with-signer',
      '--signer-secret-is-cli-only',
      '--allow-dirty',
      '--allow-broken-plugins',
      '--no-build',
      '--tag',
      'next'
    ])
    expect(flags).toStrictEqual({
      dryRun: true,
      stageOnly: '/tmp/stage',
      allowUnsigned: true,
      withSigner: true,
      signerSecretIsCliOnly: true,
      allowDirty: true,
      allowBrokenPlugins: true,
      allowUnpushed: false,
      skipBuild: true,
      tag: 'next'
    })
  })

  it('defaults everything off', () => {
    expect(noFlags).toStrictEqual({
      dryRun: false,
      stageOnly: undefined,
      allowUnsigned: false,
      withSigner: false,
      signerSecretIsCliOnly: false,
      allowDirty: false,
      allowBrokenPlugins: false,
      allowUnpushed: false,
      skipBuild: false,
      tag: undefined
    })
  })

  it('stops on a valueless --out before reading anything else', () => {
    expect(() => parsePublishFlags(['--out'])).toThrow(/--out needs a value/)
  })
})

describe('packedFilesFor', () => {
  it('adds the addon to the allowlist, not merely to the stage', () => {
    // npm's `files` is an allowlist, and the script used only to copy the
    // addon into the staging directory: a package.json with the unsigned
    // four and an `edge_api_signer.node` beside the bundles packs the four
    // and drops the addon, so the flag published a tarball that could not
    // sign while the report said it had shipped.
    expect(
      packedFilesFor({
        withSigner: true,
        packageFiles: PACKAGE_FILES,
        signerFile: SIGNER
      })
    ).toStrictEqual([...PACKAGE_FILES, SIGNER])
  })

  it('leaves the allowlist alone by default', () => {
    expect(
      packedFilesFor({
        withSigner: false,
        packageFiles: PACKAGE_FILES,
        signerFile: SIGNER
      })
    ).toStrictEqual(PACKAGE_FILES)
  })
})

describe('isSignedPublish', () => {
  it('needs the addon in the allowlist and on disk', () => {
    expect(
      isSignedPublish({
        packedFiles: [...PACKAGE_FILES, SIGNER],
        signerFile: SIGNER,
        signerStaged: true
      })
    ).toBe(true)
  })

  it('is false for an addon npm would pack that was never built', () => {
    expect(
      isSignedPublish({
        packedFiles: [...PACKAGE_FILES, SIGNER],
        signerFile: SIGNER,
        signerStaged: false
      })
    ).toBe(false)
  })

  it('is false for an addon a reused --out left behind', () => {
    // Read off the manifest and not off the directory, because a stale
    // addon in a reused stage made this true with no `--with-signer` at
    // all, which suppressed the README's unsigned warning — the one
    // paragraph that explains why the installed CLI refuses to start
    // without an `edgeApiKey`.
    expect(
      isSignedPublish({
        packedFiles: PACKAGE_FILES,
        signerFile: SIGNER,
        signerStaged: true
      })
    ).toBe(false)
  })
})

describe('preBuildRefusal', () => {
  const treeClean: TreeState = { kind: 'clean' }
  // Only what this phase judges. The two call sites used to share one
  // function and each had to fabricate the other phase's inputs — the
  // pre-build call invented a `packedFiles` so the allowlist check could not
  // fire, the staged call invented a clean tree so the dirty check could not
  // fire twice — so which refusals a call could reach was decided by
  // arguments that were not facts.
  const pushed = { kind: 'pushed' as const, sha: 'a'.repeat(40) }
  const base = {
    treeState: treeClean,
    headState: pushed,
    hasKey: true,
    knownBrokenPlugins: []
  }

  it('refuses while a bundled plugin family is known to be broken', () => {
    // A version is published once and the CLI moves in lockstep with the
    // app, so shipping without every EVM chain burns the version number.
    const refusal = preBuildRefusal({
      ...base,
      flags: noFlags,
      knownBrokenPlugins: ['ethereum/EthereumTools.js']
    })
    expect(refusal).toContain('ethereum/EthereumTools.js')
    expect(refusal).toContain('--allow-broken-plugins')
    expect(
      preBuildRefusal({
        ...base,
        flags: parsePublishFlags(['--allow-broken-plugins']),
        knownBrokenPlugins: ['ethereum/EthereumTools.js']
      })
    ).toBeUndefined()
  })

  it('refuses a dirty tree, because the registry copy cannot be re-derived', () => {
    const refusal = preBuildRefusal({
      ...base,
      flags: noFlags,
      treeState: { kind: 'dirty' }
    })
    expect(refusal).toContain('uncommitted changes')
  })

  it('allows a dirty tree when the caller said so', () => {
    const flags = parsePublishFlags(['--allow-dirty'])
    expect(
      preBuildRefusal({ ...base, flags, treeState: { kind: 'dirty' } })
    ).toBeUndefined()
  })

  it('refuses when git could not be run at all', () => {
    // The guard used to fail *open* here: `capture` answered `''` for a
    // child that exited non-zero or never spawned, and `=== ''` is the
    // clean-tree reading. So a CI container reporting "detected dubious
    // ownership in repository" (exit 128), an extracted source tarball with
    // no `.git`, or git missing from `PATH` all published an unreproducible
    // tree under the app's current version — which npm will not let anyone
    // replace.
    const refusal = preBuildRefusal({
      ...base,
      flags: noFlags,
      treeState: {
        kind: 'unknown',
        reason: 'git status exited 128: detected dubious ownership'
      }
    })
    expect(refusal).toContain('Could not determine whether the working tree')
    // The git error itself, so the operator can fix it rather than guess.
    expect(refusal).toContain('detected dubious ownership')
  })

  it('refuses an unknown tree even with --allow-dirty', () => {
    // The README links are pinned to HEAD, and every case that leaves the
    // tree unknown leaves HEAD unreadable too, so the override used to move
    // the failure past a full build.
    const refusal = preBuildRefusal({
      ...base,
      flags: parsePublishFlags(['--allow-dirty']),
      treeState: { kind: 'unknown', reason: 'git could not be run (ENOENT)' }
    })
    expect(refusal).toContain('Fix git')
    expect(refusal).not.toContain('--allow-dirty')
  })

  it('refuses before building when HEAD cannot be read', () => {
    const refusal = preBuildRefusal({
      ...base,
      flags: noFlags,
      headState: { kind: 'unknown', reason: 'git rev-parse HEAD exited 128' }
    })
    expect(refusal).toContain('Could not read HEAD')
  })

  it('refuses a HEAD no remote has, unless told the links may break', () => {
    const unpushed = { kind: 'unpushed' as const, sha: 'b'.repeat(40) }
    expect(
      preBuildRefusal({ ...base, flags: noFlags, headState: unpushed })
    ).toContain('--allow-unpushed')
    expect(
      preBuildRefusal({
        ...base,
        flags: parsePublishFlags(['--allow-unpushed']),
        headState: unpushed
      })
    ).toBeUndefined()
  })

  it('refuses the addon without the flag that says the secret is the CLI’s own', () => {
    // The addon's shards reconstruct the same `apiSecret` the mobile
    // release builds sign with, and the runtime pad is a constant in this
    // public repository.
    const flags = parsePublishFlags(['--with-signer'])
    const refusal = preBuildRefusal({ ...base, flags })
    expect(refusal).toContain('Refusing to publish the HMAC addon')
    expect(refusal).toContain('--signer-secret-is-cli-only')
  })

  it('allows the addon once that flag is given', () => {
    const flags = parsePublishFlags([
      '--with-signer',
      '--signer-secret-is-cli-only'
    ])
    expect(preBuildRefusal({ ...base, flags })).toBeUndefined()
  })

  it('refuses an unsigned build unless it is asked for out loud', () => {
    expect(
      preBuildRefusal({ ...base, flags: noFlags, hasKey: false })
    ).toContain('--allow-unsigned')
    expect(
      preBuildRefusal({
        ...base,
        flags: parsePublishFlags(['--allow-unsigned']),
        hasKey: false
      })
    ).toBeUndefined()
    // `--no-build` publishes whatever is already in `lib/`, so the key is
    // not this run's business.
    expect(
      preBuildRefusal({
        ...base,
        flags: parsePublishFlags(['--no-build']),
        hasKey: false
      })
    ).toBeUndefined()
  })

  it('allows an ordinary publish', () => {
    expect(preBuildRefusal({ ...base, flags: noFlags })).toBeUndefined()
  })
})

/**
 * The second phase: what the manifest that will be published actually says.
 *
 * Its own function, taking only the manifest's `files` and the flags, so
 * neither call site has to invent an input for a check that belongs to the
 * other one.
 */
describe('stagedManifestRefusal', () => {
  const signed = parsePublishFlags([
    '--with-signer',
    '--signer-secret-is-cli-only'
  ])

  it('refuses --with-signer when the allowlist would drop the addon', () => {
    // The last check before the stage is final, and the way this failed was
    // silent: the addon in the directory, absent from the tarball, and the
    // report saying "included". `files` is npm's allowlist, so this is the
    // one assertion that distinguishes the two.
    const refusal = stagedManifestRefusal({
      flags: signed,
      packedFiles: PACKAGE_FILES,
      signerFile: SIGNER
    })
    expect(refusal).toContain('not in the manifest')
    expect(refusal).toContain('Nothing has been published')
  })

  it('allows it once the manifest names the addon', () => {
    expect(
      stagedManifestRefusal({
        flags: signed,
        packedFiles: [...PACKAGE_FILES, SIGNER],
        signerFile: SIGNER
      })
    ).toBeUndefined()
  })

  it('has nothing to say about an unsigned publish', () => {
    expect(
      stagedManifestRefusal({
        flags: noFlags,
        packedFiles: PACKAGE_FILES,
        signerFile: SIGNER
      })
    ).toBeUndefined()
  })
})

/**
 * The mapping that was the bug: every git failure read as a clean tree.
 *
 * `publishFlags.test.ts` only checked that the text `readTreeState()`
 * appears in the script, so `stdout.trim() === ''` without a `status` check
 * would have stayed green while an unreproducible tree published.
 */
describe('treeStateOf', () => {
  it('reads a spawn that never started as unknown', () => {
    expect(
      treeStateOf({ error: new Error('spawn git ENOENT'), status: null })
    ).toStrictEqual({
      kind: 'unknown',
      reason: 'git could not be run (spawn git ENOENT)'
    })
  })

  it('reads a non-zero exit as unknown, with what git said', () => {
    expect(
      treeStateOf({
        status: 128,
        stdout: '',
        stderr: 'fatal: detected dubious ownership\n'
      })
    ).toStrictEqual({
      kind: 'unknown',
      reason: 'git status exited 128: fatal: detected dubious ownership'
    })
  })

  it('reads exit 0 with no output as clean, and with output as dirty', () => {
    expect(treeStateOf({ status: 0, stdout: '' })).toStrictEqual({
      kind: 'clean'
    })
    expect(
      treeStateOf({ status: 0, stdout: ' M package.json\n' })
    ).toStrictEqual({ kind: 'dirty' })
  })
})

describe('headStateOf', () => {
  const sha = 'c'.repeat(40)
  it('reads a HEAD a remote branch contains as pushed', () => {
    expect(
      headStateOf(
        { status: 0, stdout: `${sha}\n` },
        { status: 0, stdout: '  origin/paul/cli\n' }
      )
    ).toStrictEqual({ kind: 'pushed', sha })
  })

  it('reads a HEAD no remote branch contains as unpushed', () => {
    expect(
      headStateOf({ status: 0, stdout: sha }, { status: 0, stdout: '' })
    ).toStrictEqual({ kind: 'unpushed', sha })
  })

  it('reads a failed rev-parse as unknown', () => {
    expect(
      headStateOf({ status: 128, stdout: '' }, { status: 128, stdout: '' })
    ).toStrictEqual({
      kind: 'unknown',
      reason: 'git rev-parse HEAD exited 128'
    })
    expect(
      headStateOf(
        { error: new Error('spawn git ENOENT'), status: null },
        { status: null }
      ).kind
    ).toBe('unknown')
  })
})
