// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useEffect, useState } from '../types/reactHooks.js'

/**
 * Subscribes to a specific balance within a wallet.
 */
export function useWalletBalance(wallet: EdgeCurrencyWallet, tokenId?: string): string {
  // The core still reports balances by currency code:
  const { currencyCode } = tokenId == null ? wallet.currencyInfo : wallet.currencyConfig.allTokens[tokenId]
  const [out, setOut] = useState<string>(wallet.balances[currencyCode] ?? '0')

  useEffect(() => {
    setOut(wallet.balances[currencyCode] ?? '0')
    return wallet.watch('balances', balances => setOut(balances[currencyCode] ?? '0'))
  }, [wallet, currencyCode])

  return out
}
