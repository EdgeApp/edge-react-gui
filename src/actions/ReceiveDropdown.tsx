import { lt } from 'biggystring'
import { EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { FlashNotification } from '../components/navigation/FlashNotification'
import { Airship, showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../selectors/DenominationSelectors'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { getTokenId } from '../util/CurrencyInfoHelpers'
import { calculateSpamThreshold, convertNativeToDisplay, zeroString } from '../util/utils'
import { playReceiveSound } from './SoundActions'
import { selectWalletToken } from './WalletActions'

let receiveDropdownShowing = false

/**
 * Shows a drop-down alert for an incoming transaction.
 */
export function showReceiveDropdown(navigation: NavigationBase, transaction: EdgeTransaction): ThunkAction<void> {
  return (dispatch, getState) => {
    const { currencyCode, nativeAmount, walletId } = transaction

    // Grab the matching wallet:
    const state = getState()
    const { account } = state.core
    const wallet = account.currencyWallets[walletId]
    if (wallet == null) return

    const { currencyInfo, fiatCurrencyCode } = wallet
    const tokenId = getTokenId(account, currencyInfo.pluginId, currencyCode)

    // Never stack dropdowns:
    if (receiveDropdownShowing) return

    // Check the spam limits:
    const { spamFilterOn } = state.ui.settings
    const exchangeRate = state.exchangeRates[`${currencyCode}_${fiatCurrencyCode}`]
    const exchangeDenom = getExchangeDenomination(state, currencyInfo.pluginId, currencyCode)
    const spamThreshold = calculateSpamThreshold(exchangeRate, exchangeDenom)
    if (spamFilterOn && (zeroString(exchangeRate) || lt(nativeAmount, spamThreshold))) {
      return
    }

    // Format the message:
    const displayDenomination = getDisplayDenomination(state, currencyInfo.pluginId, currencyCode)
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
          ).catch(showError)

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
