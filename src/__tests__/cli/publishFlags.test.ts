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
 * running them. These five cases used to assert regexes against this
 * script's own text — `expect(source).toMatch(/value\.startsWith\('--'\)/)`
 * — because it does its work at module scope and cannot be imported, so
 * they passed for a reformat that broke the logic and failed for a prettier
 * line break that did not. The decisions moved to
 * `scripts/util/publishArgs.ts`; what is left to check here is that this
 * shell has not grown a second copy of them, which is the only way the two
 * could disagree again.
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
    // Two functions, not one called twice. With one, each call had to
    // fabricate the inputs for the checks that did not apply to it yet —
    // the pre-build call invented a `packedFiles` so the allowlist check
    // could not fire before a manifest existed, the staged call invented a
    // clean tree so the dirty check could not fire twice — so which
    // refusals a call could reach was decided by arguments that were not
    // facts.
    expect(source).toContain('preBuildRefusal({')
    expect(source).toContain('stagedManifestRefusal({')
    expect(source.split('preBuildRefusal({').length - 1).toBe(1)
    expect(source.split('stagedManifestRefusal({').length - 1).toBe(1)
    // And the pre-build phase judges the tree, which is the guard on the
    // one action the script says cannot be undone.
    expect(source).toContain('readTreeState()')
  })

  it('keeps no second copy of the rules it delegates', () => {
    // The shapes that used to live here. A reader adding one back locally
    // is how the script and the module would drift apart.
    expect(source).not.toMatch(/value\.startsWith\('--'\)/)
    expect(source).not.toMatch(
      /manifest\.files = \[\.\.\.CLI_PACKAGE_FILES, CLI_SIGNER_FILE\]/
    )
  })

  it('still stops before publishing when --out was given', () => {
    // The gate the valueless `--out` used to slip past.
    expect(source).toContain('stopping before publish')
    expect(source).toMatch(/npm publish|'publish'/)
  })
})
