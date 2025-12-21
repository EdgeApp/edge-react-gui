import { describe, expect, test } from '@jest/globals'
import type { EdgeToken } from 'edge-core-js'

import { searchWalletList } from '../components/services/SortedWalletList'
import { filterWalletCreateItemListBySearchText } from '../selectors/getCreateWalletList'
import type { WalletListItem } from '../types/types'
import { btcCurrencyInfo } from '../util/fake/fakeBtcInfo'
import { ethCurrencyInfo } from '../util/fake/fakeEthInfo'
import {
  makeTestCreateWalletItem,
  makeTestCurrencyInfo,
  makeTestWallet,
  makeTestWalletListItem,
  testTetherToken,
  testWstethToken
} from '../util/fake/fakeSearchTestData'

// -----------------------------------------------------------------------------
// searchWalletList Tests
// -----------------------------------------------------------------------------

describe('searchWalletList', () => {
  // Use existing fake currency infos where possible
  const ethereumWallet = makeTestWallet(ethCurrencyInfo, 'My Ethereum')
  const bitcoinWallet = makeTestWallet(btcCurrencyInfo, 'BTC Savings')

  // Create custom chain configurations for L2s
  const baseInfo = makeTestCurrencyInfo({
    pluginId: 'base',
    currencyCode: 'ETH',
    displayName: 'Ethereum',
    assetDisplayName: 'Ethereum',
    chainDisplayName: 'Base'
  })
  const baseWallet = makeTestWallet(baseInfo, 'Base L2')

  const testWalletList: WalletListItem[] = [
    makeTestWalletListItem(ethereumWallet),
    makeTestWalletListItem(baseWallet),
    makeTestWalletListItem(bitcoinWallet),
    makeTestWalletListItem(ethereumWallet, testTetherToken),
    makeTestWalletListItem(ethereumWallet, testWstethToken)
  ]

  describe('empty search', () => {
    test('returns all items when search is empty', () => {
      const result = searchWalletList(testWalletList, '')
      expect(result).toHaveLength(5)
    })

    test('returns all items when search is only whitespace', () => {
      const result = searchWalletList(testWalletList, '   ')
      expect(result).toHaveLength(5)
    })
  })

  describe('single word search', () => {
    test('matches currencyCode from beginning (startsWith)', () => {
      const result = searchWalletList(testWalletList, 'btc')
      // Should match only Bitcoin (currencyCode starts with "btc")
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.currencyCode === 'BTC'
      ).toBe(true)
    })

    test('matches displayName from beginning (startsWith)', () => {
      const result = searchWalletList(testWalletList, 'bit')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.currencyCode === 'BTC'
      ).toBe(true)
    })

    test('does NOT match displayName in middle (startsWith behavior)', () => {
      // "steth" is in "WSTETH" but not at start of displayName "Wrapped stETH"
      const result = searchWalletList(testWalletList, 'steth')
      expect(result).toHaveLength(0)
    })

    test('matches chainDisplayName anywhere (includes behavior)', () => {
      const result = searchWalletList(testWalletList, 'base')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.pluginId === 'base'
      ).toBe(true)
    })

    test('matches wallet name anywhere (includes behavior)', () => {
      // Searching wallet name returns the wallet AND all its tokens
      const result = searchWalletList(testWalletList, 'savings')
      expect(result).toHaveLength(1) // Just BTC wallet (no tokens)
      expect(
        result[0].type === 'asset' && result[0].wallet.name === 'BTC Savings'
      ).toBe(true)
    })

    test('wallet name search includes tokens on that wallet', () => {
      // "ethereum" in wallet name "My Ethereum" matches wallet + its tokens
      const result = searchWalletList(testWalletList, 'my ethereum')
      expect(result).toHaveLength(3) // Mainnet + USDT + WSTETH
      expect(
        result.every(r => r.type === 'asset' && r.wallet.name === 'My Ethereum')
      ).toBe(true)
    })

    test('matches contract address anywhere (includes behavior)', () => {
      // Search for partial contract address
      const result = searchWalletList(testWalletList, 'dac17f')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' && result[0].token?.currencyCode === 'USDT'
      ).toBe(true)
    })
  })

  describe('multi-word search (AND logic)', () => {
    test('all words must match (base eth)', () => {
      const result = searchWalletList(testWalletList, 'base eth')
      // "base" matches chainDisplayName, "eth" matches currencyCode
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.pluginId === 'base'
      ).toBe(true)
    })

    test('order does not matter (eth base)', () => {
      const result = searchWalletList(testWalletList, 'eth base')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.pluginId === 'base'
      ).toBe(true)
    })

    test('returns nothing if one word does not match', () => {
      const result = searchWalletList(testWalletList, 'base btc')
      expect(result).toHaveLength(0)
    })

    test('multiple terms can match different fields', () => {
      // "btc" matches currencyCode, "savings" matches wallet name
      const result = searchWalletList(testWalletList, 'btc savings')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.currencyCode === 'BTC'
      ).toBe(true)
    })

    test('handles multiple spaces between words', () => {
      const result = searchWalletList(testWalletList, 'base   eth')
      expect(result).toHaveLength(1)
    })
  })

  describe('case insensitivity', () => {
    test('matches regardless of case', () => {
      const resultLower = searchWalletList(testWalletList, 'eth')
      const resultUpper = searchWalletList(testWalletList, 'ETH')
      const resultMixed = searchWalletList(testWalletList, 'EtH')
      expect(resultLower).toHaveLength(resultUpper.length)
      expect(resultLower).toHaveLength(resultMixed.length)
    })
  })

  describe('assetDisplayName matching', () => {
    test('matches assetDisplayName from beginning for mainnet assets', () => {
      // Use a wallet with a non-Ethereum name to isolate assetDisplayName matching
      const isolatedInfo = makeTestCurrencyInfo({
        pluginId: 'arbitrum',
        currencyCode: 'ETH',
        displayName: 'Ethereum',
        assetDisplayName: 'Ethereum',
        chainDisplayName: 'Arbitrum'
      })
      const isolatedWallet = makeTestWallet(isolatedInfo, 'Arbitrum Wallet')
      const isolatedList: WalletListItem[] = [
        makeTestWalletListItem(isolatedWallet)
      ]

      const result = searchWalletList(isolatedList, 'ethereum')
      expect(result).toHaveLength(1)
      expect(result[0].type === 'asset' && result[0].token == null).toBe(true)
    })

    test('tokens do not match via parent assetDisplayName', () => {
      // Create a wallet with non-matching name to test assetDisplayName isolation
      const isolatedWallet = makeTestWallet(ethCurrencyInfo, 'Savings')
      const token: EdgeToken = {
        currencyCode: 'USDC',
        displayName: 'USD Coin',
        denominations: [{ name: 'USDC', multiplier: '1000000' }],
        networkLocation: { contractAddress: '0xa0b8...' }
      }
      const isolatedList: WalletListItem[] = [
        makeTestWalletListItem(isolatedWallet, token)
      ]

      // "ethereum" should NOT match USDC token (assetDisplayName is only for mainnet)
      const result = searchWalletList(isolatedList, 'ethereum')
      expect(result).toHaveLength(0)
    })
  })

  describe('loading wallets', () => {
    test('filters out loading wallets', () => {
      const listWithLoading: WalletListItem[] = [
        ...testWalletList,
        { type: 'loading', key: 'loading-1', walletId: 'wallet-loading' }
      ]
      const result = searchWalletList(listWithLoading, 'eth')
      expect(result.every(r => r.type === 'asset')).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('handles special characters in search', () => {
      const result = searchWalletList(testWalletList, '0x')
      // Should match contract addresses
      expect(result.length).toBeGreaterThan(0)
    })

    test('returns empty array when no matches', () => {
      const result = searchWalletList(testWalletList, 'xyz123notfound')
      expect(result).toHaveLength(0)
    })

    test('handles empty wallet list', () => {
      const result = searchWalletList([], 'eth')
      expect(result).toHaveLength(0)
    })
  })
})

// -----------------------------------------------------------------------------
// filterWalletCreateItemListBySearchText Tests
// -----------------------------------------------------------------------------

describe('filterWalletCreateItemListBySearchText', () => {
  const testCreateList = [
    makeTestCreateWalletItem({
      key: 'create-ethereum',
      currencyCode: 'ETH',
      displayName: 'Ethereum',
      assetDisplayName: 'Ethereum',
      pluginId: 'ethereum',
      walletType: 'wallet:ethereum'
    }),
    makeTestCreateWalletItem({
      key: 'create-base',
      currencyCode: 'ETH',
      displayName: 'Base',
      assetDisplayName: 'Ethereum',
      pluginId: 'base',
      walletType: 'wallet:base'
    }),
    makeTestCreateWalletItem({
      key: 'create-bitcoin',
      currencyCode: 'BTC',
      displayName: 'Bitcoin',
      assetDisplayName: 'Bitcoin',
      pluginId: 'bitcoin',
      walletType: 'wallet:bitcoin'
    }),
    makeTestCreateWalletItem({
      key: 'create-usdt',
      currencyCode: 'USDT',
      displayName: 'Tether',
      pluginId: 'ethereum',
      tokenId: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      networkLocation: {
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
      }
    }),
    makeTestCreateWalletItem({
      key: 'create-wsteth',
      currencyCode: 'WSTETH',
      displayName: 'Wrapped stETH',
      pluginId: 'ethereum',
      tokenId: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
      networkLocation: {
        contractAddress: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'
      }
    })
  ]

  describe('empty search', () => {
    test('returns all items when search is empty', () => {
      const result = filterWalletCreateItemListBySearchText(testCreateList, '')
      expect(result).toHaveLength(5)
    })

    test('returns all items when search is only whitespace', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        '   '
      )
      expect(result).toHaveLength(5)
    })
  })

  describe('single word search with startsWith', () => {
    test('matches currencyCode from beginning', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'eth'
      )
      // ETH matches from start, but USDT (Tether) should not match "eth"
      const codes = result.map(r => r.currencyCode)
      expect(codes).toContain('ETH')
      expect(codes).not.toContain('USDT') // "eth" is in "tether" but not at start
    })

    test('matches displayName from beginning', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'bit'
      )
      expect(result).toHaveLength(1)
      expect(result[0].currencyCode).toBe('BTC')
    })

    test('does NOT match in middle (startsWith for currencyCode)', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'steth'
      )
      // "steth" should not match "WSTETH" as currencyCode doesn't start with it
      // nor "Wrapped stETH" as displayName doesn't start with it
      expect(result).toHaveLength(0)
    })

    test('matches assetDisplayName from beginning', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'ethereum'
      )
      // Ethereum mainnet and Base both have assetDisplayName "Ethereum"
      expect(result).toHaveLength(2)
    })
  })

  describe('pluginId search (includes, mainnet only)', () => {
    test('matches pluginId for mainnet items', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'base'
      )
      expect(result).toHaveLength(1)
      expect(result[0].pluginId).toBe('base')
    })

    test('does NOT match pluginId for token items', () => {
      // "ethereum" as pluginId should only match mainnet items
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'ethereum'
      )
      // Should match Ethereum mainnet (pluginId and displayName), Base (assetDisplayName)
      // But NOT tokens even though they have pluginId: 'ethereum'
      expect(result.every(r => r.walletType != null)).toBe(true)
    })
  })

  describe('networkLocation search (includes)', () => {
    test('matches contract address anywhere', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'dac17f'
      )
      expect(result).toHaveLength(1)
      expect(result[0].currencyCode).toBe('USDT')
    })
  })

  describe('multi-word search (AND logic)', () => {
    test('all words must match', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'base eth'
      )
      // "base" matches pluginId/displayName, "eth" matches currencyCode
      expect(result).toHaveLength(1)
      expect(result[0].pluginId).toBe('base')
    })

    test('returns nothing if one word does not match', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'base btc'
      )
      expect(result).toHaveLength(0)
    })

    test('handles multiple spaces', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'base   eth'
      )
      expect(result).toHaveLength(1)
    })
  })

  describe('case insensitivity', () => {
    test('matches regardless of case', () => {
      const resultLower = filterWalletCreateItemListBySearchText(
        testCreateList,
        'btc'
      )
      const resultUpper = filterWalletCreateItemListBySearchText(
        testCreateList,
        'BTC'
      )
      expect(resultLower).toHaveLength(resultUpper.length)
    })
  })

  describe('edge cases', () => {
    test('handles empty create list', () => {
      const result = filterWalletCreateItemListBySearchText([], 'eth')
      expect(result).toHaveLength(0)
    })

    test('returns empty when no matches', () => {
      const result = filterWalletCreateItemListBySearchText(
        testCreateList,
        'xyz123notfound'
      )
      expect(result).toHaveLength(0)
    })
  })
})

// -----------------------------------------------------------------------------
// Regression Tests for Original Issues
// -----------------------------------------------------------------------------

describe('Regression: Original search issues', () => {
  describe('Issue #1: Multi-word search "base eth"', () => {
    const baseEthInfo = makeTestCurrencyInfo({
      pluginId: 'base',
      currencyCode: 'ETH',
      displayName: 'Ethereum',
      assetDisplayName: 'Ethereum',
      chainDisplayName: 'Base'
    })
    const baseWallet = makeTestWallet(baseEthInfo)
    const walletList: WalletListItem[] = [makeTestWalletListItem(baseWallet)]

    test('finds Ethereum wallet on Base network with "base eth"', () => {
      const result = searchWalletList(walletList, 'base eth')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.pluginId === 'base' &&
          result[0].wallet.currencyInfo.currencyCode === 'ETH'
      ).toBe(true)
    })
  })

  describe('Issue #3: "eth" showing Tether', () => {
    const ethereumWallet = makeTestWallet(ethCurrencyInfo)
    const tetherToken: EdgeToken = {
      currencyCode: 'USDT',
      displayName: 'Tether',
      denominations: [{ name: 'USDT', multiplier: '1000000' }],
      networkLocation: { contractAddress: '0xdac17f...' }
    }

    const walletList: WalletListItem[] = [
      makeTestWalletListItem(ethereumWallet),
      makeTestWalletListItem(ethereumWallet, tetherToken)
    ]

    test('"eth" shows Ethereum but NOT Tether', () => {
      const result = searchWalletList(walletList, 'eth')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' &&
          result[0].wallet.currencyInfo.currencyCode === 'ETH'
      ).toBe(true)
    })

    test('"teth" shows Tether (starts with "teth")', () => {
      const result = searchWalletList(walletList, 'teth')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' && result[0].token?.currencyCode === 'USDT'
      ).toBe(true)
    })

    test('"usdt" shows Tether', () => {
      const result = searchWalletList(walletList, 'usdt')
      expect(result).toHaveLength(1)
      expect(
        result[0].type === 'asset' && result[0].token?.currencyCode === 'USDT'
      ).toBe(true)
    })
  })
})
