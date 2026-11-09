import { describe, expect, it, jest } from '@jest/globals'

import {
  defaultCategories,
  readSyncedSubcategories
} from '../../actions/CategoriesActions'
import {
  makeFakeDiskletAccount,
  missingFileErrnoError
} from '../../util/fake/fakeDisklet'

jest.mock('../../components/services/AirshipInstance', () => ({
  showError: jest.fn()
}))

/**
 * `Categories.json` is on the *synced* repo, so a bad read is expensive.
 *
 * Answering every failure with the 116-entry default array would let one
 * decryption or I/O failure on a file that is there replace the user's own
 * subcategories, on every device. So only an absent file reads as the
 * defaults: the reader tests `isMissingFile` first, as the two readers
 * beside it (`localAccountSettings.ts`, `exportTxInfo.ts`) do.
 */
describe('readSyncedSubcategories', () => {
  it('returns the defaults for an absent file, and writes nothing', async () => {
    // A read, and only a read. Both callers funnel through this function,
    // and only `setNewSubcategory` holds the `serializeByKey` key, so a
    // write here would race an add tapped in `CategoryModal`'s mount window
    // and could leave the synced file without the user's entry while Redux
    // has it.
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })
    expect(await readSyncedSubcategories(account)).toStrictEqual(
      defaultCategories
    )
    expect(written).toStrictEqual([])
  })

  it('still answers the defaults when the repo cannot be written', async () => {
    // The defaults need no write, so a repo that cannot be written does not
    // fail a *read*, and `CategoryModal` still offers the 116 standard
    // categories on the screen whose purpose is to offer them.
    const account = makeFakeDiskletAccount({
      writeError: new Error('EACCES: the synced repo is read-only')
    })
    expect(await readSyncedSubcategories(account)).toStrictEqual(
      defaultCategories
    )
  })

  it('treats an ENOENT the same way', async () => {
    const account = makeFakeDiskletAccount({
      syncedError: missingFileErrnoError('Categories.json')
    })
    expect(await readSyncedSubcategories(account)).toStrictEqual(
      defaultCategories
    )
  })

  it('throws, rather than rewriting, a file it cannot read', async () => {
    const account = makeFakeDiskletAccount({
      syncedError: new Error('Could not decrypt Categories.json')
    })
    await expect(readSyncedSubcategories(account)).rejects.toThrow(
      /Could not decrypt/
    )
  })

  it('refuses valid JSON that is not a categories object', async () => {
    // `asObject` accepts an array, and `categories` is `asOptional(…, () =>
    // [...defaultCategories])`, so without the object check each of these
    // would clean to the 116 defaults and report a successful read.
    // `setNewSubcategory` would then merge its one entry into those defaults
    // and `writeSyncedSubcategories` put them on `account.disklet`: the
    // user's whole subcategory list replaced by the defaults plus one entry,
    // on the *synced* repo, on every device. `[]` and `["Expense:Mine"]` are
    // the shapes a half-synced file is likeliest to produce, and the two
    // sibling readers of this pattern guard against them too.
    for (const synced of ['[]', '["Expense:Mine"]', '[1,2,3]']) {
      const account = makeFakeDiskletAccount({ synced })
      await expect(readSyncedSubcategories(account)).rejects.toThrow(
        /not a JSON object/
      )
    }
  })

  it('returns the list the file holds', async () => {
    const account = makeFakeDiskletAccount({
      synced: JSON.stringify({ categories: ['Expense:Beans'] })
    })
    expect(await readSyncedSubcategories(account)).toStrictEqual([
      'Expense:Beans'
    ])
  })

  it('defaults a file that parses without the list', async () => {
    // `{}` must not return `undefined` into `state.ui.subcategories`, which
    // is typed `string[]`: `CategoryModal` would throw on `categories.map`.
    const account = makeFakeDiskletAccount({ synced: '{}' })
    expect(await readSyncedSubcategories(account)).toStrictEqual(
      defaultCategories
    )
  })

  it('refuses a list that is not a list of strings', async () => {
    // Not the defaults: substituting them for a list with one bad entry is
    // the same loss as substituting them for an unreadable file, and
    // `setNewSubcategory` would then write defaults-plus-one over the user's
    // real list. An absent `categories` is the one case the defaults are
    // right for, because that is what a fresh account has.
    const account = makeFakeDiskletAccount({
      synced: JSON.stringify({ categories: [1, 2] })
    })
    await expect(readSyncedSubcategories(account)).rejects.toThrow(
      /Expected a string/
    )
  })
})
