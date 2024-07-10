import { lt } from 'biggystring'
import { EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { FlashNotification } from '../components/navigation/FlashNotification'
import { Airship, showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { getExchangeDenom, selectDisplayDenom } from '../selectors/DenominationSelectors'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { calculateSpamThreshold, convertNativeToDisplay, zeroString } from '../util/utils'
import { playReceiveSound } from './SoundActions'
import { selectWalletToken } from './WalletActions'

let receiveDropdownShowing = false

/**
 * Shows a drop-down alert for an incoming transaction.
 */
export function showReceiveDropdown(navigation: NavigationBase, transaction: EdgeTransaction): ThunkAction<void> {
  return (dispatch, getState) => {
    const { currencyCode, nativeAmount, tokenId, walletId } = transaction

    // Grab the matching wallet:
    const state = getState()
    const { account } = state.core
    const wallet = account.currencyWallets[walletId]
    if (wallet == null) return

    const isoFiatCurrencyCode = state.ui.settings.defaultIsoFiat

    // Never stack dropdowns:
    if (receiveDropdownShowing) return

    // Check the spam limits:
    const { spamFilterOn } = state.ui.settings
    const exchangeRate = state.exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`]
    const exchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
    const spamThreshold = calculateSpamThreshold(exchangeRate, exchangeDenom)
    if (spamFilterOn && (zeroString(exchangeRate) || lt(nativeAmount, spamThreshold))) {
      return
    }

    // Format the message:
    const displayDenomination = selectDisplayDenom(state, wallet.currencyConfig, tokenId)
    const { symbol, name, multiplier } = displayDenomination
    const displayAmount = convertNativeToDisplay(multiplier)(nativeAmount)
    const message = sprintf(lstrings.bitcoin_received, `${symbol ? symbol + ' ' : ''}${displayAmount} ${name}`)

    // Display the dropdown:
    receiveDropdownShowing = true
    playReceiveSound().catch(() => {})
    Airship.show(bridge => (
      <FlashNotification
        bridge={bridge}
        message={message}
        onPress={() => {
          bridge.resolve()

          if (!account.loggedIn) return
          dispatch(
            selectWalletToken({
              navigation,
              walletId,
              tokenId
            })
          ).catch(error => showError(error))

          navigation.navigate('transactionDetails', {
            edgeTransaction: transaction,
            walletId
          })
        }}
      />
    )).finally(() => {
      receiveDropdownShowing = false
    })
  }
}
