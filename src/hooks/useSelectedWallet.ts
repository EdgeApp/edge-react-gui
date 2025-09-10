import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { useWatch } from '../hooks/useWatch'
import { useSelector } from '../types/reactRedux'

export interface SelectedWallet {
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
}

export function useSelectedWallet(): SelectedWallet | undefined {
  const walletId = useSelector(state => state.ui.wallets.selectedWalletId)
  const tokenId = useSelector(state => state.ui.wallets.selectedTokenId)

  // Grab the wallet from the account:
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallet = currencyWallets[walletId]
  if (wallet == null) return

  return {
    tokenId,
    wallet
  }
}
