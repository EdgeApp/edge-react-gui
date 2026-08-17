import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAddressError,
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
import { processSwapQuoteError } from '../../util/swapErrorDisplay'
import { ButtonsModal } from '../modals/ButtonsModal'
import { showInsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { showPendingTxModal } from '../modals/PendingTxModal'
import { CancellableProcessingScene } from '../progress-indicators/CancellableProcessingScene'
import { Airship } from '../services/AirshipInstance'

export interface SwapProcessingParams {
  swapRequest: EdgeSwapRequest
  swapRequestOptions: EdgeSwapRequestOptions
  onCancel: () => void
  onDone: (quotes: EdgeSwapQuote[]) => void
  /**
   * First chance at a failed quote, before the scene's own handling. Return
   * true when the error was handled (the caller navigated or recovered), so
   * the generic error display is skipped. Lets the swap create scene react to
   * capability failures, such as turning Stealth Swap off when the provider
   * has no private route for the pair.
   */
  onError?: (error: unknown) => boolean
}

type Props = SwapTabSceneProps<'swapProcessing'>

export const SwapProcessingScene: React.FC<Props> = (props: Props) => {
  const { route, navigation } = props
  const {
    swapRequest,
    swapRequestOptions,
    onCancel,
    onDone,
    onError: onErrorParam
  } = route.params

  const account = useSelector(state => state.core.account)
  const countryCode = useSelector(state => state.ui.countryCode)

  const fromDenomination = useDisplayDenom(
    swapRequest.fromWallet.currencyConfig,
    swapRequest.fromTokenId
  )
  const toDenomination = useDisplayDenom(
    // Wallet-to-wallet swaps always have a destination wallet here; fall back to
    // the source config only so this hook stays unconditional.
    (swapRequest.toWallet ?? swapRequest.fromWallet).currencyConfig,
    swapRequest.toTokenId
  )

  // This scene only processes wallet-to-wallet swap requests, which always
  // carry a destination wallet (swap-to-address has its own flow).
  const toWallet = swapRequest.toWallet
  if (toWallet == null) {
    throw new Error('Swap request is missing a destination wallet')
  }

  const doWork = async (isCancelled: () => boolean): Promise<void> => {
    const quotes = await account.fetchSwapQuotes(
      swapRequest,
      swapRequestOptions
    )
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
    // The caller gets first chance, e.g. to degrade a capability toggle
    // instead of showing the generic no-quotes error:
    if (onErrorParam?.(error) === true) return

    // Handle same-address requirement for swap flows requiring a split:
    const addressError = asMaybeSwapAddressError(error)
    if (addressError != null && addressError.reason === 'mustMatch') {
      try {
        const fromWallet = swapRequest.fromWallet
        const fromAddresses = await fromWallet.getAddresses({ tokenId: null })
        const fromAddress = fromAddresses[0]?.publicAddress
        const targetPluginId = toWallet.currencyInfo.pluginId

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

        let finalToWalletId: string
        let finalToWallet: typeof toWallet
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
          toWalletId: toWallet.id,
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
        toWalletId: toWallet.id,
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
