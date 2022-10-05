import { EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import s from '../locales/strings'
import { useWatch } from './useWatch'

/**
 * Subscribes to a wallet's name.
 */
export function useWalletName(wallet: EdgeCurrencyWallet): string {
  const name = useWatch(wallet, 'name')
  if (name != null) return name

  return sprintf(s.strings.my_crypto_wallet_name, wallet.currencyInfo.displayName)
}
