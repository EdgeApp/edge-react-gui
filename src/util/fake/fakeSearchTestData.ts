import type {
  EdgeCurrencyInfo,
  EdgeCurrencyWallet,
  EdgeToken
} from 'edge-core-js'

import type { WalletCreateItem } from '../../selectors/getCreateWalletList'
import type { WalletListItem } from '../../types/types'

/**
 * Creates a minimal EdgeCurrencyInfo for testing.
 * Use this to create custom chain configurations (e.g., Base, Arbitrum).
 * For standard chains, prefer importing from fakeBtcInfo.ts or fakeEthInfo.ts.
 */
export const makeTestCurrencyInfo = (
  overrides: Partial<EdgeCurrencyInfo> = {}
): EdgeCurrencyInfo => ({
  pluginId: 'ethereum',
  currencyCode: 'ETH',
  displayName: 'Ethereum',
  assetDisplayName: 'Ethereum',
  chainDisplayName: 'Ethereum',
  walletType: 'wallet:ethereum',
  addressExplorer: '',
  transactionExplorer: '',
  denominations: [{ name: 'ETH', multiplier: '1000000000000000000' }],
  ...overrides
})

/**
 * Creates a minimal EdgeCurrencyWallet mock for testing.
 */
export const makeTestWallet = (
  currencyInfo: EdgeCurrencyInfo,
  name: string = 'My Wallet'
): EdgeCurrencyWallet =>
  ({
    id: `wallet-${currencyInfo.pluginId}`,
    currencyInfo,
    name,
    balanceMap: new Map(),
    enabledTokenIds: []
  } as unknown as EdgeCurrencyWallet)

/**
 * Creates a WalletListItem for testing.
 */
export const makeTestWalletListItem = (
  wallet: EdgeCurrencyWallet,
  token?: EdgeToken
): WalletListItem => ({
  type: 'asset',
  key: token != null ? `${wallet.id}-${token.currencyCode}` : wallet.id,
  wallet,
  token,
  tokenId: token?.networkLocation?.contractAddress ?? null
})

/**
 * Creates a WalletCreateItem for testing.
 */
export const makeTestCreateWalletItem = (
  overrides: Partial<WalletCreateItem>
): WalletCreateItem => ({
  type: 'create',
  key: 'create-wallet',
  currencyCode: 'ETH',
  displayName: 'Ethereum',
  pluginId: 'ethereum',
  tokenId: null,
  ...overrides
})

// Pre-configured test tokens
export const testTetherToken: EdgeToken = {
  currencyCode: 'USDT',
  displayName: 'Tether',
  denominations: [{ name: 'USDT', multiplier: '1000000' }],
  networkLocation: {
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
  }
}

export const testWstethToken: EdgeToken = {
  currencyCode: 'WSTETH',
  displayName: 'Wrapped stETH',
  denominations: [{ name: 'WSTETH', multiplier: '1000000000000000000' }],
  networkLocation: {
    contractAddress: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'
  }
}
