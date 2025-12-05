import { captureException } from '@sentry/react-native'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapAddressError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  type EdgeDenomination,
  type EdgeSwapQuote,
  type EdgeSwapRequest,
  type EdgeSwapRequestOptions
} from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { NavigationBase, SwapTabSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDisplay, zeroString } from '../../util/utils'
import { ButtonsModal } from '../modals/ButtonsModal'
import { showInsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { showPendingTxModal } from '../modals/PendingTxModal'
import { CancellableProcessingScene } from '../progress-indicators/CancellableProcessingScene'
import { Airship } from '../services/AirshipInstance'
import type { SwapErrorDisplayInfo } from './SwapCreateScene'

export interface SwapProcessingParams {
  swapRequest: EdgeSwapRequest
  swapRequestOptions: EdgeSwapRequestOptions
  onCancel: () => void
  onDone: (quotes: EdgeSwapQuote[]) => void
}

type Props = SwapTabSceneProps<'swapProcessing'>

export const SwapProcessingScene: React.FC<Props> = (props: Props) => {
  const { route, navigation } = props
  const { swapRequest, swapRequestOptions, onCancel, onDone } = route.params

  const account = useSelector(state => state.core.account)
  const countryCode = useSelector(state => state.ui.countryCode)

  const fromDenomination = useDisplayDenom(
    swapRequest.fromWallet.currencyConfig,
    swapRequest.fromTokenId
  )
  const toDenomination = useDisplayDenom(
    swapRequest.toWallet.currencyConfig,
    swapRequest.toTokenId
  )

  const doWork = async (): Promise<EdgeSwapQuote[]> => {
    const quotes = await account.fetchSwapQuotes(
      swapRequest,
      swapRequestOptions
    )
    return quotes
  }

  const onError = async (
    navigation: NavigationBase,
    error: unknown
  ): Promise<void> => {
    // Handle same-address requirement for swap flows requiring a split:
    const addressError = asMaybeSwapAddressError(error)
    if (addressError != null && addressError.reason === 'mustMatch') {
      try {
        const fromWallet = swapRequest.fromWallet
        const fromAddresses = await fromWallet.getAddresses({ tokenId: null })
        const fromAddress = fromAddresses[0]?.publicAddress
        const targetPluginId = swapRequest.toWallet.currencyInfo.pluginId

        let matchingWalletId: string | undefined
        for (const walletId of Object.keys(account.currencyWallets)) {
          const wallet = account.currencyWallets[walletId]
          if (wallet.currencyInfo.pluginId === targetPluginId) {
            const toAddresses = await wallet.getAddresses({ tokenId: null })
            const publicAddress = toAddresses[0]?.publicAddress
            if (
              fromAddress != null &&
              publicAddress != null &&
              fromAddress.toLowerCase() === publicAddress.toLowerCase()
            ) {
              matchingWalletId = walletId
              break
            }
          }
        }

        let finalToWalletId: string = swapRequest.toWallet.id
        let finalToWallet = swapRequest.toWallet
        let isWalletCreated = false
        if (matchingWalletId == null) {
          // If not found, split from the source chain wallet to the destination
          // chain wallet type:
          isWalletCreated = true
          const splitFromWallet = fromWallet
          const targetWalletType =
            account.currencyConfig[targetPluginId]?.currencyInfo.walletType
          if (targetWalletType == null)
            throw new Error('Target wallet type unavailable')

          const splitWalletId = await account.splitWalletInfo(
            splitFromWallet.id,
            targetWalletType
          )
          const newWallet = await account.waitForCurrencyWallet(splitWalletId)
          finalToWalletId = newWallet.id
          finalToWallet = newWallet
        } else {
          finalToWalletId = matchingWalletId
          finalToWallet = account.currencyWallets[matchingWalletId]
        }

        // Navigate back to swap create with the correct wallet selected:
        navigation.navigate('swapTab', {
          screen: 'swapCreate',
          params: {
            fromWalletId: fromWallet.id,
            fromTokenId: swapRequest.fromTokenId,
            toWalletId: finalToWalletId,
            toTokenId: swapRequest.toTokenId
          }
        })

        // Show modal with OK button:
        const name = getWalletName(finalToWallet)
        const fromCurrencyCode = getCurrencyCode(
          fromWallet,
          swapRequest.fromTokenId
        )
        const toCurrencyCode = getCurrencyCode(
          finalToWallet,
          swapRequest.toTokenId
        )
        const template = isWalletCreated
          ? lstrings.ss_same_address_upgrade_created_3s
          : lstrings.ss_same_address_upgrade_selected_3s
        await Airship.show<string | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.exchange_generic_error_title}
            message={sprintf(template, fromCurrencyCode, toCurrencyCode, name)}
            buttons={{ ok: { label: lstrings.string_ok_cap } }}
          />
        ))
        return
      } catch (e) {
        // Fall through to generic error handling if something goes wrong
      }
    }

    // Check for pending transaction error first
    if (
      error != null &&
      error instanceof Error &&
      error.name === 'PendingFundsError'
    ) {
      navigation.navigate('swapTab', {
        screen: 'swapCreate',
        params: {
          fromWalletId: swapRequest.fromWallet.id,
          fromTokenId: swapRequest.fromTokenId,
          toWalletId: swapRequest.toWallet.id,
          toTokenId: swapRequest.toTokenId
        }
      })
      await showPendingTxModal(
        swapRequest.fromWallet,
        swapRequest.fromTokenId,
        navigation
      )
      return
    }

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
    if (
      insufficientFunds != null &&
      swapRequest.fromTokenId !== insufficientFunds.tokenId
    ) {
      await showInsufficientFeesModal({
        coreError: insufficientFunds,
        countryCode,
        navigation,
        wallet: swapRequest.fromWallet
      })
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
  const errorMessage =
    error instanceof Error ? error.message : JSON.stringify(error)

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

  if (
    error instanceof Error &&
    error.message === 'Unexpected pending transactions'
  ) {
    return {
      title: lstrings.exchange_insufficient_funds_title,
      message: lstrings.exchange_pending_funds_error,
      error
    }
  }

  const aboveLimit = asMaybeSwapAboveLimitError(error)
  if (aboveLimit != null) {
    const currentCurrencyDenomination =
      aboveLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMax } = aboveLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMax = convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

    return {
      title: lstrings.exchange_generic_error_title,
      message: !zeroString(displayMax)
        ? sprintf(
            lstrings.amount_above_limit,
            displayMax,
            currentCurrencyDenomination.name
          )
        : lstrings.no_amount_above_limit,
      error
    }
  }

  const belowLimit = asMaybeSwapBelowLimitError(error)
  if (belowLimit != null) {
    const currentCurrencyDenomination =
      belowLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMin } = belowLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMin = convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

    return {
      title: lstrings.exchange_generic_error_title,
      message: !zeroString(displayMin)
        ? sprintf(
            lstrings.amount_below_limit,
            displayMin,
            currentCurrencyDenomination.name
          )
        : lstrings.no_amount_below_limit,
      error
    }
  }

  const currencyError = asMaybeSwapCurrencyError(error)
  if (currencyError != null) {
    const fromCurrencyCode = getCurrencyCode(
      swapRequest.fromWallet,
      swapRequest.fromTokenId
    )
    const toCurrencyCode = getCurrencyCode(
      swapRequest.toWallet,
      swapRequest.toTokenId
    )

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
      swapFromCurrency: getCurrencyCode(
        swapRequest.fromWallet,
        swapRequest.fromTokenId
      ),
      swapToCurrency: getCurrencyCode(
        swapRequest.toWallet,
        swapRequest.toTokenId
      ),
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
