import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTransaction
} from 'edge-core-js'

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
    denominations: [{ name: 'BTC', multiplier: '100000000' }]
  },
  currencyConfig: {
    allTokens: {},
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      denominations: [{ name: 'BTC', multiplier: '100000000' }]
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
