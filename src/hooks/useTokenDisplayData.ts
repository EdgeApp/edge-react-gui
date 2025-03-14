import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { getExchangeRate } from '../selectors/WalletSelectors'
import { useSelector } from '../types/reactRedux'
import { GuiExchangeRates } from '../types/types'
import { getDenomFromIsoCode } from '../util/utils'

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24

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
  const usdToWalletFiatRate = useSelector(state => getExchangeRate(state, 'iso:USD', isoFiatCurrencyCode))
  const assetFiatPrice = useSelector(state => getExchangeRate(state, currencyCode, isoFiatCurrencyCode))
  const assetFiatYestPrice = useSelector(state => {
    const yesterday = Date.now() - TWENTY_FOUR_HOURS
    return closestRateForTimestamp(state.exchangeRates, currencyCode, yesterday)
  })

  return {
    currencyCode,
    denomination,
    fiatDenomination,
    isoFiatCurrencyCode,
    assetToFiatRate: assetFiatPrice,
    usdToWalletFiatRate,
    assetToYestUsdRate: assetFiatYestPrice
  }
}

export const closestRateForTimestamp = (exchangeRates: GuiExchangeRates, currencyCode: string, timestamp: number): number => {
  // The extra _ at the end means there is a date string at the end of the key
  const filteredPairs = Object.keys(exchangeRates).filter(pair => pair.startsWith(`${currencyCode}_iso:USD_`))

  let bestRate = 0
  let bestDistance = Infinity
  for (const pair of filteredPairs) {
    const [, , date] = pair.split('_')
    const ms = Date.parse(date).valueOf()
    const distance = Math.abs(ms - timestamp)
    if (distance < bestDistance) {
      bestDistance = distance
      bestRate = exchangeRates[pair]
    }
  }
  return bestRate
}
