import type { EdgeAccount, EdgeTokenId } from 'edge-core-js'

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
    console.warn(
      `getCurrencyCodeWithAccount: tokenId: '${tokenId}' not found for pluginId: '${pluginId}'`
    )
    return ''
  }
  return account.currencyConfig[pluginId].allTokens[tokenId].currencyCode
}
