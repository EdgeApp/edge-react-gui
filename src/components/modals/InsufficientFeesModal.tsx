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
import { Airship } from '../services/AirshipInstance'
import { Paragraph } from '../themed/EdgeText'
import { ButtonsModal } from './ButtonsModal'
import { EdgeModal } from './EdgeModal'

// Base props that might be used by any of these modals
interface ShowModalProps {
  coreError: InsufficientFundsError
  navigation: NavigationBase
  wallet: EdgeCurrencyWallet
  countryCode?: string

  // Called when the user wants to swap.
  // The default behavior is to navigate to the swap scene,
  // but the swap scene itself needs a different behavior here.
  onSwap?: () => void
}

// Props for the InsufficientFeesModal component
interface InsufficientFeesModalProps {
  bridge: AirshipBridge<void>
  coreError: InsufficientFundsError
  countryCode?: string
  navigation: NavigationBase
  wallet: EdgeCurrencyWallet
  onSwap?: () => void
}

// Props for the InsufficientFeesModalNoSwapBuy component - only include props it actually uses
interface InsufficientFeesModalNoSwapBuyProps {
  bridge: AirshipBridge<'ok' | undefined>
  coreError: InsufficientFundsError
  wallet: EdgeCurrencyWallet
}

/**
 * Show this modal when the wallet doesn't have enough funds to cover fees.
 * If UK and swaps are disabled, shows a simple modal without a swap CTA.
 */
export const showInsufficientFeesModal = async (props: ShowModalProps) => {
  const { countryCode, coreError, navigation, wallet, onSwap } = props

  if (config.disableSwaps === true && countryCode === 'GB') {
    await Airship.show<'ok' | undefined>(bridge => <InsufficientFeesModalNoSwapBuy bridge={bridge} coreError={coreError} wallet={wallet} />)
  } else {
    await Airship.show(bridge => (
      <InsufficientFeesModal bridge={bridge} coreError={coreError} countryCode={countryCode} navigation={navigation} wallet={wallet} onSwap={onSwap} />
    ))
  }
}

/**
 * Shows a simple modal notifying the user that they don't have enough funds to
 * cover fees, without any CTA to buy or swap.
 */
function InsufficientFeesModalNoSwapBuy(props: InsufficientFeesModalNoSwapBuyProps) {
  const { bridge, wallet, coreError } = props
  const { tokenId, networkFee = '' } = coreError
  const currencyCode = getCurrencyCode(wallet, tokenId)
  const { multiplier, name: denomName } = useDisplayDenom(wallet.currencyConfig, tokenId)
  const amountString = roundedFee(networkFee, 2, multiplier)

  return (
    <ButtonsModal
      message={
        currencyCode === 'ETH' && wallet.currencyInfo.pluginId !== 'ethereum'
          ? sprintf(lstrings.uk_deposit_parent_crypto_modal_message_no_exchange_3s, amountString, denomName, wallet.currencyInfo.displayName)
          : sprintf(lstrings.uk_deposit_parent_crypto_modal_message_no_exchange_2s, amountString, denomName)
      }
      bridge={bridge}
      buttons={{ ok: { label: lstrings.string_ok } }}
    />
  )
}

/**
 * Shows a modal notifying the user that they don't have enough funds to cover
 * fees, with a CTA to buy or swap, depending on configuration and country.
 */
function InsufficientFeesModal(props: InsufficientFeesModalProps) {
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
    navigation.navigate('swapTab', {
      screen: 'swapCreate',
      params: { toWalletId: wallet.id, toTokenId: tokenId }
    })
    bridge.resolve()
  })

  // Give extra information about the network name like Base or Arbitrum where
  // the mainnet token is ETH but the network is not Ethereum.
  let message: string
  let secondary
  let primary

  const swapButton = {
    label: lstrings.buy_crypto_modal_exchange,
    onPress: handleSwap
  }
  const buyButton = {
    label: sprintf(lstrings.buy_1s, currencyCode),
    onPress: handleBuy
  }

  if (config.disableSwaps === true) {
    // This case is blocked by `showInsufficientFeesModal` if the user is in UK
    primary = buyButton
    secondary = undefined
    message =
      currencyCode === 'ETH' && wallet.currencyInfo.pluginId !== 'ethereum'
        ? sprintf(lstrings.buy_parent_crypto_modal_message_no_exchange_3s, amountString, denomName, wallet.currencyInfo.displayName)
        : sprintf(lstrings.buy_parent_crypto_modal_message_no_exchange_2s, amountString, denomName)
  } else {
    primary = countryCode === 'GB' ? swapButton : buyButton
    secondary = countryCode === 'GB' ? undefined : swapButton
    message =
      currencyCode === 'ETH' && wallet.currencyInfo.pluginId !== 'ethereum'
        ? sprintf(
            getUkCompliantString(countryCode, 'insufficient_fees_3s', amountString, denomName, wallet.currencyInfo.displayName),
            amountString,
            denomName,
            wallet.currencyInfo.displayName
          )
        : sprintf(getUkCompliantString(countryCode, 'insufficient_fees_2s', amountString, denomName), amountString, denomName)
  }

  return (
    <EdgeModal bridge={bridge} title={lstrings.buy_crypto_modal_title} onCancel={handleCancel}>
      <Paragraph>{message}</Paragraph>
      <ButtonsView primary={primary} secondary={secondary} tertiary={{ label: lstrings.buy_crypto_decline, onPress: handleCancel }} />
    </EdgeModal>
  )
}
