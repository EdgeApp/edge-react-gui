// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useSelector } from '../types/reactRedux'
import { fixFiatCurrencyCode, getDenomFromIsoCode, getYesterdayDateRoundDownHour, zeroString } from '../util/utils'

/**
 * Returns data from tokens relevant for display
 * */

export const useTokenDisplayData = (props: { tokenId?: string, wallet: EdgeCurrencyWallet }) => {
  const { tokenId, wallet } = props
  const { currencyConfig, currencyInfo } = wallet
  const { allTokens } = currencyConfig
  const isoFiatCurrencyCode = fixFiatCurrencyCode(wallet.fiatCurrencyCode)

  // Get currencyCode and deomination from token
  const { currencyCode, denominations } = tokenId == null ? currencyInfo : allTokens[tokenId]
  const [denomination] = denominations
  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)

  // Exchange Rates
  // BASE / QUOTE = PRICE, where:
  // - 'Fiat' is the QUOTE, defined by the wallet's fiatCurrencyCode
  // - 'Yest' is an index for a historical price from 24 hours ago.
  const usdFiatPrice = useSelector(state => state.exchangeRates[`iso:USD_${isoFiatCurrencyCode}`])
  const assetFiatPrice = useSelector(state => state.exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`])
  const assetFiatYestPrice = useSelector(state => state.exchangeRates[`${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`])

  return {
    currencyCode,
    denomination,
    fiatDenomination,
    isoFiatCurrencyCode,
    assetToFiatRate: !zeroString(assetFiatPrice) ? assetFiatPrice : '1',
    usdToWalletFiatRate: !zeroString(usdFiatPrice) ? usdFiatPrice : '1',
    assetToYestFiatRate: !zeroString(assetFiatYestPrice) ? assetFiatYestPrice : '1'
  }
}
