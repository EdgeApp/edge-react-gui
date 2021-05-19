// @flow

import type { EdgeMetaToken } from 'edge-core-js'

import { getSpecialCurrencyInfo, PREFERRED_TOKENS } from '../../../constants/WalletAndCurrencyConstants'
import type { CustomTokenInfo } from '../../../types/types'
import * as UTILS from '../../../util/utils'

export type getTokensProps = {
  metaTokens: EdgeMetaToken[],
  customTokens: CustomTokenInfo[],
  currencyCode: string,
  guiWalletType: string
}

export const getTokens = (props: getTokensProps) => {
  const { metaTokens, customTokens, currencyCode, guiWalletType } = props

  const specialCurrencyInfo = getSpecialCurrencyInfo(currencyCode)

  const accountMetaTokenInfo: CustomTokenInfo[] = specialCurrencyInfo.isCustomTokensSupported ? [...customTokens] : []

  const filteredTokenInfo = accountMetaTokenInfo.filter(token => {
    return token.walletType === guiWalletType || token.walletType === undefined
  })

  const combinedTokenInfo = UTILS.mergeTokensRemoveInvisible(metaTokens, filteredTokenInfo)

  const sortedTokenInfo = combinedTokenInfo.sort((a, b) => {
    if (a.currencyCode < b.currencyCode) return -1
    if (a === b) return 0
    return 1
  })

  // put preferred tokens at the top
  for (const cc of PREFERRED_TOKENS) {
    const idx = sortedTokenInfo.findIndex(e => e.currencyCode === cc)
    if (idx > -1) {
      const tokenInfo = sortedTokenInfo[idx]
      sortedTokenInfo.splice(idx, 1)
      sortedTokenInfo.unshift(tokenInfo)
    }
  }

  return sortedTokenInfo
}

export const getFilteredTokens = (searchValue: string, tokens: EdgeMetaToken[]) => {
  const RegexObj = new RegExp(searchValue, 'i')
  return tokens.filter(({ currencyCode, currencyName }) => RegexObj.test(currencyCode) || RegexObj.test(currencyName))
}
