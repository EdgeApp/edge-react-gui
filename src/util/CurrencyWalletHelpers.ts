import { sub } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { showFullScreenSpinner } from '../components/modals/AirshipFullScreenSpinner'
import { SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'

/**
 * Safely get a wallet name, returning a fallback when the name is null.
 * See `useWalletName` for a hook version of this.
 */
export function getWalletName(wallet: EdgeCurrencyWallet): string {
  const { name } = wallet
  if (name != null) return name

  return sprintf(lstrings.my_crypto_wallet_name, wallet.currencyInfo.displayName)
}

export function getWalletFiat(wallet: EdgeCurrencyWallet): { fiatCurrencyCode: string; isoFiatCurrencyCode: string } {
  const { fiatCurrencyCode } = wallet
  return { fiatCurrencyCode: fiatCurrencyCode.replace('iso:', ''), isoFiatCurrencyCode: fiatCurrencyCode }
}

export const getAvailableBalance = (wallet: EdgeCurrencyWallet, tokenCode?: string): string => {
  const { currencyCode, pluginId } = wallet.currencyInfo
  const cCode = tokenCode ?? currencyCode
  let balance = wallet.balances[cCode] ?? '0'
  if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported) {
    const lockedBalance = wallet.balances[`${cCode}${STAKING_BALANCES.locked}`] ?? '0'
    balance = sub(balance, lockedBalance)
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
