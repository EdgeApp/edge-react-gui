import { describe, expect, it } from '@jest/globals'
import { asBoolean, asNumber, asObject, asOptional } from 'cleaners'

import { onlyNamedFlags } from '../../cli/engine/routes/keys'
import { asEdgeMetadata, withoutUndefined } from '../../cli/engine/schemas'

/**
 * `change-wallet-states` must change only the flags it was given.
 *
 * Core merges rather than replaces — `{ ...walletStates[id], ...newStates[id] }`
 * — and an object spread copies a key whose value is `undefined` over the real
 * one. `asObject` materialises every declared key, so the cleaned body of
 * `--archived=true` carried `hidden: undefined` and `sortIndex: undefined`
 * along with it and wiped both, in the account's *synced* repo.
 */

/** The route's own inner cleaner, so the test starts where the route does. */
const asStates = asObject({
  archived: asOptional(asBoolean),
  deleted: asOptional(asBoolean),
  hidden: asOptional(asBoolean),
  sortIndex: asOptional(asNumber)
}).withRest

describe('onlyNamedFlags', () => {
  it('drops the flags the caller did not name', () => {
    const cleaned = asStates({ archived: true })
    // The shape of the problem: all four keys exist after cleaning.
    expect(Object.keys(cleaned).sort()).toStrictEqual([
      'archived',
      'deleted',
      'hidden',
      'sortIndex'
    ])
    expect(Object.keys(onlyNamedFlags(cleaned))).toStrictEqual(['archived'])
  })

  it('leaves the existing state intact through core’s merge', () => {
    // Core's own expression, with the values a wallet really has.
    const existing = { archived: false, hidden: true, sortIndex: 7 }
    const merged = {
      ...existing,
      ...onlyNamedFlags(asStates({ archived: true }))
    }
    expect(merged).toStrictEqual({
      archived: true,
      hidden: true,
      sortIndex: 7
    })
  })

  it('keeps false and zero, which are named values', () => {
    // The reason this cannot be a truthiness test: un-archiving is `false`
    // and the first wallet in the list is `sortIndex: 0`.
    const named = onlyNamedFlags(asStates({ archived: false, sortIndex: 0 }))
    expect(named).toStrictEqual({ archived: false, sortIndex: 0 })
    const merged = { ...{ archived: true, sortIndex: 9 }, ...named }
    expect(merged).toStrictEqual({ archived: false, sortIndex: 0 })
  })

  it('passes every flag through when every flag is named', () => {
    const all = { archived: true, deleted: false, hidden: true, sortIndex: 3 }
    expect(onlyNamedFlags(asStates(all))).toStrictEqual(all)
  })

  it('answers an empty object for an empty body', () => {
    // The command refuses this before the route sees it; core would treat it
    // as "change nothing", which is the honest translation.
    expect(onlyNamedFlags(asStates({}))).toStrictEqual({})
  })
})

/**
 * The same defect on the spend path's metadata.
 *
 * `asEdgeMetadata` materialises all five keys, and `mergeMetadata` spreads
 * the cleaned value over whatever the URI carried — so any `--metadata`
 * blanked every field it did not itself set: the payee, the category, the
 * bizId. `JSON.stringify` prints the cleaned object as the caller sent it
 * either way, which is why this and the wallet flags both hid.
 */
describe('withoutUndefined over cleaned metadata', () => {
  it('keeps the fields a caller did not send out of the merge', () => {
    const cleaned = asEdgeMetadata({ notes: 'just a note' })
    // All five keys exist after cleaning, which is the shape of the problem.
    expect(Object.keys(cleaned).sort()).toStrictEqual([
      'bizId',
      'category',
      'exchangeAmount',
      'name',
      'notes'
    ])
    expect(Object.keys(withoutUndefined(cleaned))).toStrictEqual(['notes'])

    const existing = {
      name: 'Alice',
      category: 'Income:Pay',
      notes: 'old',
      bizId: 7
    }
    expect({ ...existing, ...withoutUndefined(cleaned) }).toStrictEqual({
      name: 'Alice',
      category: 'Income:Pay',
      notes: 'just a note',
      bizId: 7
    })
  })

  it('keeps an empty string, which is a value a caller can mean', () => {
    // Clearing a note is `--metadata '{"notes":""}'`, not an absent key, so
    // this cannot be a truthiness test any more than the wallet flags could.
    const cleared = withoutUndefined(asEdgeMetadata({ notes: '' }))
    expect(cleared).toStrictEqual({ notes: '' })
    expect({ ...{ notes: 'old' }, ...cleared }).toStrictEqual({ notes: '' })
  })
})
