import { EdgeCurrencyWallet, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { NavigationBase } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getUkCompliantString } from '../../util/ukComplianceUtils'
import { roundedFee } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { Paragraph } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

interface Props {
  bridge: AirshipBridge<void>
  coreError: InsufficientFundsError
  navigation: NavigationBase
  wallet: EdgeCurrencyWallet

  countryCode?: string
  // Called when the user wants to swap.
  // The default behavior is to navigate to the swap scene,
  // but the swap scene itself needs a different behavior here.
  onSwap?: () => void
}

/**
 * Show this modal when the wallet doesn't have enough funds to cover fees.
 */
export function InsufficientFeesModal(props: Props) {
  const { bridge, countryCode, coreError, navigation, wallet, onSwap } = props

  // Get the display amount:
  const { tokenId, networkFee = '' } = coreError
  const currencyCode = getCurrencyCode(wallet, tokenId)
  const { multiplier, name: denomName } = useDisplayDenom(wallet.currencyConfig, tokenId)
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

  // Give extra information about the network name like Base or Arbitrum where
  // the mainnet token is ETH but the network is not Ethereum.
  let message: string
  let secondary
  if (config.disableSwaps === true) {
    secondary = undefined
    message =
      currencyCode === 'ETH' && wallet.currencyInfo.pluginId !== 'ethereum'
        ? sprintf(lstrings.buy_parent_crypto_modal_message_no_exchange_3s, amountString, denomName, wallet.currencyInfo.displayName)
        : sprintf(lstrings.buy_parent_crypto_modal_message_no_exchange_2s, amountString, denomName)
  } else {
    secondary = { label: lstrings.buy_crypto_modal_exchange, onPress: handleSwap }
    message =
      currencyCode === 'ETH' && wallet.currencyInfo.pluginId !== 'ethereum'
        ? sprintf(lstrings.buy_parent_crypto_modal_message_3s, amountString, denomName, wallet.currencyInfo.displayName)
        : sprintf(lstrings.buy_parent_crypto_modal_message_2s, amountString, denomName)
  }

  return (
    <EdgeModal bridge={bridge} title={lstrings.buy_crypto_modal_title} onCancel={handleCancel}>
      <Paragraph>{message}</Paragraph>
      <ButtonsView
        primary={{ label: getUkCompliantString(countryCode, 'buy_1s_quote', currencyCode), onPress: handleBuy }}
        secondary={secondary}
        tertiary={{ label: lstrings.buy_crypto_decline, onPress: handleCancel }}
      />
    </EdgeModal>
  )
}
