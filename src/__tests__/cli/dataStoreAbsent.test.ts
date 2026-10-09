import { describe, expect, it } from '@jest/globals'

import { isAbsentItem } from '../../cli/engine/routes/dataStore'

/**
 * Which `get-item` failures are the 404 the route declares.
 *
 * `account.dataStore.getItem` answers an absent item with its own sentinel,
 * `No item named "<itemId>"` — the disklet helper under it swallows every
 * read failure and returns `undefined`, so core has nothing more specific to
 * say. Everything else comes from the `getDisklet()` call `getItem` makes
 * first: an account repo that will not open.
 *
 * The route used to report all of them as `404 NOT_FOUND`. A scripted caller
 * that treats 404 as "absent" then writes its defaults over live plugin
 * state — which is what this store holds.
 */
describe('isAbsentItem', () => {
  it('reads core’s own sentinel as absent', () => {
    // Verbatim from edge-core-js: `throw new Error(`No item named "${itemId}"`)`.
    expect(isAbsentItem(new Error('No item named "pin"'))).toBe(true)
  })

  it('reads a missing file as absent', () => {
    const enoent = Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    expect(isAbsentItem(enoent)).toBe(true)
    expect(isAbsentItem(new Error('Cannot load "Keys/x.json"'))).toBe(true)
  })

  it('does not read a repo that will not open as absent', () => {
    // `getDisklet()` is the first thing `getItem` does, and this is the
    // failure that used to arrive as `404 NOT_FOUND`.
    expect(isAbsentItem(new Error('Cannot decrypt sync key'))).toBe(false)
    expect(isAbsentItem(new Error('Network request failed'))).toBe(false)
  })

  it('does not read a thrown non-error as absent', () => {
    expect(isAbsentItem('No item named "pin"')).toBe(false)
    expect(isAbsentItem(undefined)).toBe(false)
  })
})
