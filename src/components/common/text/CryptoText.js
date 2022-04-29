// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useCryptoText } from '../../../hooks/useCryptoText'
import { useSelector } from '../../../types/reactRedux'
import { getAllTokens } from '../../../util/CurrencyInfoHelpers'
import { fixFiatCurrencyCode, getDenomFromIsoCode, zeroString } from '../../../util/utils'

type Props = {
  wallet: EdgeCurrencyWallet,
  tokenId?: string,
  nativeAmount: string
}

/**
 * Returns a cleaned crypto amount string. If no tokenId is given, use the
 * wallet's native currency.
 **/
export const CryptoText = ({ wallet, tokenId, nativeAmount }: Props) => {
  const exchangeRates = useSelector(state => state.exchangeRates)
  const account = useSelector(state => state.core.account)
  const { currencyInfo, fiatCurrencyCode } = wallet
  const nativeCurrencyCode = currencyInfo.currencyCode
  const tokens = getAllTokens(account.currencyConfig[currencyInfo.pluginId])

  // Crypto Amount And Exchange Rate
  let currencyCode, denomination
  if (tokenId == null || nativeCurrencyCode === tokens[tokenId].currencyCode) {
    currencyCode = nativeCurrencyCode
    denomination = currencyInfo.denominations[0]
  } else {
    const token = tokens[tokenId]
    currencyCode = token.currencyCode
    denomination = token.denominations[0]
  }

  const fiatDenomination = getDenomFromIsoCode(fiatCurrencyCode)
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
  const exchangeRate = !zeroString(exchangeRates[rateKey]) ? exchangeRates[rateKey] : '1'

  return useCryptoText({
    nativeAmount,
    exchangeRate,
    fiatDenomination,
    denomination,
    tokenId
  })
}
