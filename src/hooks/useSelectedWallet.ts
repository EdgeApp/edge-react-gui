import { EdgeCurrencyWallet } from 'edge-core-js'

import { useWatch } from '../hooks/useWatch'
import { useSelector } from '../types/reactRedux'
import { getTokenId } from '../util/CurrencyInfoHelpers'

export type SelectedWallet = {
  currencyCode: string
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

export function useSelectedWallet(): SelectedWallet | undefined {
  // @ts-expect-error
  const walletId = useSelector(state => state.ui.wallets.selectedWalletId)
  // @ts-expect-error
  const currencyCode = useSelector(state => state.ui.wallets.selectedCurrencyCode)

  // Grab the wallet from the account:
  // @ts-expect-error
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallet = currencyWallets[walletId]
  if (wallet == null) return

  // We cannot use any hooks after the return statement,
  // but we don't need to worry about `allTokens` being stale,
  // because the selected token must exist before being selected,
  // so the selector above will force us to render in any case:
  const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)

  return {
    currencyCode,
    tokenId,
    wallet
  }
}
