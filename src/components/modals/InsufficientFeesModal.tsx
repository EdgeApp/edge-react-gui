import { EdgeCurrencyWallet, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { NavigationBase } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { roundedFee } from '../../util/utils'
import { ModalMessage } from '../themed/ModalParts'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'
import { ModalUi4 } from '../ui4/ModalUi4'

interface Props {
  bridge: AirshipBridge<void>
  coreError: InsufficientFundsError
  navigation: NavigationBase
  wallet: EdgeCurrencyWallet

  // Called when the user wants to swap.
  // The default behavior is to navigate to the swap scene,
  // but the swap scene itself needs a different behavior here.
  onSwap?: () => void
}

/**
 * Show this modal when the wallet doesn't have enough funds to cover fees.
 */
export function InsufficientFeesModal(props: Props) {
  const { bridge, coreError, navigation, wallet, onSwap } = props

  // Get the display amount:
  const { tokenId, networkFee = '' } = coreError
  const currencyCode = getCurrencyCode(wallet, tokenId)
  const { multiplier, name } = useDisplayDenom(wallet.currencyConfig, tokenId)
  const amountString = roundedFee(networkFee, 2, multiplier)

  const handleCancel = useHandler(() => bridge.resolve())
  const handleBuy = useHandler(() => {
    navigation.navigate('buyTab', { screen: 'pluginListBuy' })
    bridge.resolve()
  })
  const handleSwap = useHandler(async () => {
    if (onSwap) onSwap()
    navigation.navigate('swapTab', { screen: 'swapCreate', params: { toWalletId: wallet.id, toTokenId: tokenId } })
    bridge.resolve()
  })

  return (
    <ModalUi4 bridge={bridge} title={lstrings.buy_crypto_modal_title} onCancel={handleCancel}>
      <ModalMessage>{sprintf(lstrings.buy_parent_crypto_modal_message_2s, amountString, name)}</ModalMessage>
      <ButtonsViewUi4
        primary={{ label: sprintf(lstrings.buy_crypto_modal_buy_action, currencyCode), onPress: handleBuy }}
        secondary={{ label: lstrings.buy_crypto_modal_exchange, onPress: handleSwap }}
        tertiary={{ label: lstrings.buy_crypto_decline, onPress: handleCancel }}
      />
    </ModalUi4>
  )
}
