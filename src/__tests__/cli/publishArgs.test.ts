import { describe, expect, it } from '@jest/globals'

import {
  flagValue,
  isSignedPublish,
  packedFilesFor,
  parsePublishFlags,
  publishRefusal
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

describe('publishRefusal', () => {
  const base = {
    treeIsDirty: false,
    hasKey: true,
    packedFiles: PACKAGE_FILES,
    signerFile: SIGNER
  }

  it('refuses a dirty tree, because the registry copy cannot be re-derived', () => {
    const refusal = publishRefusal({
      ...base,
      flags: noFlags,
      treeIsDirty: true
    })
    expect(refusal).toContain('uncommitted changes')
  })

  it('allows a dirty tree when the caller said so', () => {
    const flags = parsePublishFlags(['--allow-dirty'])
    expect(
      publishRefusal({ ...base, flags, treeIsDirty: true })
    ).toBeUndefined()
  })

  it('refuses the addon without the flag that says the secret is the CLI’s own', () => {
    // The addon's shards reconstruct the same `apiSecret` the mobile
    // release builds sign with, and the runtime pad is a constant in this
    // public repository.
    const flags = parsePublishFlags(['--with-signer'])
    const refusal = publishRefusal({
      ...base,
      flags,
      packedFiles: [...PACKAGE_FILES, SIGNER]
    })
    expect(refusal).toContain('Refusing to publish the HMAC addon')
    expect(refusal).toContain('--signer-secret-is-cli-only')
  })

  it('allows the addon once that flag is given', () => {
    const flags = parsePublishFlags([
      '--with-signer',
      '--signer-secret-is-cli-only'
    ])
    expect(
      publishRefusal({
        ...base,
        flags,
        packedFiles: [...PACKAGE_FILES, SIGNER]
      })
    ).toBeUndefined()
  })

  it('refuses an unsigned build unless it is asked for out loud', () => {
    expect(
      publishRefusal({ ...base, flags: noFlags, hasKey: false })
    ).toContain('--allow-unsigned')
    expect(
      publishRefusal({
        ...base,
        flags: parsePublishFlags(['--allow-unsigned']),
        hasKey: false
      })
    ).toBeUndefined()
    // `--no-build` publishes whatever is already in `lib/`, so the key is
    // not this run's business.
    expect(
      publishRefusal({
        ...base,
        flags: parsePublishFlags(['--no-build']),
        hasKey: false
      })
    ).toBeUndefined()
  })

  it('refuses --with-signer when the allowlist would drop the addon', () => {
    // The last check before the stage is final, and the way this failed was
    // silent: the addon in the directory, absent from the tarball, and the
    // report saying "included".
    const flags = parsePublishFlags([
      '--with-signer',
      '--signer-secret-is-cli-only'
    ])
    const refusal = publishRefusal({ ...base, flags })
    expect(refusal).toContain('not in the manifest')
    expect(refusal).toContain('Nothing has been published')
  })

  it('allows an ordinary publish', () => {
    expect(publishRefusal({ ...base, flags: noFlags })).toBeUndefined()
  })
})
