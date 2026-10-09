import {
  missingFileErrnoError,
  missingFileError
} from '../../util/fake/fakeDisklet'
import { isMissingFile } from '../../util/predicates'

/**
 * The predicate against the strings production really produces.
 *
 * Both callers answer an absent file by rewriting it from defaults —
 * `mergeExportTxInfo` from `{}`, `readLocalAccountSettingsFromDisk` from the
 * cleaner defaults that `changeLocalSettings` then writes back — so a false
 * positive is data loss, and a false negative is a 500 on a first-ever save.
 * That makes the exact match set the behaviour worth pinning.
 */
describe('isMissingFile', () => {
  it('matches what disklet raises for an absent file', () => {
    expect(isMissingFile(missingFileError('exportTxInfo.json'))).toBe(true)
    expect(isMissingFile(missingFileErrnoError('Settings.json'))).toBe(true)
  })

  it('matches an errno even when the message says nothing', () => {
    expect(
      isMissingFile(Object.assign(new Error('nope'), { code: 'ENOENT' }))
    ).toBe(true)
  })

  it('does not match a file that is there and unreadable', () => {
    // `encryptDisklet.getText` runs JSON.parse, then a cleaner, then decrypt.
    expect(isMissingFile(new SyntaxError('Unexpected end of JSON input'))).toBe(
      false
    )
    expect(isMissingFile(new Error('"Settings.json" is a binary file.'))).toBe(
      false
    )
    expect(
      isMissingFile(
        Object.assign(new Error('permission denied'), {
          code: 'EACCES'
        })
      )
    ).toBe(false)
  })

  it('does not read an unrelated "not found" as an absent file', () => {
    // No library in the tree emits this, and both callers respond to a true
    // answer by overwriting the file from defaults.
    expect(isMissingFile(new Error('wallet not found'))).toBe(false)
    expect(isMissingFile(new Error('Token not found for currency code'))).toBe(
      false
    )
  })

  it('is false for a non-error', () => {
    expect(isMissingFile(null)).toBe(false)
    expect(isMissingFile('Cannot load "x"')).toBe(false)
  })
})
