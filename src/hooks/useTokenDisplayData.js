// @flow

import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'

import { useSelector } from '../types/reactRedux'
import { getAllTokens } from '../util/CurrencyInfoHelpers'
import { fixFiatCurrencyCode, getDenomFromIsoCode, getYesterdayDateRoundDownHour, zeroString } from '../util/utils'

/**
 * Returns data from tokens relevant for display
 * */

export const useTokenDisplayData = (props: { account: EdgeAccount, tokenId?: string, wallet: EdgeCurrencyWallet }) => {
  const { account, tokenId, wallet } = props
  const { currencyInfo } = wallet
  const nativeCurrencyCode = currencyInfo.currencyCode
  const tokens = getAllTokens(account.currencyConfig[currencyInfo.pluginId])

  // Get currencyCode and deomination from token
  let currencyCode, denomination
  if (tokenId == null || nativeCurrencyCode === tokens[tokenId].currencyCode) {
    currencyCode = nativeCurrencyCode
    denomination = currencyInfo.denominations[0]
  } else {
    const token = tokens[tokenId]
    currencyCode = token.currencyCode
    denomination = token.denominations[0]
  }

  // Fiat Codes
  const fiatCurrencyCode = wallet.fiatCurrencyCode
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)

  // Rate table keys
  const assetToIsoFiatKey = `${currencyCode}_${isoFiatCurrencyCode}`
  const assetToYestIsoFiatKey = `${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`

  // Exchange rates (prices)
  // TODO: For structuring data and/or naming, consider following established exchange conventions of:
  // Base / Quote = Price (denominated in quote currency)
  // Ex: BTC / USD = $XXX USD
  // Ex: ETH / BTC = ₿XXX BTC
  // -Jontz
  const usdToWalletFiatRate = useSelector(state => state.exchangeRates[`iso:USD_${isoFiatCurrencyCode}`])
  const assetToFiatRateRaw = useSelector(state => state.exchangeRates[assetToIsoFiatKey])
  const assetToFiatRate = !zeroString(assetToFiatRateRaw) ? assetToFiatRateRaw : '1'
  const assetToYestFiatRate = useSelector(state => state.exchangeRates[assetToYestIsoFiatKey])

  const fiatDenomination = getDenomFromIsoCode(fiatCurrencyCode)

  return {
    currencyCode,
    denomination,
    fiatDenomination,
    isoFiatCurrencyCode,
    assetToFiatRate,
    usdToWalletFiatRate: !zeroString(usdToWalletFiatRate) ? usdToWalletFiatRate : '1',
    assetToYestFiatRate: !zeroString(assetToYestFiatRate) ? assetToYestFiatRate : '1'
  }
}
