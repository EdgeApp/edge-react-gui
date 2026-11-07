import {
  missingFileErrnoError,
  missingFileError
} from '../../util/fake/fakeDisklet'
import {
  isContentFailure,
  isDecryptionFailure,
  isMissingFile
} from '../../util/predicates'

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

/**
 * Which failures may move or delete a settings or categories file.
 *
 * A false positive deletes a file that was merely hard to read; a false
 * negative leaves a file that will not decrypt refusing every write on that
 * device for good. Core's three messages were matched by hand against
 * `edge-core-js`'s repo disklet. This table pins this side's match — the
 * strings are written out here, so it cannot notice core rewording one;
 * that would need the disklet itself to produce them.
 */
describe('isContentFailure', () => {
  const cases: Array<[string, unknown, boolean, boolean]> = [
    // name, error, content failure, decryption failure
    [
      'a parse error',
      new SyntaxError('Unexpected end of JSON input'),
      true,
      false
    ],
    ['a cleaner error', new TypeError('Expected a string'), true, false],
    ['core: bad checksum', new Error('Invalid checksum'), true, true],
    ['core: bad padding', new Error('Invalid PKCS7 padding'), true, true],
    [
      'core: unknown encryption',
      new Error('Unknown encryption type'),
      true,
      true
    ],
    [
      'a bridge error with no code',
      new Error('The file couldn’t be opened.'),
      false,
      false
    ],
    [
      'a permission error',
      Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      false,
      false
    ],
    [
      'a message that only contains core’s',
      new Error('xInvalid checksum'),
      false,
      false
    ],
    ['a non-Error', 'Invalid checksum', false, false]
  ]
  it.each(cases)('%s', (_name, error, content, decryption) => {
    expect(isContentFailure(error)).toBe(content)
    expect(isDecryptionFailure(error)).toBe(decryption)
  })
})
