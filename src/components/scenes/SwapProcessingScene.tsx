import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAddressError,
  asMaybeSwapCurrencyError,
  type EdgeSwapQuote,
  type EdgeSwapRequest,
  type EdgeSwapRequestOptions
} from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { getDisabledSwapPlugins } from '../../actions/ExchangeInfoActions'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { NavigationBase, SwapTabSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { processSwapQuoteError } from '../../util/swapErrorDisplay'
import { ButtonsModal } from '../modals/ButtonsModal'
import { showInsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { showPendingTxModal } from '../modals/PendingTxModal'
import { CancellableProcessingScene } from '../progress-indicators/CancellableProcessingScene'
import { Airship, showToast } from '../services/AirshipInstance'

/**
 * What to do when no provider can price an exact receive amount: quote this
 * "from" request instead, and tell the caller its amounts changed.
 */
export interface ToQuoteFallback {
  swapRequest: EdgeSwapRequest
  onSwitch: () => void
}

export interface SwapProcessingParams {
  swapRequest: EdgeSwapRequest
  swapRequestOptions: EdgeSwapRequestOptions
  toQuoteFallback?: ToQuoteFallback
  onCancel: () => void
  onDone: (quotes: EdgeSwapQuote[]) => void
}

type Props = SwapTabSceneProps<'swapProcessing'>

export const SwapProcessingScene: React.FC<Props> = (props: Props) => {
  const { route, navigation } = props
  const {
    swapRequest: initialRequest,
    swapRequestOptions,
    toQuoteFallback,
    onCancel,
    onDone
  } = route.params

  const account = useSelector(state => state.core.account)
  const countryCode = useSelector(state => state.ui.countryCode)
  const disableAssetsByPlugin = useSelector(
    state => state.ui.exchangeInfo.swap.disableAssetsByPlugin
  )

  const fromDenomination = useDisplayDenom(
    initialRequest.fromWallet.currencyConfig,
    initialRequest.fromTokenId
  )
  const toDenomination = useDisplayDenom(
    initialRequest.toWallet.currencyConfig,
    initialRequest.toTokenId
  )

  // The request this scene is working on. It changes at most once, when a "to"
  // quote gives way to its fallback. A re-render can run `doWork` again, and
  // that run must stay on the fallback without switching a second time.
  const activeRequest = React.useRef(initialRequest)

  const fetchQuotes = async (
    request: EdgeSwapRequest
  ): Promise<EdgeSwapQuote[]> => {
    return await account.fetchSwapQuotes(request, {
      ...swapRequestOptions,
      disabled: {
        ...swapRequestOptions.disabled,
        ...getDisabledSwapPlugins(disableAssetsByPlugin, request)
      }
    })
  }

  /**
   * Quotes the active request. A "to" request nothing can route tries its
   * fallback, which tells a quote-direction limit apart from an unsupported
   * pair: if the "from" quote cannot route either, the pair is the problem, so
   * the original error stands and the user's amounts stay as they typed them.
   * Any other outcome means the pair has a route, so the switch happens, even
   * when the error is about the new amount (a limit or insufficient funds).
   */
  const fetchWithToFallback = async (
    isCancelled: () => boolean
  ): Promise<EdgeSwapQuote[]> => {
    if (toQuoteFallback == null || activeRequest.current !== initialRequest) {
      return await fetchQuotes(activeRequest.current)
    }

    let toError: Error | undefined
    try {
      const quotes = await fetchQuotes(initialRequest)
      if (quotes.length > 0) return quotes
    } catch (error: unknown) {
      const currencyError = asMaybeSwapCurrencyError(error)
      if (currencyError == null) throw error
      toError = currencyError
    }
    if (isCancelled()) return []

    const switchToFallback = (): void => {
      if (isCancelled()) return
      activeRequest.current = toQuoteFallback.swapRequest
      toQuoteFallback.onSwitch()
      showToast(lstrings.swap_fixed_to_unavailable_toast)
    }

    let fromQuotes: EdgeSwapQuote[]
    try {
      fromQuotes = await fetchQuotes(toQuoteFallback.swapRequest)
    } catch (error: unknown) {
      if (asMaybeSwapCurrencyError(error) != null) throw toError ?? error
      switchToFallback()
      throw error
    }
    if (fromQuotes.length === 0) {
      if (toError != null) throw toError
      return fromQuotes
    }
    switchToFallback()
    return fromQuotes
  }

  const doWork = async (isCancelled: () => boolean): Promise<void> => {
    const quotes = await fetchWithToFallback(isCancelled)
    if (isCancelled()) return
    if (quotes.length === 0) {
      // fetchSwapQuotes usually throws when nothing can route, but it resolves
      // empty when every plugin simply declines. Every onDone caller reads
      // quotes[0], so hand this to the error path instead of the confirmation
      // scene, which would dereference undefined.
      throw new Error(lstrings.trade_option_no_quotes_body)
    }
    onDone(quotes)
  }

  const onError = async (error: unknown): Promise<void> => {
    const swapRequest = activeRequest.current

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
          const targetWalletType =
            account.currencyConfig[targetPluginId]?.currencyInfo.walletType
          if (targetWalletType == null)
            throw new Error('Target wallet type unavailable')

          const [result] = await fromWallet.split([
            {
              fiatCurrencyCode: fromWallet.fiatCurrencyCode,
              name: getWalletName(fromWallet),
              walletType: targetWalletType
            }
          ])
          if (!result.ok) throw result.error
          finalToWalletId = result.result.id
          finalToWallet = result.result
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
        navigation as NavigationBase
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
        navigation: navigation as NavigationBase,
        wallet: swapRequest.fromWallet
      })
    }
  }

  return (
    <CancellableProcessingScene
      doWork={doWork}
      onCancel={onCancel}
      onError={onError}
      processingText={lstrings.trying_to_find}
      longProcessingText={lstrings.exchange_slow}
    />
  )
}
