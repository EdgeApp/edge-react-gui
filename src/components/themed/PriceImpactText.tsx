import { div, lte, sub } from 'biggystring'
import type { EdgeSwapQuote } from 'edge-core-js'
import * as React from 'react'

import type { GuiExchangeRates } from '../../actions/ExchangeRateActions'
import { formatNumber } from '../../locales/intl'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { convertCurrency } from '../../selectors/WalletSelectors'
import { convertNativeToExchange } from '../../util/utils'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

/** Price impacts at or above this warrant a warning. */
export const PRICE_IMPACT_WARNING_THRESHOLD = 0.05

/**
 * The fiat-value fraction a swap quote loses between its from and to sides
 * (0.05 = 5%), or undefined when it cannot be computed or is not a loss.
 * Works for wallet-to-wallet and swap-to-address quotes alike: the quote's
 * destination wallet (synthetic for swap-to-address) carries the real
 * `currencyConfig`.
 */
export function calculateQuotePriceImpact(
  quote: EdgeSwapQuote,
  exchangeRates: GuiExchangeRates,
  defaultIsoFiat: string
): number | undefined {
  const { request, fromNativeAmount, toNativeAmount } = quote
  const { fromWallet, fromTokenId, toWallet, toTokenId } = request
  if (toWallet == null) return undefined

  const fromExchangeDenom = getExchangeDenom(
    fromWallet.currencyConfig,
    fromTokenId
  )
  const toExchangeDenom = getExchangeDenom(toWallet.currencyConfig, toTokenId)

  const fromExchangeAmount = convertNativeToExchange(
    fromExchangeDenom.multiplier
  )(fromNativeAmount)
  const toExchangeAmount = convertNativeToExchange(toExchangeDenom.multiplier)(
    toNativeAmount
  )

  const fromFiatValue = convertCurrency(
    exchangeRates,
    fromWallet.currencyInfo.pluginId,
    fromTokenId,
    defaultIsoFiat,
    fromExchangeAmount
  )
  const toFiatValue = convertCurrency(
    exchangeRates,
    toWallet.currencyInfo.pluginId,
    toTokenId,
    defaultIsoFiat,
    toExchangeAmount
  )

  if (lte(fromFiatValue, '0')) return undefined

  const impact = parseFloat(
    div(sub(fromFiatValue, toFiatValue), fromFiatValue, 8)
  )
  return impact > 0 ? impact : undefined
}

interface Props {
  priceImpact: number | undefined
}

/**
 * The colored ` (x.xx%)` price-delta suffix shared by the swap confirmation
 * quote card and the send scene's quote row.
 */
export const PriceImpactText: React.FC<Props> = props => {
  const { priceImpact } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  if (priceImpact == null || priceImpact <= 0) return null

  return (
    <EdgeText
      style={
        priceImpact >= 0.15
          ? styles.priceImpactHigh
          : priceImpact >= PRICE_IMPACT_WARNING_THRESHOLD
          ? styles.priceImpactMedium
          : styles.priceImpactLow
      }
    >
      {` (${formatNumber(priceImpact * 100, { toFixed: 2 })}%)`}
    </EdgeText>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  priceImpactLow: {
    color: theme.deactivatedText,
    fontSize: theme.rem(0.75)
  },
  priceImpactMedium: {
    color: theme.warningText,
    fontSize: theme.rem(0.75)
  },
  priceImpactHigh: {
    color: theme.dangerText,
    fontSize: theme.rem(0.75)
  }
}))
