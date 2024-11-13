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

/** @deprecated - Use `enableTokens()` instead */
export const enableTokenCurrencyCode = async (currencyCode: string, wallet: EdgeCurrencyWallet) => {
  const allTokens = wallet.currencyConfig.allTokens
  const newTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode.toUpperCase() === currencyCode.toUpperCase())
  if (newTokenId == null) throw Error(`Could not find token ${currencyCode} to add to ${wallet.currencyInfo.currencyCode} wallet`)

  await enableTokens([newTokenId], wallet)
}

/**
 * Enables tokens in a wallet, if not already enabled.
 * - If some tokens are not yet enabled, shows a full screen spinner while they
 * get enabled.
 * - If the tokens are all already enabled, this function call is a noop.
 */
export const enableTokens = async (newTokenIds: EdgeTokenId[], wallet: EdgeCurrencyWallet) => {
  const { enabledTokenIds, currencyConfig } = wallet
  const { allTokens } = currencyConfig

  const tokensToEnable = Object.keys(allTokens).filter(
    tokenId => newTokenIds.filter(newTokenId => newTokenId != null).includes(tokenId) && !enabledTokenIds.includes(tokenId)
  )

  if (tokensToEnable.length > 0)
    await showFullScreenSpinner(lstrings.wallet_list_modal_enabling_token, wallet.changeEnabledTokenIds([...enabledTokenIds, ...tokensToEnable]))
}
