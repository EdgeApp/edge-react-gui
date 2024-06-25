import { sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { showFullScreenSpinner } from '../components/modals/AirshipFullScreenSpinner'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { getFioStakingBalances } from './stakeUtils'
import { removeIsoPrefix } from './utils'

/**
 * Safely get a wallet name, returning a fallback when the name is null.
 * See `useWalletName` for a hook version of this.
 */
export function getWalletName(wallet: EdgeCurrencyWallet): string {
  const { name } = wallet
  if (name != null) return name

  return sprintf(lstrings.my_crypto_wallet_name, wallet.currencyInfo.displayName)
}

/**
 * Takes any form of fiat currency code and returns a version with and without
 * the "iso:" prefix
 */
export function cleanFiatCurrencyCode(fiatCurrencyCode: string): { fiatCurrencyCode: string; isoFiatCurrencyCode: string } {
  if (fiatCurrencyCode.startsWith('iso:')) {
    return { fiatCurrencyCode: removeIsoPrefix(fiatCurrencyCode), isoFiatCurrencyCode: fiatCurrencyCode }
  } else {
    return { fiatCurrencyCode, isoFiatCurrencyCode: `iso:${fiatCurrencyCode}` }
  }
}

export const getAvailableBalance = (wallet: EdgeCurrencyWallet, tokenId: EdgeTokenId): string => {
  const { pluginId } = wallet.currencyInfo

  let balance = wallet.balanceMap.get(tokenId) ?? '0'
  if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported && tokenId == null) {
    // Special case for FIO mainnet (no token)
    const { locked } = getFioStakingBalances(wallet.stakingStatus)
    balance = sub(balance, locked)
  }
  return balance
}

// TODO: Update to use tokenId. Integrate into the rest of the code base where the deprecated enableTokens is used.
export const enableToken = async (currencyCode: string, wallet: EdgeCurrencyWallet) => {
  const allTokens = wallet.currencyConfig.allTokens
  const newTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode.toUpperCase() === currencyCode.toUpperCase())
  if (newTokenId == null) throw Error(`Could not find token ${currencyCode} to add to ${wallet.currencyInfo.currencyCode} wallet`)

  const enabledTokenIds = wallet.enabledTokenIds
  if (enabledTokenIds.find(enabledTokenId => enabledTokenId === newTokenId) == null)
    await showFullScreenSpinner(lstrings.wallet_list_modal_enabling_token, wallet.changeEnabledTokenIds([...enabledTokenIds, newTokenId]))
}
