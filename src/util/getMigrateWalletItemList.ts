import type { EdgeCurrencyWallet } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import type { WalletCreateItem } from '../selectors/getCreateWalletList'
import { getCurrencyCode, isKeysOnlyPlugin } from './CurrencyInfoHelpers'
import { getWalletName } from './CurrencyWalletHelpers'
import { zeroString } from './utils'

export interface MigrateWalletItem extends WalletCreateItem {
  createWalletId: string
}

/**
 * Assets the user can migrate: non-zero balances on wallets that support the
 * migrate flow (same rules as MigrateWalletSelectCryptoScene).
 */
export function getMigrateWalletItemList(
  currencyWallets: Readonly<Record<string, EdgeCurrencyWallet>> | undefined
): MigrateWalletItem[] {
  if (currencyWallets == null) return []
  let list: MigrateWalletItem[] = []
  for (const walletId of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[walletId]
    const {
      currencyInfo: { pluginId, walletType },
      balanceMap,
      enabledTokenIds
    } = wallet

    if (isKeysOnlyPlugin(pluginId)) continue
    if (SPECIAL_CURRENCY_INFO[pluginId]?.isAccountActivationRequired === true)
      continue
    if (pluginId === 'ripple') continue

    const walletAssetList: MigrateWalletItem[] = []
    for (const [tokenId, bal] of Array.from(balanceMap.entries())) {
      if (zeroString(bal)) continue
      if (tokenId != null && !enabledTokenIds.includes(tokenId)) continue
      const currencyCode = getCurrencyCode(wallet, tokenId)
      walletAssetList.push({
        type: 'create',
        createWalletId: walletId,
        currencyCode,
        displayName: getWalletName(wallet),
        key: `${walletId}:${tokenId ?? 'PARENT_TOKEN'}`,
        pluginId,
        tokenId,
        walletType
      })
    }
    list = [...list, ...walletAssetList]
  }
  return list
}
