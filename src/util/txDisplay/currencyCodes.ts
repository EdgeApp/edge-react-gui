/**
 * An asset's ticker, looked up through an account rather than a wallet.
 *
 * A swap or a stake names assets by `pluginId` and `tokenId` without a
 * wallet of that currency being loaded, so the code has to come from
 * `account.currencyConfig`.
 *
 * Node-safe, like everything the CLI shares: no react-native, no Redux, no
 * Airship.
 */
import type { EdgeAccount, EdgeTokenId } from 'edge-core-js'

import { reportWarning } from '../reportWarning'

export const getCurrencyCodeWithAccount = (
  account: EdgeAccount,
  pluginId: string,
  tokenId: EdgeTokenId
): string | undefined => {
  if (account.currencyConfig[pluginId] == null) {
    return
  }

  if (tokenId == null) {
    return account.currencyConfig[pluginId].currencyInfo.currencyCode
  }
  if (account.currencyConfig[pluginId].allTokens[tokenId] == null) {
    reportWarning(
      `getCurrencyCodeWithAccount: tokenId: '${tokenId}' not found for pluginId: '${pluginId}'`
    )
    return ''
  }
  return account.currencyConfig[pluginId].allTokens[tokenId].currencyCode
}

/**
 * The currency code a wallet reports for one of its own assets.
 *
 * The wallet-based sibling of `getCurrencyCodeWithAccount`, for a caller that
 * has the wallet rather than the account. Structurally typed, so it needs
 * neither `edge-core-js` nor the GUI's `SPECIAL_CURRENCY_INFO`.
 */
export const currencyCodeForToken = (
  wallet: {
    currencyInfo: { currencyCode: string; pluginId: string }
    currencyConfig: { allTokens: Record<string, { currencyCode: string }> }
  },
  tokenId: string | null
): string => {
  if (tokenId == null) return wallet.currencyInfo.currencyCode
  const token = wallet.currencyConfig.allTokens[tokenId]
  if (token == null) {
    reportWarning(
      `currencyCodeForToken: tokenId: '${tokenId}' not found for wallet pluginId: '${wallet.currencyInfo.pluginId}'`
    )
    return ''
  }
  return token.currencyCode
}
