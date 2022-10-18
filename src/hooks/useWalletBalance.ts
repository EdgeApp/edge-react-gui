import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

/**
 * Subscribes to a specific balance within a wallet.
 */
export function useWalletBalance(wallet: EdgeCurrencyWallet, tokenId?: string): string {
  // The core still reports balances by currency code:
  const token = tokenId == null ? null : wallet.currencyConfig.allTokens[tokenId]
  const { currencyCode } = token == null ? wallet.currencyInfo : token
  const [out, setOut] = React.useState<string>(wallet.balances[currencyCode] ?? '0')

  React.useEffect(() => {
    setOut(wallet.balances[currencyCode] ?? '0')
    return wallet.watch('balances', balances => setOut(balances[currencyCode] ?? '0'))
  }, [wallet, currencyCode])

  return out
}
