import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { WalletListModal, WalletListResult } from '../components/modals/WalletListModal'
import { Airship } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { NavigationBase } from '../types/routerTypes'
import { BooleanMap, EdgeTokenId } from '../types/types'
import { getCurrencyCode } from '../util/CurrencyInfoHelpers'

// Given a list of assets, shows a modal for a user to pick a wallet for that asset.
// If only one wallet exists for that asset, auto pick that wallet
export const pickWallet = async ({
  account,
  allowedWalletIds,
  assets,
  headerTitle = s.strings.select_wallet,
  navigation,
  showCreateWallet
}: {
  account: EdgeAccount
  allowedWalletIds?: string[]
  assets?: EdgeTokenId[]
  headerTitle?: string
  navigation: NavigationBase
  showCreateWallet?: boolean
}): Promise<WalletListResult | undefined> => {
  const { currencyWallets } = account

  const walletIdMap: BooleanMap = {}

  // Check if user owns any wallets that
  const matchingAssets = (assets ?? []).filter(asset => {
    const matchingWalletIds: string[] = Object.keys(currencyWallets).filter(key => {
      const { pluginId, tokenId } = asset
      const currencyWallet = currencyWallets[key]
      const pluginIdMatch = currencyWallet.currencyInfo.pluginId === pluginId

      // No wallet with matching pluginId, fail this asset
      if (!pluginIdMatch) return false
      if (tokenId == null) {
        walletIdMap[key] = true
        return true
      }
      // See if this wallet has a matching token enabled
      const tokenIdMatch = currencyWallet.enabledTokenIds.find(tid => tokenId)
      if (tokenIdMatch != null) {
        const cc = getCurrencyCode(currencyWallet, tokenIdMatch)
        walletIdMap[`${key}:${cc}`] = true
        return true
      }
      return false
    })
    return matchingWalletIds.length === 0
  })

  if (assets != null && matchingAssets.length === 0) return

  if (assets != null && matchingAssets.length === 1 && Object.keys(walletIdMap).length === 1) {
    // Only one matching wallet and asset. Auto pick the wallet
    const [walletId, currencyCode] = Object.keys(walletIdMap)[0].split(':')
    return { walletId, currencyCode }
  } else {
    const walletListResult = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={navigation}
        headerTitle={headerTitle}
        allowedWalletIds={allowedWalletIds}
        allowedAssets={assets}
        showCreateWallet={showCreateWallet}
      />
    ))
    return walletListResult
  }
}
