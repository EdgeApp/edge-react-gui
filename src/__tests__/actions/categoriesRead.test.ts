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
 * The reader caught every failure and answered it by writing the 400-entry
 * default array back — so one decryption or I/O failure on a file that is
 * there replaced the user's own subcategories, on every device. The two
 * readers beside it (`localAccountSettings.ts`, `exportTxInfo.ts`) both test
 * `isMissingFile` first, and this is the file that reasoning came from.
 */
describe('readSyncedSubcategories', () => {
  it('returns the defaults for an absent file, and writes nothing', async () => {
    // A read, and only a read. The seed write it used to do was the one
    // `setText` outside `setNewSubcategory`'s `serializeByKey` key — in the
    // function both callers funnel through — so a tap in `CategoryModal`'s
    // mount window raced the mount's own unlocked write and the synced
    // file ended up without the user's entry while Redux had it.
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
    // The seed write was awaited and `writeSyncedSubcategories` no longer
    // swallows a failure, so this threw out of a *read* — and
    // `CategoryModal` rendered an empty list, offering none of the 400
    // standard categories on the screen whose purpose is to offer them.
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

  it('returns the list the file holds', async () => {
    const account = makeFakeDiskletAccount({
      synced: JSON.stringify({ categories: ['Expense:Beans'] })
    })
    expect(await readSyncedSubcategories(account)).toStrictEqual([
      'Expense:Beans'
    ])
  })

  it('defaults a file that parses without the list', async () => {
    // `{}` used to return `undefined` into `state.ui.subcategories`, which
    // is typed `string[]`, and `CategoryModal` threw on `categories.map`.
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
