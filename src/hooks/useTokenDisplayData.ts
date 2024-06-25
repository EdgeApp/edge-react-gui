import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { useSelector } from '../types/reactRedux'
import { getDenomFromIsoCode, zeroString } from '../util/utils'

/**
 * Returns data from tokens relevant for display
 * TODO: Break this up once crypto & fiat text display logic is centralized into the appropriate text hooks/components. The order of operations should always be as follows:
 * 1. Numeric calculations
 * 2. Display Denomination
 * 3. Localization: commas, decimals, spaces
 * */

export const useTokenDisplayData = (props: { tokenId: EdgeTokenId; wallet: EdgeCurrencyWallet }) => {
  const { tokenId, wallet } = props
  const { currencyConfig, currencyInfo } = wallet
  const { allTokens } = currencyConfig
  const isoFiatCurrencyCode = useSelector(state => state.ui.settings.defaultIsoFiat)

  // Get currencyCode and denomination from token
  const token = tokenId != null ? allTokens[tokenId] : null
  const { currencyCode, denominations } = token != null ? token : currencyInfo
  const [denomination] = denominations
  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)

  // Exchange Rates
  // BASE / QUOTE = PRICE, where:
  // - 'Fiat' is the QUOTE, defined by the wallet's fiatCurrencyCode
  // - 'Yest' is an index for a historical price from 24 hours ago.
  const usdFiatPrice = useSelector(state => state.exchangeRates[`iso:USD_${isoFiatCurrencyCode}`])
  const assetFiatPrice = useCurrencyFiatRate({ currencyCode, isoFiatCurrencyCode })
  const assetFiatYestPrice = useSelector(state => {
    // The extra _ at the end means there is yesterday's date string at the end of the key
    const pair = Object.keys(state.exchangeRates).find(pair => pair.includes(`${currencyCode}_iso:USD_`))
    if (pair != null) return state.exchangeRates[pair]
    return '0'
  })

  return {
    currencyCode,
    denomination,
    fiatDenomination,
    isoFiatCurrencyCode,
    assetToFiatRate: !zeroString(assetFiatPrice) ? assetFiatPrice : '0',
    usdToWalletFiatRate: !zeroString(usdFiatPrice) ? usdFiatPrice : '0',
    assetToYestFiatRate: !zeroString(assetFiatYestPrice) ? assetFiatYestPrice : '0'
  }
}

export const useCurrencyFiatRate = ({ currencyCode, isoFiatCurrencyCode }: { currencyCode?: string; isoFiatCurrencyCode?: string }): string => {
  return useSelector(state => {
    if (currencyCode == null || isoFiatCurrencyCode == null) return '0'
    else return state.exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`]
  })
}
