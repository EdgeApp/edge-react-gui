// @flow
import { type EdgeCurrencyWallet } from 'edge-core-js'

export const getSeed = (wallet: EdgeCurrencyWallet): string => {
  if (wallet.displayPrivateSeed == null) throw new Error('Cannot stake with a read-only wallet')
  return wallet.displayPrivateSeed
}
