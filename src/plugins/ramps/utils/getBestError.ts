import { sprintf } from 'sprintf-js'

import { I18nError } from '../../../components/cards/ErrorCard'
import { formatNumber } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import type { FiatDirection } from '../../gui/fiatPluginTypes'
import {
  FiatProviderError,
  type FiatProviderQuoteError,
  type FiatProviderQuoteErrorTypes
} from '../../gui/fiatProviderTypes'

const ERROR_PRIORITIES: Record<FiatProviderQuoteErrorTypes, number> = {
  underLimit: 1,
  overLimit: 2,
  paymentUnsupported: 3,
  regionRestricted: 4,
  assetUnsupported: 5,
  fiatUnsupported: 6,
  amountTypeUnsupported: 7
}

export const getBestQuoteError = (
  quoteErrors: unknown[],
  quoteCurrencyCode: string,
  quoteDirection: FiatDirection
): I18nError | unknown => {
  let bestFiatProviderError: FiatProviderQuoteError | undefined

  for (const error of quoteErrors) {
    if (error instanceof FiatProviderError) {
      const fiatProviderQuoteError = error.quoteError
      if (fiatProviderQuoteError == null) continue

      if (bestFiatProviderError == null) {
        bestFiatProviderError = fiatProviderQuoteError
        continue
      }

      if (
        ERROR_PRIORITIES[fiatProviderQuoteError.errorType] <
        ERROR_PRIORITIES[bestFiatProviderError.errorType]
      ) {
        bestFiatProviderError = fiatProviderQuoteError
        continue
      }

      if (
        ERROR_PRIORITIES[fiatProviderQuoteError.errorType] ===
        ERROR_PRIORITIES[bestFiatProviderError.errorType]
      ) {
        if (
          fiatProviderQuoteError.errorType === 'overLimit' &&
          bestFiatProviderError.errorType === 'overLimit'
        ) {
          if (
            (fiatProviderQuoteError.errorAmount ?? 0) >
            (bestFiatProviderError.errorAmount ?? 0)
          ) {
            bestFiatProviderError = fiatProviderQuoteError
          }
        } else if (
          fiatProviderQuoteError.errorType === 'underLimit' &&
          bestFiatProviderError.errorType === 'underLimit'
        ) {
          if (
            (fiatProviderQuoteError.errorAmount ?? Infinity) <
            (bestFiatProviderError.errorAmount ?? Infinity)
          ) {
            bestFiatProviderError = fiatProviderQuoteError
          }
        }
      }
    }
  }

  if (bestFiatProviderError != null) {
    const title =
      quoteDirection === 'buy'
        ? lstrings.trade_buy_unavailable_title
        : lstrings.trade_sell_unavailable_title
    const message = getErrorText(
      bestFiatProviderError,
      quoteCurrencyCode,
      quoteDirection
    )

    return new I18nError(title, message)
  }

  return new AggregateError(
    quoteErrors,
    'All plugins failed with unknown errors'
  )
}

const getErrorText = (
  error: FiatProviderQuoteError,
  quoteCurrencyCode: string,
  quoteDirection: FiatDirection
): string => {
  let errorText = ''

  switch (error.errorType) {
    case 'underLimit':
      if (quoteDirection === 'buy') {
        errorText =
          error.errorAmount == null
            ? lstrings.fiat_plugin_buy_amount_under_undef_limit
            : sprintf(
                lstrings.fiat_plugin_buy_amount_under_limit,
                `${formatNumber(error.errorAmount.toString())} ${
                  error.displayCurrencyCode ?? quoteCurrencyCode
                }`
              )
      } else {
        errorText =
          error.errorAmount == null
            ? lstrings.fiat_plugin_sell_amount_under_undef_limit
            : sprintf(
                lstrings.fiat_plugin_sell_amount_under_limit,
                `${formatNumber(error.errorAmount.toString())} ${
                  error.displayCurrencyCode ?? quoteCurrencyCode
                }`
              )
      }
      break
    case 'overLimit':
      if (quoteDirection === 'buy') {
        errorText =
          error.errorAmount == null
            ? lstrings.fiat_plugin_buy_amount_over_undef_limit
            : sprintf(
                lstrings.fiat_plugin_buy_amount_over_limit,
                `${formatNumber(error.errorAmount.toString())} ${
                  error.displayCurrencyCode ?? quoteCurrencyCode
                }`
              )
      } else {
        errorText =
          error.errorAmount == null
            ? lstrings.fiat_plugin_sell_amount_over_undef_limit
            : sprintf(
                lstrings.fiat_plugin_sell_amount_over_limit,
                `${formatNumber(error.errorAmount.toString())} ${
                  error.displayCurrencyCode ?? quoteCurrencyCode
                }`
              )
      }
      break
    case 'paymentUnsupported':
      errorText = lstrings.fiat_plugin_payment_unsupported
      break
    case 'regionRestricted':
      errorText = sprintf(
        quoteDirection === 'buy'
          ? lstrings.fiat_plugin_buy_region_restricted
          : lstrings.fiat_plugin_sell_region_restricted,
        error.displayCurrencyCode
      )
      break
    case 'assetUnsupported':
      errorText = lstrings.fiat_plugin_asset_unsupported
      break
    case 'fiatUnsupported':
      {
        const { pluginDisplayName, fiatCurrencyCode } = error
        errorText =
          quoteDirection === 'buy'
            ? sprintf(
                lstrings.fiat_plugin_buy_fiat_unsupported_2s,
                pluginDisplayName,
                fiatCurrencyCode
              )
            : sprintf(
                lstrings.fiat_plugin_sell_fiat_unsupported_2s,
                pluginDisplayName,
                fiatCurrencyCode
              )
      }
      break
    default:
      errorText = 'Unknown error type'
  }

  return errorText
}
