import { useQuery } from '@tanstack/react-query'

import type { WalletListWalletResult } from '../components/modals/WalletListModal'
import { useSelector } from '../types/reactRedux'
import { useWatch } from './useWatch'

interface UseRampsPersistedCryptoSelectionResult {
  selection?: WalletListWalletResult
  isLoading: boolean
}

export const useRampLastCryptoSelection =
  (): UseRampsPersistedCryptoSelectionResult => {
    const account = useSelector(state => state.core.account)
    const currencyWallets = useWatch(account, 'currencyWallets')

    const rampLastCryptoSelection = useSelector(
      state => state.ui.settings.rampLastCryptoSelection
    )

    const { data: allWalletsReady = false } = useQuery<boolean>({
      queryKey: ['waitForAllWallets', account?.id],
      queryFn: async () => {
        if (account == null) return false
        await account.waitForAllWallets()
        return true
      },
      enabled: account != null,
      staleTime: Infinity,
      gcTime: 300000,
      refetchOnWindowFocus: false
    })

    if (rampLastCryptoSelection == null) {
      return { selection: undefined, isLoading: false }
    }

    const { walletId, tokenId } = rampLastCryptoSelection

    if (currencyWallets[walletId] == null) {
      // Before we know wallet readiness, keep loading state true
      if (!allWalletsReady) return { selection: undefined, isLoading: true }
      // Otherwise we know there is not wallet for the selection (invalid
      // selection state).
      return { selection: undefined, isLoading: false }
    }

    return {
      selection: {
        type: 'wallet',
        walletId,
        tokenId
      },
      isLoading: false
    }
  }
