// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import s from '../locales/strings.js'
import { useWatchWallet } from './useWatch.js'

/**
 * Subscribes to a wallet's name.
 */
export function useWalletName(wallet: EdgeCurrencyWallet): string {
  const name = useWatchWallet(wallet, 'name')
  if (name != null) return name

  return sprintf(s.strings.my_crypto_wallet_name, wallet.currencyInfo.displayName)
}
