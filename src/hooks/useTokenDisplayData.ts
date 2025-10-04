import type { EdgeCurrencyConfig, EdgeTokenId } from 'edge-core-js'

import {
  getExchangeRate,
  getFiatExchangeRate
} from '../selectors/WalletSelectors'
import { useSelector } from '../types/reactRedux'
import { getDenomFromIsoCode } from '../util/utils'

/**
 * Returns data from tokens relevant for display
 * TODO: Break this up once crypto & fiat text display logic is centralized into the appropriate text hooks/components. The order of operations should always be as follows:
 * 1. Numeric calculations
 * 2. Display Denomination
 * 3. Localization: commas, decimals, spaces
 * */

export const useTokenDisplayData = (props: {
  tokenId: EdgeTokenId
  currencyConfig: EdgeCurrencyConfig
}) => {
  const { tokenId, currencyConfig } = props
  const { allTokens } = currencyConfig
  const isoFiatCurrencyCode = useSelector(
    state => state.ui.settings.defaultIsoFiat
  )

  // Get currencyCode and denomination from token
  const token = tokenId != null ? allTokens[tokenId] : null
  const { currencyCode, denominations } = token ?? currencyConfig.currencyInfo
  const [denomination] = denominations
  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)

  // Exchange Rates
  // BASE / QUOTE = PRICE, where:
  // - 'Fiat' is the QUOTE, defined by the wallet's fiatCurrencyCode
  // - 'Yest' is an index for a historical price from 24 hours ago.
  const usdToWalletFiatRate = useSelector(state =>
    getFiatExchangeRate(state, 'iso:USD', isoFiatCurrencyCode)
  )
  const assetFiatPrice = useSelector(
    state =>
      getExchangeRate(
        state.exchangeRates,
        currencyConfig.currencyInfo.pluginId,
        tokenId,
        isoFiatCurrencyCode
      ) ?? 0
  )
  const assetFiatYestPrice = useSelector(state => {
    return (
      state.exchangeRates.crypto[currencyConfig.currencyInfo.pluginId]?.[
        tokenId ?? ''
      ]?.['iso:USD']?.yesterday ?? 0
    )
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
