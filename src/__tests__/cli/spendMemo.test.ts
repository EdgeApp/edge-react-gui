import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeMemoOption } from 'edge-core-js'

import {
  assertMemosUsable,
  buildSpendInfo,
  memoFromUri
} from '../../cli/engine/routes/spend'
import { asEdgeMetadata, asSweepSpendInfo } from '../../cli/engine/schemas'

/**
 * A URI's `uniqueIdentifier` has to become the kind of memo its chain wants.
 *
 * A hard-coded `text` would be irreversible rather than merely wrong: on XRP
 * the destination tag would go into `payment.Memos` and leave
 * `payment.DestinationTag` unset, so the payment would broadcast
 * successfully and an exchange crediting on that field could not credit it.
 * Nothing would refuse it, because `text` *is* one of XRP's memo options,
 * just not the first one.
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
    // Zano's shape: the same rule, with hex first.
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
    // The default for a chain with nothing to go on: the plugin is what
    // refuses it.
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
 * code would mix two assets. XRP's multiplier is 1e6 and RLUSD's is 1e18, so
 * `?amount=5` against the token would become 0.000000000005 of it, signed
 * and broadcast, because core and the plugin both trust `nativeAmount` as
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
 * Through `buildSpendInfo`, not through the helper: asserting
 * `withoutUndefined` directly would test the mechanism rather than the
 * behaviour, and pass whatever the caller actually gets.
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
    // A BIP21 `?label=` becomes `metadata.name`. `asEdgeMetadata`
    // materialises all five keys, so a merge that spread them would let
    // `--metadata` carrying only `notes` blank it, along with the category
    // and the bizId.
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
        // four keys the caller never sent. A raw object here would pass
        // whether or not the merge blanks them.
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
 * `wallet.sweepPrivateKeys` directly, so it never reaches the spend
 * handlers' helpers, and core drops an address-less target and signs the
 * rest of the transaction regardless. These cases go through the sweep body
 * for that reason: a test on `asSpendInfo` alone would stay green if the
 * rule moved into a handler.
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

  it('refuses a misspelled publicAddress, naming the typo', () => {
    // The target is exact, so the misspelling is refused as itself rather
    // than as a missing `publicAddress`.
    expect(() =>
      asSweepSpendInfo({
        privateKeys: ['xyz'],
        spendTargets: [{ publicAdress: 'bc1qexample', nativeAmount: '1000' }]
      })
    ).toThrow(/Unknown field "publicAdress"/)
  })

  it('takes a target that says where the money goes', () => {
    const body = asSweepSpendInfo({
      privateKeys: ['xyz'],
      spendTargets: [{ publicAddress: 'bc1qexample' }]
    })
    expect(body.spendTargets?.[0].publicAddress).toBe('bc1qexample')
  })
})

/**
 * Memos a caller writes by hand, on `spend`, `make-spend` and
 * `sweep-private-keys`.
 *
 * Core's `upgradeMemos` does not check their shape, and the XRP engine
 * ignores `{"type":"Number",…}` or `{"type":"tag",…}`, so an unchecked memo
 * would broadcast the payment with no `DestinationTag`: a deposit credited
 * to nobody, irreversibly.
 */
describe('caller-supplied memos', () => {
  it('refuses a memo kind core does not define', () => {
    for (const type of ['Number', 'tag', 'destination tag']) {
      expect(() =>
        asSweepSpendInfo({
          privateKeys: ['xyz'],
          memos: [{ type, value: '1' }]
        })
      ).toThrow()
    }
  })

  it('refuses a memo with no value', () => {
    expect(() =>
      asSweepSpendInfo({
        privateKeys: ['xyz'],
        memos: [{ type: 'number', valu: '12345' }]
      })
    ).toThrow()
  })

  it('refuses a kind this chain does not take, before signing', () => {
    expect(() => {
      assertMemosUsable(fakeWallet(XRP_OPTIONS), [{ type: 'hex', value: 'ab' }])
    }).toThrow(/takes no hex memo/)
  })

  it('applies the option’s own limits', () => {
    expect(() => {
      assertMemosUsable(fakeWallet(XRP_OPTIONS), [
        { type: 'number', value: '4294967296' }
      ])
    }).toThrow(/not usable/)
  })

  it('takes a destination tag the chain can apply', () => {
    expect(() => {
      assertMemosUsable(fakeWallet(XRP_OPTIONS), [
        { type: 'number', value: '12345', memoName: 'destination tag' }
      ])
    }).not.toThrow()
  })

  it('refuses a destination tag on the target itself', () => {
    // Core clears a target-level `memo` without applying it on a chain that
    // declares no `memoType`, which is every account-based one.
    for (const target of [
      { publicAddress: 'rXYZ', nativeAmount: '1', memo: '12345' },
      { publicAddress: 'rXYZ', nativeAmount: '1', uniqueIdentifier: '12345' },
      {
        publicAddress: 'rXYZ',
        nativeAmount: '1',
        otherParams: { uniqueIdentifier: '12345' }
      }
    ]) {
      expect(() =>
        asSweepSpendInfo({ privateKeys: ['xyz'], spendTargets: [target] })
      ).toThrow(/spendInfo\.memos/)
    }
  })

  it('refuses an out-of-range tag on the spend path itself', async () => {
    // The guard wired in, not only the guard: `buildSpendInfo`'s
    // `spendInfo` branch is where spend and make-spend reach it.
    const wallet = {
      ...fakeWallet(XRP_OPTIONS),
      currencyConfig: { allTokens: {} }
    } as unknown as EdgeCurrencyWallet
    await expect(
      buildSpendInfo(
        wallet,
        {
          spendInfo: {
            spendTargets: [{ publicAddress: 'rXYZ', nativeAmount: '1' }],
            memos: [{ type: 'number', value: '4294967296' }]
          }
        } as any,
        { requireAmount: true }
      )
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('leaves a chain with no declared options to its plugin', () => {
    expect(() => {
      assertMemosUsable(fakeWallet([]), [{ type: 'hex', value: 'zz' }])
    }).not.toThrow()
  })
})
