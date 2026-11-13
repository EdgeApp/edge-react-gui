import { describe, expect, it } from '@jest/globals'
import type { EdgeWalletState } from 'edge-core-js'

import {
  asWalletStateEntry,
  onlyNamedFlags,
  WALLET_STATE_FLAGS
} from '../../cli/engine/routes/keys'
import { asEdgeMetadata, withoutUndefined } from '../../cli/engine/schemas'

/**
 * `change-wallet-states` must change only the flags it was given.
 *
 * Core merges rather than replaces — `{ ...walletStates[id], ...newStates[id] }`
 * — and an object spread copies a key whose value is `undefined` over the real
 * one. `asObject` materialises every declared key, so the cleaned body of
 * `--archived=true` carries `hidden: undefined` and `sortIndex: undefined`
 * along with it, and core's merge would copy both over the real values, in
 * the account's *synced* repo.
 */

/**
 * The route's own inner cleaner, so the test starts where the route does.
 *
 * Imported rather than restated, so these cases check the declaration the
 * route uses: a restated copy could drift from it without any test noticing.
 */
const asStates = asWalletStateEntry

describe('onlyNamedFlags', () => {
  it('drops the flags the caller did not name', () => {
    const cleaned = asStates({ archived: true })
    // The shape of the problem: all five keys exist after cleaning.
    expect(Object.keys(cleaned).sort()).toStrictEqual([
      'archived',
      'deleted',
      'hidden',
      'migratedFromWalletId',
      'sortIndex'
    ])
    expect(Object.keys(onlyNamedFlags(cleaned))).toStrictEqual(['archived'])
  })

  it('refuses a misspelled flag rather than writing it', () => {
    // The inner cleaner is `.withRest`, so a typo survives cleaning, and core
    // would write it verbatim into the account's synced `Keys/<hash>.json`:
    // `--wallet-states='{"<id>":{"archvied":true}}'` would answer 204,
    // archive nothing, and sync a junk key to every device. Dropping
    // `.withRest` would answer 204 and change nothing, which is the failure
    // the route's wallet-id resolution exists to prevent.
    const cleaned = asStates({ archvied: true })
    // `.withRest`'s own output type does not name the rest keys, so this is
    // the cast the route itself does not need: the point is that the key is
    // there, which is how it would reach core.
    expect((cleaned as Record<string, unknown>).archvied).toBe(true)
    let caught: { code?: string; status?: number; message?: string } = {}
    try {
      onlyNamedFlags(cleaned)
    } catch (error) {
      caught = error as { code?: string; status?: number; message?: string }
    }
    expect(caught.code).toBe('BAD_REQUEST')
    expect(caught.status).toBe(400)
    expect(caught.message).toContain('"archvied"')
    expect(caught.message).toContain(
      'archived, deleted, hidden, migratedFromWalletId, sortIndex'
    )
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
 * The same rule on the spend path's metadata.
 *
 * `asEdgeMetadata` materialises all five keys, and `mergeMetadata` spreads
 * the cleaned value over whatever the URI carried, so with the `undefined`
 * keys left in, any `--metadata` would blank every field it did not itself
 * set: the payee, the category, the bizId. `JSON.stringify` prints the
 * cleaned object as the caller sent it either way, so a printed body never
 * shows this, for the metadata or for the wallet flags.
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

describe('the wallet-state cleaner against core', () => {
  it('declares every field EdgeWalletState carries', () => {
    // A field missing from the declaration still passes `.withRest`: a
    // wrong-typed `migratedFromWalletId` would go through
    // `account.changeWalletStates` into `asWalletStateFile`'s uncleaner and
    // throw inside core, so the route would answer `500 INTERNAL_ERROR`
    // where its declaration should give a 400 naming the field.
    const typed: EdgeWalletState = {
      archived: true,
      deleted: false,
      hidden: false,
      migratedFromWalletId: 'old-wallet',
      sortIndex: 3
    }
    const cleaned = asWalletStateEntry(typed)
    expect(onlyNamedFlags(cleaned)).toStrictEqual(typed)
  })

  it('refuses a wrong-typed migratedFromWalletId at the boundary', () => {
    expect(() => asWalletStateEntry({ migratedFromWalletId: 42 })).toThrow()
  })
})

/**
 * The cleaner and the accepted-key list are one declaration.
 *
 * `onlyNamedFlags` refuses every key the list does not name, so if the two
 * drifted, a sixth field added to the cleaner and published in the generated
 * reference would be refused by the route documenting it.
 */
describe('WALLET_STATE_FLAGS', () => {
  it('is exactly what the cleaner accepts', () => {
    // Every declared key materialises on the cleaned object, which is the
    // property `onlyNamedFlags` relies on and the one that makes this
    // comparison total.
    expect([...WALLET_STATE_FLAGS].sort()).toStrictEqual(
      Object.keys(asWalletStateEntry({})).sort()
    )
  })

  it('names all five of core\u2019s EdgeWalletState fields', () => {
    expect([...WALLET_STATE_FLAGS].sort()).toStrictEqual([
      'archived',
      'deleted',
      'hidden',
      'migratedFromWalletId',
      'sortIndex'
    ])
  })

  it('accepts every flag it names', () => {
    // The inverse of the refusal: a key on the list must pass
    // `onlyNamedFlags`, so the two cannot disagree in either direction.
    for (const flag of WALLET_STATE_FLAGS) {
      const value =
        flag === 'sortIndex' ? 7 : flag === 'migratedFromWalletId' ? 'w1' : true
      expect(() =>
        onlyNamedFlags(asWalletStateEntry({ [flag]: value }))
      ).not.toThrow()
    }
  })
})
