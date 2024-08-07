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

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
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

interface Props extends EdgeSceneProps<'swapProcessing'> {}

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
      await Airship.show(bridge => (
        <InsufficientFeesModal bridge={bridge} coreError={insufficientFunds} navigation={navigation} wallet={swapRequest.fromWallet} />
      ))
    }
  }

  return (
    <CancellableProcessingScene<EdgeSwapQuote[]>
      navigation={navigation}
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

  // Check for known error types:
  const insufficientFunds = asMaybeInsufficientFundsError(error)
  if (insufficientFunds != null || errorMessage === 'InsufficientFundsError') {
    return {
      title: lstrings.exchange_insufficient_funds_title,
      message: lstrings.exchange_insufficient_funds_message
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
      message: sprintf(lstrings.amount_above_limit, displayMax, currentCurrencyDenomination.name)
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
      message: sprintf(lstrings.amount_below_limit, displayMin, currentCurrencyDenomination.name)
    }
  }

  const currencyError = asMaybeSwapCurrencyError(error)
  if (currencyError != null) {
    const fromCurrencyCode = getCurrencyCode(swapRequest.fromWallet, swapRequest.fromTokenId)
    const toCurrencyCode = getCurrencyCode(swapRequest.toWallet, swapRequest.toTokenId)

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.ss_unable, fromCurrencyCode, toCurrencyCode)
    }
  }

  const permissionError = asMaybeSwapPermissionError(error)
  if (permissionError?.reason === 'geoRestriction') {
    return {
      title: lstrings.exchange_generic_error_title,
      message: lstrings.ss_geolock
    }
  }

  // Anything else:
  return {
    title: lstrings.exchange_generic_error_title,
    message: errorMessage
  }
}
