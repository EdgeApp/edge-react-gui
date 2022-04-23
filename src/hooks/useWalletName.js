// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import s from '../locales/strings.js'
import { useEffect, useState } from '../types/reactHooks'

/**
 * Subscribes to a wallet's name.
 */
export function useWalletName(wallet: EdgeCurrencyWallet): string {
  const [name, setName] = useState(wallet.name)

  useEffect(() => {
    setName(wallet.name)
    return wallet.watch('name', setName)
  }, [wallet])

  return name ?? sprintf(s.strings.my_crypto_wallet_name, wallet.currencyInfo.displayName)
}
