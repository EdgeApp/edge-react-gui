import { EdgeCurrencyWallet, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { selectWalletForExchange } from '../../actions/CryptoExchangeActions'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { roundedFee } from '../../util/utils'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

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
  const dispatch = useDispatch()

  // Get the display amount:
  const { currencyInfo } = wallet
  const { currencyCode = currencyInfo.currencyCode, networkFee = '' } = coreError
  const { multiplier, name } = useDisplayDenom(currencyInfo.pluginId, currencyCode)
  const amountString = roundedFee(networkFee, 2, multiplier)

  const handleCancel = useHandler(() => bridge.resolve())
  const handleBuy = useHandler(() => {
    navigation.navigate('buyTab', { screen: 'pluginListBuy' })
    bridge.resolve()
  })
  const handleSwap = useHandler(async () => {
    if (onSwap) return onSwap()
    await dispatch(selectWalletForExchange(wallet.id, currencyCode, 'to'))
    navigation.navigate('exchangeTab', { screen: 'exchange' })
    bridge.resolve()
  })

  return (
    <ThemedModal bridge={bridge} paddingRem={1} onCancel={handleCancel}>
      <ModalTitle>{lstrings.buy_crypto_modal_title}</ModalTitle>
      <ModalMessage>{sprintf(lstrings.buy_parent_crypto_modal_message_2s, amountString, name)}</ModalMessage>
      <MainButton label={sprintf(lstrings.buy_crypto_modal_buy_action, currencyCode)} type="primary" marginRem={0.5} onPress={handleBuy} />
      <MainButton label={lstrings.buy_crypto_modal_exchange} type="primary" marginRem={0.5} onPress={handleSwap} />
      <MainButton label={lstrings.buy_crypto_decline} type="secondary" marginRem={0.5} onPress={handleCancel} />
    </ThemedModal>
  )
}
