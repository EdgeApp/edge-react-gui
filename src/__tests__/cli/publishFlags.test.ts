import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { CLI_PACKAGE_FILES, CLI_SIGNER_FILE } from '../../cli/npmMeta'

const ROOT = path.resolve(__dirname, '../../..')
const source = fs.readFileSync(path.join(ROOT, 'scripts/publishCli.ts'), 'utf8')

/**
 * That the script still routes its decisions through the tested module.
 *
 * `publishArgs.test.ts` is where the decisions themselves are asserted, by
 * running them from `scripts/util/publishArgs.ts`. This script does its work
 * at module scope and cannot be imported, so what is checked here is that it
 * has not grown a second copy of them, which is the only way the two could
 * disagree.
 */
describe('publishCli delegates its decisions', () => {
  it('parses its flags through publishArgs', () => {
    expect(source).toContain("from './util/publishArgs'")
    expect(source).toContain('parsePublishFlags(argv)')
  })

  it('takes the packed file list and the signed decision from it', () => {
    expect(source).toContain('packedFilesFor({')
    expect(source).toContain('isSignedPublish({')
    // The addon is not in the default allowlist, which is what makes
    // `packedFilesFor` a decision rather than a formality.
    expect(CLI_PACKAGE_FILES).not.toContain(CLI_SIGNER_FILE)
  })

  it('asks each phase\u2019s refusal at that phase', () => {
    // Two functions, not one called twice. With one, each call would have to
    // fabricate the inputs for the checks that do not apply to it yet: the
    // pre-build call a `packedFiles`, so the allowlist check cannot fire
    // before a manifest exists, and the staged call a clean tree, so the
    // dirty check cannot fire twice. Which refusals a call could reach would
    // then be decided by arguments that are not facts.
    expect(source).toContain('preBuildRefusal({')
    expect(source).toContain('stagedManifestRefusal({')
    expect(source.split('preBuildRefusal({').length - 1).toBe(1)
    expect(source.split('stagedManifestRefusal({').length - 1).toBe(1)
    // And the pre-build phase judges the tree, which is the guard on the
    // one action the script says cannot be undone.
    expect(source).toContain('readTreeState()')
  })

  it('keeps no second copy of the rules it delegates', () => {
    // Shapes of the rules `publishArgs.ts` owns. A reader adding one back
    // locally is how the script and the module would drift apart.
    expect(source).not.toMatch(/value\.startsWith\('--'\)/)
    expect(source).not.toMatch(
      /manifest\.files = \[\.\.\.CLI_PACKAGE_FILES, CLI_SIGNER_FILE\]/
    )
  })

  it('still stops before publishing when --out was given', () => {
    // The gate a valueless `--out` must not slip past.
    expect(source).toContain('stopping before publish')
    expect(source).toMatch(/npm publish|'publish'/)
  })
})
