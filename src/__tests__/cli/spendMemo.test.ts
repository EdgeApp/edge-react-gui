import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeMemoOption } from 'edge-core-js'

import { buildSpendInfo, memoFromUri } from '../../cli/engine/routes/spend'
import { asEdgeMetadata, asSweepSpendInfo } from '../../cli/engine/schemas'

/**
 * A URI's `uniqueIdentifier` has to become the kind of memo its chain wants.
 *
 * Hard-coding `text` was irreversible rather than merely wrong: on XRP the
 * destination tag went into `payment.Memos` and `payment.DestinationTag`
 * stayed unset, so the payment broadcast successfully and an exchange
 * crediting on that field could not credit it. Nothing refused it, because
 * `text` *is* one of XRP's memo options — just not the first one.
 *
 * The real spend path needs a funded wallet, which the fake world has not
 * got, so this is where the derivation is pinned.
 */
function fakeWallet(
  memoOptions?: EdgeMemoOption[],
  memoType?: 'text' | 'number' | 'hex' | 'other'
): EdgeCurrencyWallet {
  return {
    currencyInfo: {
      currencyCode: 'XRP',
      pluginId: 'ripple',
      memoOptions,
      memoType
    }
  } as unknown as EdgeCurrencyWallet
}

/** XRP's real options, in its real order. */
const XRP_OPTIONS: EdgeMemoOption[] = [
  { type: 'number', memoName: 'destination tag', maxValue: '4294967295' },
  { type: 'text', memoName: 'memo', maxLength: 990 }
]

describe('memoFromUri', () => {
  it('makes a number memo for a destination tag', () => {
    expect(memoFromUri(fakeWallet(XRP_OPTIONS), '12345')).toStrictEqual({
      type: 'number',
      memoName: 'destination tag',
      value: '12345'
    })
  })

  it('makes a hex memo where hex is first', () => {
    // Zano's shape: the same defect the other way round.
    const options: EdgeMemoOption[] = [
      { type: 'hex', memoName: 'paymentId', maxBytes: 32 },
      { type: 'text', memoName: 'comment' }
    ]
    expect(memoFromUri(fakeWallet(options), 'deadbeef')).toMatchObject({
      type: 'hex',
      value: 'deadbeef'
    })
  })

  it('skips a hidden option', () => {
    const options: EdgeMemoOption[] = [
      { type: 'text', memoName: 'internal', hidden: true },
      { type: 'number', memoName: 'destination tag', maxValue: '100' }
    ]
    expect(memoFromUri(fakeWallet(options), '5').type).toBe('number')
  })

  it('refuses a value the option cannot hold', () => {
    // 2^32 is one past XRP's destination-tag maximum. A 400 here rather than
    // whatever the plugin throws after the request is already in flight.
    let code: string | undefined
    try {
      memoFromUri(fakeWallet(XRP_OPTIONS), '4294967296')
    } catch (error: unknown) {
      code = (error as { code?: string }).code
    }
    expect(code).toBe('BAD_REQUEST')
  })

  it('refuses a non-numeric destination tag', () => {
    let code: string | undefined
    try {
      memoFromUri(fakeWallet(XRP_OPTIONS), 'not-a-number')
    } catch (error: unknown) {
      code = (error as { code?: string }).code
    }
    expect(code).toBe('BAD_REQUEST')
  })

  it('falls back to the deprecated memoType', () => {
    // A plugin that has not moved to `memoOptions` yet.
    expect(memoFromUri(fakeWallet(undefined, 'number'), '7')).toStrictEqual({
      type: 'number',
      value: '7'
    })
  })

  it('falls back to text where the chain declares no memo support', () => {
    // The historical behaviour, kept for a chain with nothing to go on: the
    // plugin is what refuses it.
    expect(memoFromUri(fakeWallet(undefined, undefined), 'x')).toStrictEqual({
      type: 'text',
      value: 'x'
    })
    expect(memoFromUri(fakeWallet([], undefined), 'x').type).toBe('text')
  })
})

/**
 * The asset a URI names has to be the asset the request spends.
 *
 * `parseUriCommon` defaults the currency code to the chain's own and scales
 * `?amount=` by *that* denomination, so keeping the amount while ignoring the
 * code mixed two assets. XRP's multiplier is 1e6 and RLUSD's is 1e18, so
 * `?amount=5` against the token became 0.000000000005 of it — signed and
 * broadcast, because core and the plugin both trust `nativeAmount` as
 * already-scaled base units.
 */
describe('buildSpendInfo and the URI asset', () => {
  /** A wallet whose `parseUri` answers whatever the case needs. */
  function walletWithUri(parsed: Record<string, unknown>): EdgeCurrencyWallet {
    return {
      currencyInfo: {
        currencyCode: 'XRP',
        pluginId: 'ripple',
        memoOptions: XRP_OPTIONS
      },
      currencyConfig: {
        allTokens: {
          rlusd: { currencyCode: 'RLUSD', denominations: [] }
        }
      },
      parseUri: async () => parsed
    } as unknown as EdgeCurrencyWallet
  }

  const codeOf = async (fn: () => Promise<unknown>): Promise<string> => {
    try {
      await fn()
    } catch (error: unknown) {
      return (error as { code?: string }).code ?? 'NO_CODE'
    }
    return 'NO_THROW'
  }

  it('refuses a URI amount denominated in another asset', async () => {
    const wallet = walletWithUri({
      publicAddress: 'rXYZ',
      nativeAmount: '5000000',
      currencyCode: 'XRP'
    })
    expect(
      await codeOf(
        async () =>
          await buildSpendInfo(
            wallet,
            { tokenId: 'rlusd', to: 'ripple:rXYZ?amount=5' },
            { requireAmount: true }
          )
      )
    ).toBe('BAD_REQUEST')
  })

  it('accepts a URI amount in the asset being spent', async () => {
    const wallet = walletWithUri({
      publicAddress: 'rXYZ',
      nativeAmount: '5000000',
      currencyCode: 'XRP'
    })
    const info = await buildSpendInfo(
      wallet,
      { to: 'ripple:rXYZ?amount=5' },
      { requireAmount: true }
    )
    expect(info.spendTargets[0].nativeAmount).toBe('5000000')
    expect(info.tokenId).toBe(null)
  })

  it('accepts a URI with no amount whatever the asset', async () => {
    // Nothing to misinterpret: the caller supplies the amount.
    const wallet = walletWithUri({ publicAddress: 'rXYZ' })
    const info = await buildSpendInfo(
      wallet,
      {
        tokenId: 'rlusd',
        to: 'ripple:rXYZ',
        nativeAmount: '1000000000000000000'
      },
      { requireAmount: true }
    )
    expect(info.tokenId).toBe('rlusd')
    expect(info.spendTargets[0].nativeAmount).toBe('1000000000000000000')
  })

  it('carries a destination tag through as a number memo', async () => {
    const wallet = walletWithUri({
      publicAddress: 'rXYZ',
      uniqueIdentifier: '12345'
    })
    const info = await buildSpendInfo(
      wallet,
      { to: 'ripple:rXYZ?dt=12345', nativeAmount: '1' },
      { requireAmount: true }
    )
    expect(info.memos).toStrictEqual([
      { type: 'number', memoName: 'destination tag', value: '12345' }
    ])
  })
})

/**
 * A caller's `--metadata` must not blank the fields it does not name.
 *
 * Through `buildSpendInfo`, not through the helper: the first version of this
 * case asserted `withoutUndefined` directly and passed with the merge
 * reverted: a test of the mechanism rather than of the behaviour, which
 * passes whatever the caller actually gets.
 */
describe('buildSpendInfo and metadata', () => {
  function walletWithMetadata(
    parsed: Record<string, unknown>
  ): EdgeCurrencyWallet {
    return {
      currencyInfo: {
        currencyCode: 'BTC',
        pluginId: 'bitcoin',
        memoOptions: []
      },
      currencyConfig: { allTokens: {} },
      parseUri: async () => parsed
    } as unknown as EdgeCurrencyWallet
  }

  it('keeps the URI’s payee when the caller only sets notes', async () => {
    // A BIP21 `?label=` becomes `metadata.name`, and `--metadata` carrying
    // only `notes` used to blank it — along with the category and the bizId
    // — because `asEdgeMetadata` materialises all five keys and the merge
    // spread them.
    const wallet = walletWithMetadata({
      publicAddress: 'bc1qexample',
      metadata: { name: 'Coffee Shop', category: 'Expense:Food', bizId: 7 }
    })
    const info = await buildSpendInfo(
      wallet,
      {
        to: 'bitcoin:bc1qexample?label=Coffee%20Shop',
        nativeAmount: '1000',
        // Cleaned, because that is what the route hands it: `ctx.body` is
        // the cleaned value, and `asEdgeMetadata` is what materialises the
        // four keys the caller never sent. A raw object here cannot
        // reproduce the defect at all — the first version of this case
        // passed one and went green with the fix reverted.
        metadata: asEdgeMetadata({ notes: 'for the beans' })
      },
      { requireAmount: true }
    )
    expect(info.metadata).toStrictEqual({
      name: 'Coffee Shop',
      category: 'Expense:Food',
      bizId: 7,
      notes: 'for the beans'
    })
  })

  it('lets the caller override a field the URI set', async () => {
    const wallet = walletWithMetadata({
      publicAddress: 'bc1qexample',
      metadata: { name: 'From the URI' }
    })
    const info = await buildSpendInfo(
      wallet,
      {
        to: 'bitcoin:bc1qexample',
        nativeAmount: '1000',
        metadata: asEdgeMetadata({ name: 'What the caller said' })
      },
      { requireAmount: true }
    )
    expect(info.metadata).toStrictEqual({ name: 'What the caller said' })
  })
})

/**
 * Where the money goes is the cleaner's rule, so every route has it.
 *
 * `sweep-private-keys` takes `asSweepSpendInfo` and calls
 * `wallet.sweepPrivateKeys` directly, so it never reached the handler helper
 * that used to carry this check — and core drops an address-less target and
 * signs the rest of the transaction regardless. These cases go through the
 * sweep body for that reason: a test on `asSpendInfo` alone would stay green
 * if the rule moved back into the handler.
 */
describe('asSweepSpendInfo targets', () => {
  it('refuses a target with no publicAddress', () => {
    expect(() =>
      asSweepSpendInfo({
        privateKeys: ['xyz'],
        spendTargets: [{ nativeAmount: '1000' }]
      })
    ).toThrow(/publicAddress/)
  })

  it('refuses an empty publicAddress', () => {
    expect(() =>
      asSweepSpendInfo({
        privateKeys: ['xyz'],
        spendTargets: [{ publicAddress: '', nativeAmount: '1000' }]
      })
    ).toThrow(/publicAddress/)
  })

  it('refuses a misspelled publicAddress, which `.withRest` keeps', () => {
    expect(() =>
      asSweepSpendInfo({
        privateKeys: ['xyz'],
        spendTargets: [{ publicAdress: 'bc1qexample', nativeAmount: '1000' }]
      })
    ).toThrow(/publicAddress/)
  })

  it('takes a target that says where the money goes', () => {
    const body = asSweepSpendInfo({
      privateKeys: ['xyz'],
      spendTargets: [{ publicAddress: 'bc1qexample' }]
    })
    expect(body.spendTargets?.[0].publicAddress).toBe('bc1qexample')
  })
})
