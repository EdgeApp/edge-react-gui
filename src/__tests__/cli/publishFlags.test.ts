import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { CLI_PACKAGE_FILES, CLI_SIGNER_FILE } from '../../cli/npmMeta'

const ROOT = path.resolve(__dirname, '../../..')
const source = fs.readFileSync(path.join(ROOT, 'scripts/publishCli.ts'), 'utf8')

/**
 * The two ways `publishCli.ts` could publish something nobody meant to.
 *
 * It cannot be driven end to end from a test — it builds, packs and talks
 * to the registry — so these pin the two shapes that made it dangerous.
 */
describe('publishCli argument handling', () => {
  it('refuses a flag whose value is missing or another flag', () => {
    // `--out` with the path left off used to answer `undefined`, which made
    // `if (stageOnly != null)` false and fell through to
    // `npm publish --access public`: the flag a reader reaches for to
    // *avoid* publishing was the one whose typo published, irreversibly,
    // because npm will not replace a version.
    expect(source).toMatch(/value\.startsWith\('--'\)/)
    expect(source).toMatch(/needs a value/)
  })

  it('adds the signer to the packed file list, not just the stage', () => {
    // npm's `files` is an allowlist, so copying the addon into the stage
    // without listing it packs everything except the addon — and the
    // report said "native signer: included" about a tarball that had none.
    expect(source).toMatch(
      /manifest\.files = \[\.\.\.CLI_PACKAGE_FILES, CLI_SIGNER_FILE\]/
    )
    expect(CLI_PACKAGE_FILES).not.toContain(CLI_SIGNER_FILE)
  })

  it('decides "signed" from the manifest rather than the directory', () => {
    // A reused `--out` directory with a stale addon made `signed` true
    // with no `--with-signer`, which suppressed the README paragraph that
    // explains why the installed CLI will not start without a key.
    expect(source).toMatch(/packedFiles\.includes\(SIGNER\)/)
  })

  it('refuses to publish a signed package without the signed manifest', () => {
    // The belt to the braces: `--with-signer` is the path the CLI will use
    // once it has a key pair of its own, and its failure mode was silent.
    expect(source).toMatch(
      /withSigner && !\(manifest\.files as string\[\]\)\.includes\(CLI_SIGNER_FILE\)/
    )
    expect(source).toMatch(/would be published as signed/)
  })

  it('spells the signer file once', () => {
    // `npmMeta.ts` is where the decision lives; a second spelling in the
    // publisher is what let the manifest and the stage disagree.
    expect(source).not.toMatch(/'edge_api_signer\.node'/)
    expect(source).toMatch(/const SIGNER = CLI_SIGNER_FILE/)
  })
})
