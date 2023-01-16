import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { WalletListModal, WalletListResult } from '../components/modals/WalletListModal'
import { Airship } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { NavigationBase } from '../types/routerTypes'
import { EdgeTokenId } from '../types/types'

// Given a list of assets, shows a modal for a user to pick a wallet for that asset
export const pickWallet = async ({
  account,
  assets,
  headerTitle = s.strings.select_wallet,
  navigation
}: {
  account: EdgeAccount
  assets: EdgeTokenId[]
  headerTitle?: string
  navigation: NavigationBase
}): Promise<WalletListResult | undefined> => {
  const { currencyWallets } = account

  // Check if user owns any wallets that are accepted by the invoice
  const matchingAssets = assets.filter(asset => {
    const matchingWalletIds: string[] = Object.keys(currencyWallets).filter(key => {
      const { pluginId, tokenId } = asset
      const currencyWallet = currencyWallets[key]
      const pluginIdMatch = currencyWallet.currencyInfo.pluginId === pluginId

      // No wallet with matching pluginId, fail this asset
      if (!pluginIdMatch) return false
      if (tokenId == null) return true
      // See if this wallet has a matching token enabled
      const tokenIdMatch = currencyWallet.enabledTokenIds.find(tid => tokenId)
      return tokenIdMatch != null
    })
    return matchingWalletIds.length === 0
  })

  if (matchingAssets.length === 0) return

  const walletListResult = await Airship.show<WalletListResult>(bridge => (
    <WalletListModal bridge={bridge} navigation={navigation} headerTitle={headerTitle} allowedAssets={assets} />
  ))
  return walletListResult
}
