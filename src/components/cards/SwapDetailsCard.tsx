import { abs, sub } from 'biggystring'
import type {
  EdgeCurrencyConfig,
  EdgeCurrencyWallet,
  EdgeTransaction,
  EdgeTxSwap
} from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform, View } from 'react-native'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import {
  getExchangeDenom,
  selectDisplayDenom
} from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDisplay, unixToLocaleDateTime } from '../../util/utils'
import { RawTextModal } from '../modals/RawTextModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  swapData: EdgeTxSwap
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet

  /**
   * Keep the payout address out of the details text. Set for a private send,
   * whose recipient the UI must not reveal. The address stays on `swapData`
   * so support can still trace the order.
   */
  hidePayoutAddress?: boolean
}

const TXID_PLACEHOLDER = '{{TXID}}'

// Metadata may have been created and saved before tokenId was required.
// If tokenId is missing it defaults to null so we can try upgrading it.
const upgradeSwapData = (
  payoutConfig: EdgeCurrencyConfig | undefined,
  swapData: EdgeTxSwap
): EdgeTxSwap => {
  if (swapData.payoutTokenId !== undefined) return swapData

  swapData.payoutTokenId =
    payoutConfig != null &&
    payoutConfig.currencyInfo.currencyCode !== swapData.payoutCurrencyCode
      ? getTokenId(payoutConfig, swapData.payoutCurrencyCode)
      : null

  return swapData
}

export const SwapDetailsCard: React.FC<Props> = props => {
  const { swapData, transaction, wallet, hidePayoutAddress = false } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { memos = [], spendTargets = [], tokenId } = transaction
  const { currencyInfo } = wallet
  const walletName = useWalletName(wallet)
  const walletDefaultDenom = useSelector(state =>
    transaction.tokenId === null
      ? getExchangeDenom(wallet.currencyConfig, tokenId)
      : selectDisplayDenom(state, wallet.currencyConfig, tokenId)
  )

  // A swap-to-address payout has no wallet, and the wallet may also have
  // been deleted:
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const destinationWallet =
    swapData.payoutWalletId == null
      ? undefined
      : currencyWallets[swapData.payoutWalletId]
  const destinationWalletName =
    destinationWallet == null ? '' : getWalletName(destinationWallet)

  // The payout asset's own currency config. A swap-to-address payout has no
  // wallet to read it off, so it comes from the saved action's destination
  // asset instead. Falling back to the SOURCE wallet was not viable: it
  // resolves the payout currency code against the wrong chain, which left
  // `payoutTokenId` unset and made the guard below hide this whole card for
  // every swap-and-send, taking the order id and provider with it.
  const payoutSwapAction =
    transaction.savedAction?.actionType === 'swap'
      ? transaction.savedAction
      : undefined
  const payoutConfig =
    destinationWallet?.currencyConfig ??
    (payoutSwapAction == null
      ? undefined
      : account.currencyConfig[payoutSwapAction.toAsset.pluginId])

  const {
    isEstimate,
    orderId,
    orderUri,
    payoutAddress,
    payoutCurrencyCode,
    payoutTokenId,
    plugin,
    refundAddress
  } = upgradeSwapData(payoutConfig, swapData)
  const formattedOrderUri =
    orderUri == null
      ? undefined
      : orderUri.replace(TXID_PLACEHOLDER, transaction.txid)

  const handleExchangeDetails = useHandler(async () => {
    await Airship.show(bridge => (
      <RawTextModal
        bridge={bridge}
        body={createExchangeDataString()}
        title={lstrings.transaction_details_exchange_details}
      />
    ))
  })

  const handleEmail = useHandler(() => {
    const body = createExchangeDataString('<br />')

    Mailer.mail(
      {
        subject: sprintf(
          lstrings.transaction_details_exchange_support_request,
          plugin.displayName
        ),
        recipients:
          plugin.supportEmail != null ? [plugin.supportEmail] : undefined,
        body,
        isHTML: true
      },
      (error, event) => {
        if (String(error) === 'not_available') {
          showError(lstrings.error_no_email_account)
          return
        }

        if (error != null) showError(error)
      }
    )
  })

  const handleLink = async (): Promise<void> => {
    if (formattedOrderUri == null) return

    // Replace {{TXID}} with actual transaction ID if present

    if (Platform.OS === 'ios') {
      SafariView.isAvailable()
        .then(async available => {
          if (available) await SafariView.show({ url: formattedOrderUri })
          else await Linking.openURL(formattedOrderUri)
        })
        .catch((error: unknown) => {
          showError(error)
          Linking.openURL(formattedOrderUri).catch((err: unknown) => {
            showError(err)
          })
        })
    } else {
      await Linking.openURL(formattedOrderUri)
    }
  }

  const destinationDenomination = useSelector(state =>
    payoutConfig == null || payoutTokenId === undefined
      ? undefined
      : selectDisplayDenom(state, payoutConfig, payoutTokenId)
  )
  if (destinationDenomination == null) return null

  const sourceNativeAmount = sub(
    abs(transaction.nativeAmount),
    transaction.networkFee
  )
  const sourceAmount = convertNativeToDisplay(walletDefaultDenom.multiplier)(
    sourceNativeAmount
  )
  const sourceAssetName =
    tokenId == null
      ? walletDefaultDenom.name
      : `${walletDefaultDenom.name} (${
          getExchangeDenom(wallet.currencyConfig, null).name
        })`

  const destinationAmount = convertNativeToDisplay(
    destinationDenomination.multiplier
  )(swapData.payoutNativeAmount)
  const destinationAssetName =
    payoutTokenId == null || payoutConfig == null
      ? payoutCurrencyCode
      : `${payoutCurrencyCode} (${getExchangeDenom(payoutConfig, null).name})`

  const symbolString =
    currencyInfo.currencyCode === transaction.currencyCode &&
    walletDefaultDenom.symbol != null
      ? walletDefaultDenom.symbol
      : transaction.currencyCode

  const createExchangeDataString = (newline: string = '\n'): string => {
    const uniqueIdentifier = memos
      .map(
        (memo, index) =>
          `${memo.value}${index + 1 !== memos.length ? newline : ''}`
      )
      .toString()
    const exchangeAddresses = spendTargets
      .map(
        (target, index) =>
          `${target.publicAddress}${
            index + 1 !== spendTargets.length ? newline : ''
          }`
      )
      .toString()
    const { dateTime } = unixToLocaleDateTime(transaction.date)

    return `${lstrings.fio_date_label}: ${dateTime}${newline}${
      lstrings.transaction_details_exchange_service
    }: ${plugin.displayName}${newline}${
      lstrings.transaction_details_exchange_order_id
    }: ${orderId ?? ''}${newline}${
      lstrings.transaction_details_exchange_source_wallet
    }: ${walletName}${newline}${
      lstrings.fragment_send_from_label
    }: ${sourceAmount} ${sourceAssetName}${newline}${
      lstrings.string_to_capitalize
    }: ${destinationAmount} ${destinationAssetName}${newline}${
      lstrings.transaction_details_exchange_destination_wallet
    }: ${destinationWalletName}${newline}${
      isEstimate ? lstrings.estimated_quote : lstrings.fixed_quote
    }${newline}${newline}${lstrings.transaction_details_tx_id_modal_title}: ${
      transaction.txid
    }${newline}${newline}${
      lstrings.transaction_details_exchange_exchange_address
    }:${newline}${exchangeAddresses}${newline}${newline}${
      lstrings.transaction_details_exchange_exchange_unique_id
    }:${newline}${uniqueIdentifier}${newline}${newline}${
      lstrings.transaction_details_exchange_payout_address
    }:${newline}${
      hidePayoutAddress ? lstrings.stealth_recipient_hidden : payoutAddress
    }${newline}${newline}${
      lstrings.transaction_details_exchange_refund_address
    }:${newline}${refundAddress ?? ''}${newline}`
  }

  return (
    <EdgeCard sections>
      <EdgeRow
        rightButtonType="touchable"
        title={lstrings.transaction_details_exchange_details}
        onPress={handleExchangeDetails}
      >
        <View style={styles.tileColumn}>
          <EdgeText>
            {lstrings.title_exchange + ' ' + sourceAmount + ' ' + symbolString}
          </EdgeText>
          <EdgeText>
            {lstrings.string_to_capitalize +
              ' ' +
              destinationAmount +
              ' ' +
              destinationAssetName}
          </EdgeText>
          <EdgeText>
            {swapData.isEstimate
              ? lstrings.estimated_quote
              : lstrings.fixed_quote}
          </EdgeText>
        </View>
      </EdgeRow>
      {orderUri == null ? null : (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.transaction_details_exchange_status_page}
          onPress={handleLink}
          body={formattedOrderUri}
        />
      )}
      {plugin.supportEmail == null ? null : (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.transaction_details_exchange_support}
          onPress={handleEmail}
          body={swapData.plugin.supportEmail}
        />
      )}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileColumn: {
    flexDirection: 'column',
    justifyContent: 'center'
  }
}))
