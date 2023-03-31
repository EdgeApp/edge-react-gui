import { EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'
import { useWatch } from './useWatch'

/**
 * Subscribes to a wallet's name.
 * See `getWalletName` for a non-hook version of this.
 */
export function useWalletName(wallet: EdgeCurrencyWallet): string {
  const name = useWatch(wallet, 'name')
  if (name != null) return name

  return sprintf(lstrings.my_crypto_wallet_name, wallet.currencyInfo.displayName)
}
