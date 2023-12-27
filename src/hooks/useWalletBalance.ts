import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

/**
 * Subscribes to a specific balance within a wallet.
 */
export function useWalletBalance(wallet: EdgeCurrencyWallet, tokenId: EdgeTokenId): string {
  // The core still reports balances by currency code:
  const [out, setOut] = React.useState<string>(wallet.balanceMap.get(tokenId) ?? '0')

  React.useEffect(() => {
    setOut(wallet.balanceMap.get(tokenId) ?? '0')
    return wallet.watch('balanceMap', balances => setOut(wallet.balanceMap.get(tokenId) ?? '0'))
  }, [wallet, tokenId])

  return out
}
