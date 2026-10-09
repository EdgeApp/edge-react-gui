import { describe, expect, it } from '@jest/globals'

import {
  EXPORT_TX_INFO_FILE,
  exportTxInfoKey,
  mergeExportTxInfo,
  readExportTxInfoMap
} from '../../util/exportTxInfo'
import {
  makeFakeDiskletWallet,
  missingFileErrnoError
} from '../../util/fake/fakeDisklet'

/**
 * Per-asset export preferences on the wallet's *synced* repo.
 *
 * Every branch here exists for a loss. `readExportTxInfoMap` is tolerant per
 * record, so one asset entry this version cannot read costs that entry
 * rather than the Export button; `mergeExportTxInfo` is strict about the
 * read, because answering an unreadable file with an empty map rewrites
 * every asset's saved preferences from nothing. `localAccountSettings.ts` and
 * `CategoriesActions.ts` draw the same line and both have the three-case
 * suite; this was the reader that did not.
 */
const GOOD = {
  bitwaveAccountId: 'acct-1',
  isExportBitwave: true,
  isExportCsv: false,
  isExportQbo: false
}

const file = (map: unknown): Record<string, string> => ({
  [EXPORT_TX_INFO_FILE]: JSON.stringify(map)
})

describe('readExportTxInfoMap', () => {
  it('reads the records it understands', async () => {
    const wallet = makeFakeDiskletWallet({ files: file({ BTC: GOOD }) })
    expect(await readExportTxInfoMap(wallet)).toStrictEqual({ BTC: GOOD })
  })

  it('keeps the good record when another is unreadable', async () => {
    // One asset entry costs that entry. `deadbeef` is missing
    // `isExportQbo`, so its record fails `asExportTxInfo`.
    const wallet = makeFakeDiskletWallet({
      files: file({ BTC: GOOD, deadbeef: { bitwaveAccountId: 'x' } })
    })
    expect(await readExportTxInfoMap(wallet)).toStrictEqual({ BTC: GOOD })
  })

  it('answers an unparseable file with an empty map', async () => {
    // Nothing can be recovered from it, and the GUI scene recovered by
    // writing a fresh map.
    const wallet = makeFakeDiskletWallet({
      files: { [EXPORT_TX_INFO_FILE]: '{not json' }
    })
    expect(await readExportTxInfoMap(wallet)).toStrictEqual({})
  })

  it('lets a read failure out', async () => {
    // Not the same as absent: the caller decides, and `mergeExportTxInfo`
    // below refuses to write over it.
    const wallet = makeFakeDiskletWallet({
      readError: new Error('could not decrypt')
    })
    await expect(readExportTxInfoMap(wallet)).rejects.toThrow(
      'could not decrypt'
    )
  })
})

describe('mergeExportTxInfo', () => {
  it('creates the key with falsey defaults for what was not sent', async () => {
    const wallet = makeFakeDiskletWallet({})
    const next = await mergeExportTxInfo(wallet, null, {
      isExportCsv: true
    })
    expect(next).toStrictEqual({
      bitwaveAccountId: '',
      isExportBitwave: false,
      isExportCsv: true,
      isExportQbo: false
    })
    // Under the native asset's key, which is the currency code.
    expect(await readExportTxInfoMap(wallet)).toStrictEqual({ BTC: next })
  })

  it('keeps a field the patch omits', async () => {
    const wallet = makeFakeDiskletWallet({ files: file({ BTC: GOOD }) })
    const next = await mergeExportTxInfo(wallet, null, { isExportCsv: true })
    // The saved bitwave id survives a patch about CSV, which is what the
    // offline suite asserts indirectly through a third command.
    expect(next.bitwaveAccountId).toBe('acct-1')
    expect(next.isExportBitwave).toBe(true)
    expect(next.isExportCsv).toBe(true)
  })

  it('tells an omitted id apart from a deliberate clear', async () => {
    // `patch.x ?? prev?.x`, so `undefined` keeps and `''` clears — and the
    // scene used to send `''` for both, because `accountId` starts empty
    // and is only filled inside the Bitwave arm. A CSV-only export, or a
    // cancelled id modal, therefore erased an id the user would have to
    // find and retype.
    const wallet = makeFakeDiskletWallet({ files: file({ BTC: GOOD }) })
    const kept = await mergeExportTxInfo(wallet, null, {
      bitwaveAccountId: undefined,
      isExportCsv: true
    })
    expect(kept.bitwaveAccountId).toBe('acct-1')

    const cleared = await mergeExportTxInfo(wallet, null, {
      bitwaveAccountId: '',
      isExportCsv: true
    })
    expect(cleared.bitwaveAccountId).toBe('')
  })

  it('writes nothing when the file is there and unreadable', async () => {
    let wrote = false
    const wallet = makeFakeDiskletWallet({
      readError: new Error('could not decrypt'),
      onWrite: () => {
        wrote = true
      }
    })
    await expect(
      mergeExportTxInfo(wallet, null, { isExportCsv: true })
    ).rejects.toThrow('could not decrypt')
    // Answering that with a rewrite would lose every asset's preferences.
    expect(wrote).toBe(false)
  })

  it('treats an absent file as an empty map', async () => {
    const wallet = makeFakeDiskletWallet({
      readError: missingFileErrnoError(EXPORT_TX_INFO_FILE)
    })
    // The errno shape, which `isMissingFile` matches by `code` rather than
    // by anyone's prose.
    const next = await mergeExportTxInfo(wallet, null, { isExportQbo: true })
    expect(next.isExportQbo).toBe(true)
  })

  it('keeps both records when two assets merge at once', async () => {
    // Read-modify-write over the whole file: the engine serves requests
    // concurrently, and without `serializeByKey` the second write discards
    // the first.
    const wallet = makeFakeDiskletWallet({})
    await Promise.all([
      mergeExportTxInfo(wallet, null, { isExportCsv: true }),
      mergeExportTxInfo(wallet, 'deadbeef', { isExportQbo: true })
    ])
    const map = await readExportTxInfoMap(wallet)
    expect(Object.keys(map).sort()).toStrictEqual(['BTC', 'deadbeef'])
    expect(map.BTC.isExportCsv).toBe(true)
    expect(map.deadbeef.isExportQbo).toBe(true)
  })
})

describe('exportTxInfoKey', () => {
  it('keys the native asset by currency code and a token by its id', () => {
    const wallet = makeFakeDiskletWallet({ currencyCode: 'ETH' })
    expect(exportTxInfoKey(wallet, null)).toBe('ETH')
    expect(exportTxInfoKey(wallet, 'deadbeef')).toBe('deadbeef')
  })
})
