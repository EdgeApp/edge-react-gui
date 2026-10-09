import { describe, expect, it, jest } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTransaction,
  EdgeTxAction
} from 'edge-core-js'

import { BTC_DENOM } from '../../util/fake/fakeDisklet'
import { joinCategory, splitCategory } from '../../util/txDisplay/category'
import {
  fillTxMetadataForDisplay,
  getTxActionDisplayInfo
} from '../../util/txDisplay/displayInfo'

describe('splitCategory', () => {
  it('reads each known prefix, case-insensitively', () => {
    expect(splitCategory('Expense:Food')).toStrictEqual({
      category: 'expense',
      subcategory: 'Food'
    })
    expect(splitCategory('expense:Food')).toStrictEqual({
      category: 'expense',
      subcategory: 'Food'
    })
    expect(splitCategory('Transfer:')).toStrictEqual({
      category: 'transfer',
      subcategory: ''
    })
    expect(splitCategory('Income:Gift')).toStrictEqual({
      category: 'income',
      subcategory: 'Gift'
    })
    expect(splitCategory('Exchange:Swap')).toStrictEqual({
      category: 'exchange',
      subcategory: 'Swap'
    })
  })

  it('matches a bare category name with no colon', () => {
    expect(splitCategory('Expense')).toStrictEqual({
      category: 'expense',
      subcategory: ''
    })
  })

  it('replaces an unrecognised prefix and keeps the user text whole', () => {
    // Nothing of an unrecognised string is a category this code knows, and
    // all of it is text a user, a dapp or `--metadata` put there. Slicing at
    // the first colon destroyed it: `TransactionDetailsScene` round-trips
    // this pair through `joinCategory`, so opening and saving such a
    // transaction wrote the `Shopping` segment away.
    expect(splitCategory('Shopping:Food')).toStrictEqual({
      category: 'income',
      subcategory: 'Shopping:Food'
    })
    expect(splitCategory('Foo:bar')).toStrictEqual({
      category: 'income',
      subcategory: 'Foo:bar'
    })
    // A bare word is the user's own text, not a category name, and used to
    // come back with the internally appended colon still on it.
    expect(splitCategory('plain')).toStrictEqual({
      category: 'income',
      subcategory: 'plain'
    })
  })

  it('honours the default category for the fallback', () => {
    expect(splitCategory('Foo:bar', 'expense')).toStrictEqual({
      category: 'expense',
      subcategory: 'Foo:bar'
    })
  })

  it('takes an empty or absent category', () => {
    expect(splitCategory('')).toStrictEqual({
      category: 'income',
      subcategory: ''
    })
    expect(splitCategory()).toStrictEqual({
      category: 'income',
      subcategory: ''
    })
  })
})

describe('joinCategory', () => {
  it('round-trips every known prefix', () => {
    for (const full of [
      'Transfer:Move',
      'Exchange:Swap',
      'Expense:Food',
      'Income:Gift'
    ]) {
      expect(joinCategory(splitCategory(full))).toBe(full)
    }
  })

  it('capitalises the prefix the way the GUI writes it', () => {
    expect(joinCategory(splitCategory('expense:food'))).toBe('Expense:food')
  })
})

/**
 * `getTxActionDisplayInfo` reads only `wallet.id`, `wallet.currencyInfo`,
 * `wallet.currencyConfig.allTokens`, `account.currencyWallets` and
 * `account.currencyConfig` — that last one through
 * `getCurrencyCodeWithAccount`, which is why the stub below supplies it. So
 * a stub is enough and no core is needed.
 */
const wallet: EdgeCurrencyWallet = {
  id: 'w1',
  currencyInfo: {
    pluginId: 'bitcoin',
    currencyCode: 'BTC',
    assetDisplayName: 'Bitcoin',
    denominations: [BTC_DENOM]
  },
  currencyConfig: {
    // One token, so the `tokenId != null` arms of
    // `getCurrencyCodeWithAccount` and `currencyCodeForToken` are reachable:
    // with an empty map every swap and stake asset this suite drives had
    // `tokenId: null`, so both of those arms — including each one's
    // warn-and-`''` for a token the config does not know — ran in no test,
    // on either side of the extraction. A token swap and a token export are
    // the ordinary case.
    allTokens: { tok1: { currencyCode: 'WBTC' } },
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      denominations: [BTC_DENOM]
    }
  },
  fiatCurrencyCode: 'iso:USD'
} as unknown as EdgeCurrencyWallet

const account = {
  currencyWallets: { w1: wallet },
  currencyConfig: { bitcoin: wallet.currencyConfig }
} as unknown as EdgeAccount

function tx(over: Partial<EdgeTransaction>): EdgeTransaction {
  return {
    txid: 'abc',
    date: 1600000000,
    currencyCode: 'BTC',
    tokenId: null,
    nativeAmount: '-10000',
    networkFee: '100',
    blockHeight: 1,
    isSend: true,
    memos: [],
    ourReceiveAddresses: [],
    signedTx: '',
    walletId: 'w1',
    ...over
  } as unknown as EdgeTransaction
}

describe('getTxActionDisplayInfo', () => {
  it('reads a plain send as an expense, and a receive as income', () => {
    const sent = getTxActionDisplayInfo(tx({}), account, wallet)
    expect(sent.direction).toBe('send')
    expect(splitCategory(sent.mergedData.category ?? '').category).toBe(
      'expense'
    )

    const received = getTxActionDisplayInfo(
      tx({ nativeAmount: '10000', isSend: false }),
      account,
      wallet
    )
    expect(received.direction).toBe('receive')
    expect(splitCategory(received.mergedData.category ?? '').category).toBe(
      'income'
    )
  })

  it('treats a zero-amount send as a send', () => {
    const zero = getTxActionDisplayInfo(
      tx({ nativeAmount: '0', isSend: true }),
      account,
      wallet
    )
    expect(zero.direction).toBe('send')
  })

  it('derives an exchange category from a swap action', () => {
    const swap = getTxActionDisplayInfo(
      tx({
        savedAction: {
          actionType: 'swap',
          swapInfo: {
            pluginId: 'fakeswap',
            displayName: 'Fake Swap',
            supportEmail: 'a@b.c'
          },
          fromAsset: { pluginId: 'bitcoin', tokenId: null },
          toAsset: { pluginId: 'bitcoin', tokenId: null },
          payoutAddress: 'addr',
          payoutWalletId: 'w1'
        },
        assetAction: { assetActionType: 'swap' }
      }),
      account,
      wallet
    )
    expect(splitCategory(swap.mergedData.category ?? '').category).toBe(
      'exchange'
    )
    expect(swap.action?.actionType).toBe('swap')
    expect(swap.assetAction?.assetActionType).toBe('swap')
  })

  it('names the stake plugin for a stake action', () => {
    const stake = getTxActionDisplayInfo(
      tx({
        savedAction: {
          actionType: 'stake',
          pluginId: 'bitcoin',
          stakeAssets: [{ pluginId: 'bitcoin', tokenId: null }]
        },
        assetAction: { assetActionType: 'stake' }
      }),
      account,
      wallet
    )
    expect(stake.action?.actionType).toBe('stake')
    expect(stake.mergedData.name).not.toBe('')
  })

  it('keeps what the user wrote over anything derived', () => {
    const edited = getTxActionDisplayInfo(
      tx({
        metadata: {
          name: 'My payee',
          notes: 'My note',
          category: 'Income:Pay'
        },
        savedAction: {
          actionType: 'stake',
          pluginId: 'bitcoin',
          stakeAssets: [{ pluginId: 'bitcoin', tokenId: null }]
        },
        assetAction: { assetActionType: 'stake' }
      }),
      account,
      wallet
    )
    expect(edited.mergedData.name).toBe('My payee')
    expect(edited.mergedData.notes).toBe('My note')
    expect(edited.mergedData.category).toBe('Income:Pay')
    // The derived values are still reported separately, so a caller can show
    // both.
    expect(edited.userData.name).toBe('My payee')
    expect(edited.savedData.name).not.toBe('My payee')
  })

  // One case per outer `actionType`, because the derivation is a published
  // response contract — `get-transactions` returns `category`, `name` and
  // `notes` from it — and only `swap`/`swap` and `stake`/`stake` above ran.
  // `fiat` is the only arm with nested `fiatPlugin` / `fiatAsset` /
  // `cryptoAsset`, `giftCard` reads `provider` and `card`, and
  // `tokenApproval` appeared only as the *losing* `chainAction` below, so its
  // own arm was never entered.
  describe('every actionType arm', () => {
    const asset = { pluginId: 'bitcoin', tokenId: null }

    const fiatAction = (): EdgeTxAction => ({
      actionType: 'fiat',
      orderId: 'order-1',
      isEstimate: false,
      fiatPlugin: { providerId: 'p', providerDisplayName: 'Provider P' },
      fiatAsset: { fiatCurrencyCode: 'iso:USD', fiatAmount: '10.00' },
      cryptoAsset: { ...asset, nativeAmount: '1000' }
    })

    it('reads a fiat buy as exchange income naming the fiat', () => {
      const info = getTxActionDisplayInfo(
        tx({
          savedAction: fiatAction(),
          assetAction: { assetActionType: 'buy' }
        }),
        account,
        wallet
      )
      const { category, subcategory } = splitCategory(
        info.mergedData.category ?? ''
      )
      expect(category).toBe('exchange')
      expect(subcategory).toContain('USD')
      expect(info.direction).toBe('receive')
      // `displayName` in this arm is the asset's, not the provider's, so the
      // payee reads "Buy <asset>" — which is what the GUI row and the REST
      // response both show.
      expect(info.mergedData.name).toBe('Buy Bitcoin')
    })

    it('reads a fiat sell as exchange expense naming the fiat', () => {
      const info = getTxActionDisplayInfo(
        tx({
          savedAction: fiatAction(),
          assetAction: { assetActionType: 'sell' }
        }),
        account,
        wallet
      )
      const { category, subcategory } = splitCategory(
        info.mergedData.category ?? ''
      )
      expect(category).toBe('exchange')
      expect(subcategory).toContain('USD')
      expect(info.direction).toBe('send')
      expect(info.mergedData.name).toBe('Sell Bitcoin')
    })

    it('reads a fiat sell network fee as an expense', () => {
      const info = getTxActionDisplayInfo(
        tx({
          savedAction: fiatAction(),
          assetAction: { assetActionType: 'sellNetworkFee' }
        }),
        account,
        wallet
      )
      expect(splitCategory(info.mergedData.category ?? '').category).toBe(
        'expense'
      )
      expect(info.direction).toBe('send')
    })

    it('reads a token approval as an expense', () => {
      const info = getTxActionDisplayInfo(
        tx({
          savedAction: {
            actionType: 'tokenApproval',
            tokenApproved: asset,
            tokenContractAddress: 'a',
            contractAddress: 'b'
          },
          assetAction: { assetActionType: 'tokenApproval' }
        }),
        account,
        wallet
      )
      expect(splitCategory(info.mergedData.category ?? '').category).toBe(
        'expense'
      )
    })

    it('names the card for a gift card, whatever the assetActionType', () => {
      // The one outer arm with no inner switch, so the card name is the
      // subcategory for every asset action under it.
      const info = getTxActionDisplayInfo(
        tx({
          savedAction: {
            actionType: 'giftCard',
            orderId: 'order-2',
            provider: { providerId: 'p', displayName: 'Provider P' },
            card: {
              name: 'Example card',
              fiatAmount: '25.00',
              fiatCurrencyCode: 'iso:USD'
            }
          },
          assetAction: { assetActionType: 'buy' }
        }),
        account,
        wallet
      )
      const { category, subcategory } = splitCategory(
        info.mergedData.category ?? ''
      )
      expect(category).toBe('expense')
      expect(subcategory).toBe('Example card')
      expect(info.direction).toBe('send')
    })

    it('falls back for an assetActionType its arm does not handle', () => {
      // The `unsupported` path: a saved action whose asset action is not one
      // of its own cases must still produce a usable category rather than an
      // empty one.
      const info = getTxActionDisplayInfo(
        tx({
          savedAction: fiatAction(),
          assetAction: { assetActionType: 'stake' }
        }),
        account,
        wallet
      )
      expect(info.mergedData.category ?? '').not.toBe('')
    })
  })

  it('prefers savedAction over chainAction', () => {
    const both = getTxActionDisplayInfo(
      tx({
        savedAction: {
          actionType: 'stake',
          pluginId: 'bitcoin',
          stakeAssets: []
        },
        chainAction: {
          actionType: 'tokenApproval',
          tokenApproved: { pluginId: 'bitcoin', tokenId: null },
          tokenContractAddress: 'a',
          contractAddress: 'b'
        }
      }),
      account,
      wallet
    )
    expect(both.action?.actionType).toBe('stake')
  })
})

describe('fillTxMetadataForDisplay', () => {
  it('overlays the three display fields and keeps the rest', () => {
    const original = tx({
      metadata: { exchangeAmount: { 'iso:USD': 12 }, bizId: 7, name: 'old' }
    })
    const filled = fillTxMetadataForDisplay(original, {
      name: 'new',
      category: 'Expense:Food',
      notes: 'why'
    })
    expect(filled.metadata).toStrictEqual({
      exchangeAmount: { 'iso:USD': 12 },
      bizId: 7,
      name: 'new',
      category: 'Expense:Food',
      notes: 'why'
    })
    // Not persisted, and the original is untouched.
    expect(original.metadata?.name).toBe('old')
  })
})

/**
 * One case per inner `assetActionType` arm, because each writes a different
 * answer.
 *
 * The outer `actionType` arms are covered above; the inner switches were
 * sampled — `swap`/`swap` and `stake`/`stake` — leaving 12 of the 20
 * `assetActionType` values the engine accepts never reaching their arm. Each
 * dark one produces a different `category`, `subcategory` or `direction`
 * than its neighbours, and this is a published response contract:
 * `get-transactions` returns it and `TransactionListRow` renders it.
 */
describe('every assetActionType arm', () => {
  const btc = { pluginId: 'bitcoin', tokenId: null }
  /** The stub's one token, so a token asset is reachable. */
  const tok = { pluginId: 'bitcoin', tokenId: 'tok1' }
  /** A second wallet, so `payoutWalletId` can name one that is not `w1`. */
  const otherWallet = {
    id: 'w2',
    name: 'Savings',
    currencyInfo: wallet.currencyInfo,
    currencyConfig: wallet.currencyConfig,
    fiatCurrencyCode: 'iso:USD'
  } as unknown as EdgeCurrencyWallet
  const twoWalletAccount = {
    currencyWallets: { w1: wallet, w2: otherWallet },
    currencyConfig: { bitcoin: wallet.currencyConfig }
  } as unknown as EdgeAccount

  const swapAction = (over: object = {}): EdgeTxAction =>
    ({
      actionType: 'swap',
      swapInfo: {
        pluginId: 'fakeswap',
        displayName: 'Fake Swap',
        supportEmail: 'a@b.c'
      },
      fromAsset: btc,
      toAsset: btc,
      payoutAddress: 'addr',
      payoutWalletId: 'w1',
      ...over
    } as unknown as EdgeTxAction)

  const stakeAction = (assets: Array<typeof btc>): EdgeTxAction =>
    ({
      actionType: 'stake',
      pluginId: 'bitcoin',
      stakeAssets: assets
    } as unknown as EdgeTxAction)

  const read = (
    action: EdgeTxAction,
    assetActionType: string,
    useAccount: EdgeAccount = account
  ): {
    category: string
    subcategory: string
    direction: string
    notes?: string
  } => {
    const info = getTxActionDisplayInfo(
      tx({
        savedAction: action,
        assetAction: {
          assetActionType
        } as unknown as EdgeTransaction['assetAction']
      }),
      useAccount,
      wallet
    )
    const split = splitCategory(info.mergedData.category ?? '')
    return { ...split, direction: info.direction, notes: info.mergedData.notes }
  }

  it('reads a swap transfer as a transfer naming the payout wallet', () => {
    // The one arm that looks a wallet *name* up through the account, so a
    // payout to another wallet reads differently from one to this wallet.
    const toOther = read(
      swapAction({ payoutWalletId: 'w2' }),
      'transfer',
      twoWalletAccount
    )
    expect(toOther.category).toBe('transfer')
    expect(toOther.subcategory).toContain('Savings')

    const toSelf = read(swapAction({ payoutWalletId: 'w1' }), 'transfer')
    expect(toSelf.category).toBe('transfer')
    // Not the other wallet's name, and the "from" wording rather than "to".
    expect(toSelf.subcategory).not.toContain('Savings')
    expect(toSelf.subcategory).not.toBe(toOther.subcategory)
  })

  it('reads both swap network fees as expenses', () => {
    for (const type of ['transferNetworkFee', 'swapNetworkFee']) {
      const fee = read(swapAction(), type)
      expect(fee.category).toBe('expense')
      expect(fee.subcategory).not.toBe('')
    }
  })

  it('reads a swap order post and cancel as sends', () => {
    const post = read(swapAction(), 'swapOrderPost')
    const cancel = read(swapAction(), 'swapOrderCancel')
    for (const one of [post, cancel]) {
      expect(one.category).toBe('expense')
      expect(one.direction).toBe('send')
    }
    // Different wording, which is the only thing telling them apart in a row.
    expect(post.subcategory).not.toBe(cancel.subcategory)
  })

  it('reads a swap order fill like a swap, and which way it went', () => {
    // `fromAsset` matching this wallet's asset means the wallet is the
    // source, so the transaction is a send.
    const out = read(swapAction(), 'swapOrderFill')
    expect(out.category).toBe('exchange')
    expect(out.direction).toBe('send')

    const inbound = read(
      swapAction({ fromAsset: { pluginId: 'ethereum', tokenId: null } }),
      'swapOrderFill'
    )
    expect(inbound.direction).toBe('receive')
    expect(inbound.subcategory).not.toBe(out.subcategory)
  })

  it('reads a one-asset and a two-asset stake differently', () => {
    const one = read(stakeAction([btc]), 'stake')
    const two = read(stakeAction([btc, btc]), 'stake')
    expect(one.category).toBe('transfer')
    expect(two.category).toBe('transfer')
    expect(one.direction).toBe('send')
    expect(one.subcategory).not.toBe(two.subcategory)
  })

  it('leaves a stake with an unsupported number of assets uncategorised', () => {
    // Three assets is the `console.warn` arm: it breaks out before setting a
    // category, so the send default stands rather than a wrong stake label.
    const many = read(stakeAction([btc, btc, btc]), 'stake')
    expect(many.category).toBe('expense')
    expect(many.subcategory).toBe('')
  })

  it('reads a stake order as an expense with notes', () => {
    const order = read(stakeAction([btc]), 'stakeOrder')
    expect(order.category).toBe('expense')
    expect(order.direction).toBe('send')
    expect(order.notes ?? '').not.toBe('')
  })

  it('names a one-asset and a two-asset stake order differently', () => {
    // Each count picks its own published string — `…_notes_2s` against
    // `…_1s` — so what a two-asset stake order is *called* in the details
    // scene, in the list row and in a `get-transactions` response was
    // decided by an arm no case entered.
    const one = read(stakeAction([btc]), 'stakeOrder')
    const two = read(stakeAction([btc, btc]), 'stakeOrder')
    expect(two.notes ?? '').not.toBe('')
    expect(two.notes).not.toBe(one.notes)
  })

  it('names a one-asset and a two-asset claim differently', () => {
    const one = read(stakeAction([btc]), 'claim')
    const two = read(stakeAction([btc, btc]), 'claim')
    expect(two.category).toBe('transfer')
    expect(two.subcategory).not.toBe(one.subcategory)
  })

  it('names a one-asset and a two-asset unstake differently', () => {
    const one = read(stakeAction([btc]), 'unstake')
    const two = read(stakeAction([btc, btc]), 'unstake')
    expect(two.category).toBe('transfer')
    expect(two.subcategory).not.toBe(one.subcategory)
  })

  it('leaves an asset-action type it does not know uncategorised', () => {
    // The switch's own `default`, which nothing reached: a `savedAction` of
    // a kind this version knows paired with an `assetActionType` it does
    // not. The send default stands rather than a label from the wrong arm.
    const unknown = read(stakeAction([btc]), 'somethingNew')
    expect(unknown.category).toBe('expense')
    expect(unknown.subcategory).toBe('')
  })

  it('names a one-asset claim order and unstake order', () => {
    // The pair above is only ever entered with two assets, so the one-asset
    // side is the dark one here.
    for (const type of ['claimOrder', 'unstakeOrder']) {
      const one = read(stakeAction([btc]), type)
      const two = read(stakeAction([btc, btc]), type)
      expect(one.category).toBe('expense')
      expect(one.notes ?? '').not.toBe('')
      expect(one.notes).not.toBe(two.notes)
    }
  })

  it('reads a claim as a transfer, receive when every asset is ours', () => {
    const ours = read(stakeAction([btc]), 'claim')
    expect(ours.category).toBe('transfer')
    expect(ours.direction).toBe('receive')

    const foreign = read(
      stakeAction([{ pluginId: 'ethereum', tokenId: null }]),
      'claim'
    )
    expect(foreign.direction).toBe('send')
  })

  it('reads an unstake as a transfer the wallet receives', () => {
    const unstake = read(stakeAction([btc]), 'unstake')
    expect(unstake.category).toBe('transfer')
    expect(unstake.direction).toBe('receive')
  })

  it('reads a claim order and an unstake order as expenses with notes', () => {
    for (const type of ['claimOrder', 'unstakeOrder']) {
      const order = read(stakeAction([btc, btc]), type)
      expect(order.category).toBe('expense')
      expect(order.direction).toBe('send')
      expect(order.notes ?? '').not.toBe('')
    }
  })

  it('reads both stake network fees as expenses', () => {
    for (const type of ['stakeNetworkFee', 'unstakeNetworkFee']) {
      const fee = read(stakeAction([btc]), type)
      expect(fee.category).toBe('expense')
      expect(fee.subcategory).not.toBe('')
    }
  })

  it('leaves every stake arm uncategorised for an unsupported count', () => {
    // The `console.error` arms the finding named: each breaks out before
    // setting its category, so the send default stands rather than a label
    // built from the wrong number of assets. One per arm, because each is
    // its own copy of the same three-way test.
    for (const type of [
      'stakeOrder',
      'claim',
      'unstake',
      'claimOrder',
      'unstakeOrder'
    ]) {
      const many = read(stakeAction([btc, btc, btc]), type)
      expect(many.category).toBe('expense')
      expect(many.subcategory).toBe('')
      expect(many.notes ?? '').toBe('')
    }
  })

  it('falls back for a swap whose asset action is not one of its own', () => {
    // The `swap` arm's own `default`, which only an asset action from
    // another family reaches.
    const odd = read(swapAction(), 'tokenApproval')
    expect(odd.category).not.toBe('')
  })

  it('falls back for an actionType with no arm at all', () => {
    const odd = read(
      { actionType: 'somethingNew' } as unknown as EdgeTxAction,
      'buy'
    )
    expect(odd.category).not.toBe('')
  })

  it('falls back for a token approval whose asset action is something else', () => {
    // `tokenApproval`'s `default` arm, which is the only way into the
    // unsupported path for that outer case.
    const odd = read(
      {
        actionType: 'tokenApproval',
        tokenApproved: btc,
        tokenContractAddress: 'a',
        contractAddress: 'b'
      } as unknown as EdgeTxAction,
      'stake'
    )
    expect(odd.category).not.toBe('')
  })

  it('names a token asset by its code, and an unknown one as empty', () => {
    // `getCurrencyCodeWithAccount` is how `displayInfo` names the assets of
    // a swap or a stake, and a token swap is the ordinary case. The `''` for
    // a token the config no longer carries is the deliberate contract — not
    // an untested fallback — so both answers are pinned here.
    const known = read(swapAction({ toAsset: tok }), 'swap')
    expect(known.subcategory).toContain('WBTC')
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const unknown = read(
        swapAction({ toAsset: { pluginId: 'bitcoin', tokenId: 'nope' } }),
        'swap'
      )
      // Still a row, with the asset unnamed rather than the whole
      // derivation failing.
      expect(unknown.category).not.toBe('')
    } finally {
      warn.mockRestore()
    }
  })

  it('names the payout currency from a legacy swapData', () => {
    // The pre-`EdgeTxAction` shape, still on old transactions: no action at
    // all, and the payee comes from `swapData.payoutCurrencyCode`.
    const info = getTxActionDisplayInfo(
      tx({
        swapData: {
          isEstimate: false,
          payoutAddress: 'addr',
          payoutCurrencyCode: 'ETH',
          payoutNativeAmount: '1',
          payoutWalletId: 'w2',
          plugin: { pluginId: 'fakeswap', displayName: 'Fake Swap' }
        }
      } as unknown as Partial<EdgeTransaction>),
      account,
      wallet
    )
    expect(info.mergedData.name ?? '').toContain('ETH')
  })
})
