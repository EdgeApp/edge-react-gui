import { captureException } from '@sentry/react-native'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  EdgeDenomination,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapRequestOptions
} from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { getFirstOpenInfo } from '../../actions/FirstOpenActions'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase, SwapTabSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { convertNativeToDisplay } from '../../util/utils'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { CancellableProcessingScene } from '../progress-indicators/CancellableProcessingScene'
import { Airship } from '../services/AirshipInstance'
import { SwapErrorDisplayInfo } from './SwapCreateScene'

export interface SwapProcessingParams {
  swapRequest: EdgeSwapRequest
  swapRequestOptions: EdgeSwapRequestOptions
  onCancel: () => void
  onDone: (quotes: EdgeSwapQuote[]) => void
}

interface Props extends SwapTabSceneProps<'swapProcessing'> {}

export function SwapProcessingScene(props: Props) {
  const { route, navigation } = props
  const { swapRequest, swapRequestOptions, onCancel, onDone } = route.params

  const account = useSelector(state => state.core.account)

  const fromDenomination = useDisplayDenom(swapRequest.fromWallet.currencyConfig, swapRequest.fromTokenId)
  const toDenomination = useDisplayDenom(swapRequest.toWallet.currencyConfig, swapRequest.toTokenId)

  const doWork = async (): Promise<EdgeSwapQuote[]> => {
    const quotes = await account.fetchSwapQuotes(swapRequest, swapRequestOptions)
    return quotes
  }

  const onError = async (navigation: NavigationBase, error: unknown): Promise<void> => {
    const errorDisplayInfo = processSwapQuoteError({
      error,
      swapRequest,
      fromDenomination,
      toDenomination
    })

    navigation.navigate('swapTab', {
      screen: 'swapCreate',
      params: {
        fromWalletId: swapRequest.fromWallet.id,
        fromTokenId: swapRequest.fromTokenId,
        toWalletId: swapRequest.toWallet.id,
        toTokenId: swapRequest.toTokenId,
        errorDisplayInfo
      }
    })

    const insufficientFunds = asMaybeInsufficientFundsError(error)
    if (insufficientFunds != null && swapRequest.fromTokenId !== insufficientFunds.tokenId) {
      const { countryCode } = await getFirstOpenInfo()
      await Airship.show(bridge => (
        <InsufficientFeesModal
          bridge={bridge}
          countryCode={countryCode}
          coreError={insufficientFunds}
          navigation={navigation}
          wallet={swapRequest.fromWallet}
        />
      ))
    }
  }

  return (
    <CancellableProcessingScene<EdgeSwapQuote[]>
      navigation={navigation as NavigationBase}
      doWork={doWork}
      onCancel={onCancel}
      onDone={onDone}
      onError={onError}
      processingText={lstrings.trying_to_find}
      longProcessingText={lstrings.exchange_slow}
    />
  )
}

function processSwapQuoteError({
  error,
  swapRequest,
  fromDenomination,
  toDenomination
}: {
  error: unknown
  swapRequest: EdgeSwapRequest
  fromDenomination: EdgeDenomination
  toDenomination: EdgeDenomination
}): SwapErrorDisplayInfo | undefined {
  // Basic sanity checks (should never fail):
  if (error == null) return

  // Some plugins get the insufficient funds error wrong:
  const errorMessage = error instanceof Error ? error.message : String(error)

  // Track swap errors to sentry:
  trackSwapError(error, swapRequest)

  // Check for known error types:
  const insufficientFunds = asMaybeInsufficientFundsError(error)
  if (insufficientFunds != null || errorMessage === 'InsufficientFundsError') {
    return {
      title: lstrings.exchange_insufficient_funds_title,
      message: lstrings.exchange_insufficient_funds_message,
      error
    }
  }

  const aboveLimit = asMaybeSwapAboveLimitError(error)
  if (aboveLimit != null) {
    const currentCurrencyDenomination = aboveLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMax } = aboveLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMax = convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.amount_above_limit, displayMax, currentCurrencyDenomination.name),
      error
    }
  }

  const belowLimit = asMaybeSwapBelowLimitError(error)
  if (belowLimit) {
    const currentCurrencyDenomination = belowLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMin } = belowLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMin = convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.amount_below_limit, displayMin, currentCurrencyDenomination.name),
      error
    }
  }

  const currencyError = asMaybeSwapCurrencyError(error)
  if (currencyError != null) {
    const fromCurrencyCode = getCurrencyCode(swapRequest.fromWallet, swapRequest.fromTokenId)
    const toCurrencyCode = getCurrencyCode(swapRequest.toWallet, swapRequest.toTokenId)

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.ss_unable, fromCurrencyCode, toCurrencyCode),
      error
    }
  }

  const permissionError = asMaybeSwapPermissionError(error)
  if (permissionError?.reason === 'geoRestriction') {
    return {
      title: lstrings.exchange_generic_error_title,
      message: lstrings.ss_geolock,
      error
    }
  }

  // Anything else:
  return {
    title: lstrings.exchange_generic_error_title,
    message: errorMessage,
    error
  }
}

/**
 * REVIEWER BEWARE!!
 *
 * No specific account/wallet information should be included within the
 * scope for this capture. No personal information such as wallet IDs,
 * public keys, or transaction details, amounts, should be collected
 * according to Edge's company policy.
 */
function trackSwapError(error: unknown, swapRequest: EdgeSwapRequest): void {
  captureException(error, scope => {
    // This is a warning level error because it's expected to occur but not wanted.
    scope.setLevel('warning')
    // Searchable tags:
    scope.setTags({
      errorType: 'swapQuoteFailure',
      swapFromWalletKind: swapRequest.fromWallet.currencyInfo.pluginId,
      swapFromCurrency: getCurrencyCode(swapRequest.fromWallet, swapRequest.fromTokenId),
      swapToCurrency: getCurrencyCode(swapRequest.toWallet, swapRequest.toTokenId),
      swapToWalletKind: swapRequest.toWallet.currencyInfo.pluginId,
      swapDirectionType: swapRequest.quoteFor
    })
    // Unsearchable context data:
    scope.setContext('Swap Request Details', {
      fromTokenId: String(swapRequest.fromTokenId), // Stringify to include "null"
      fromWalletType: swapRequest.fromWallet.type,
      toTokenId: String(swapRequest.toTokenId), // Stringify to include "null"
      toWalletType: swapRequest.fromWallet.type,
      quoteFor: swapRequest.quoteFor
    })
    return scope
  })
}
