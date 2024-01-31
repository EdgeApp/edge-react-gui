import { abs, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction, EdgeTxSwap } from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform, View } from 'react-native'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDisplay, unixToLocaleDateTime } from '../../util/utils'
import { RawTextModal } from '../modals/RawTextModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { CardUi4 } from './CardUi4'
import { RowUi4 } from './RowUi4'

interface Props {
  swapData: EdgeTxSwap
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
}

export function SwapDetailsCard(props: Props) {
  const { swapData, transaction, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { currencyCode, memos = [], spendTargets = [] } = transaction
  const { currencyInfo } = wallet
  const walletName = useWalletName(wallet)
  const walletDefaultDenom = useSelector(state =>
    currencyInfo.currencyCode === transaction.currencyCode
      ? getExchangeDenomination(state, currencyInfo.pluginId, currencyCode)
      : getDisplayDenomination(state, currencyInfo.pluginId, currencyCode)
  )

  const { isEstimate, orderId, orderUri, payoutAddress, payoutWalletId, plugin, refundAddress } = swapData
  const payoutCurrencyCode = swapData.payoutCurrencyCode

  const handleExchangeDetails = useHandler(async () => {
    await Airship.show(bridge => <RawTextModal bridge={bridge} body={createExchangeDataString()} title={lstrings.transaction_details_exchange_details} />)
  })

  const handleEmail = useHandler(() => {
    const email = plugin.supportEmail
    const body = createExchangeDataString('<br />')

    Mailer.mail(
      {
        subject: sprintf(lstrings.transaction_details_exchange_support_request, plugin.displayName),
        // @ts-expect-error
        recipients: [email],
        body,
        isHTML: true
      },
      (error, event) => {
        if (error) showError(error)
      }
    )
  })

  const handleLink = async () => {
    if (orderUri == null) return

    if (Platform.OS === 'ios') {
      SafariView.isAvailable()
        .then(async available => {
          if (available) await SafariView.show({ url: orderUri })
          else await Linking.openURL(orderUri)
        })
        .catch(error => {
          showError(error)
          Linking.openURL(orderUri).catch(err => showError(err))
        })
    } else {
      await Linking.openURL(orderUri)
    }
  }

  // The wallet may have been deleted:
  const destinationWallet = useSelector(state => state.core.account.currencyWallets[payoutWalletId])
  const destinationWalletName = destinationWallet == null ? '' : getWalletName(destinationWallet)
  const destinationDenomination = useSelector(state =>
    destinationWallet == null ? undefined : getDisplayDenomination(state, destinationWallet.currencyInfo.pluginId, payoutCurrencyCode)
  )
  if (destinationDenomination == null) return null

  const sourceNativeAmount = sub(abs(transaction.nativeAmount), transaction.networkFee)
  const sourceAmount = convertNativeToDisplay(walletDefaultDenom.multiplier)(sourceNativeAmount)
  const destinationAmount = convertNativeToDisplay(destinationDenomination.multiplier)(swapData.payoutNativeAmount)
  const destinationCurrencyCode = destinationDenomination.name

  const symbolString =
    currencyInfo.currencyCode === transaction.currencyCode && walletDefaultDenom.symbol != null ? walletDefaultDenom.symbol : transaction.currencyCode

  const createExchangeDataString = (newline: string = '\n') => {
    const uniqueIdentifier = memos.map((memo, index) => `${memo.value}${index + 1 !== memos.length ? newline : ''}`).toString()
    const exchangeAddresses = spendTargets.map((target, index) => `${target.publicAddress}${index + 1 !== spendTargets.length ? newline : ''}`).toString()
    const { dateTime } = unixToLocaleDateTime(transaction.date)

    return `${lstrings.fio_date_label}: ${dateTime}${newline}${lstrings.transaction_details_exchange_service}: ${plugin.displayName}${newline}${
      lstrings.transaction_details_exchange_order_id
    }: ${orderId || ''}${newline}${lstrings.transaction_details_exchange_source_wallet}: ${walletName}${newline}${
      lstrings.fragment_send_from_label
    }: ${sourceAmount} ${symbolString}${newline}${lstrings.string_to_capitalize}: ${destinationAmount} ${destinationCurrencyCode}${newline}${
      lstrings.transaction_details_exchange_destination_wallet
    }: ${destinationWalletName}${newline}${isEstimate ? lstrings.estimated_quote : lstrings.fixed_quote}${newline}${newline}${
      lstrings.transaction_details_exchange_exchange_address
    }:${newline}${exchangeAddresses}${newline}${newline}${
      lstrings.transaction_details_exchange_exchange_unique_id
    }:${newline}${uniqueIdentifier}${newline}${newline}${lstrings.transaction_details_exchange_payout_address}:${newline}${payoutAddress}${newline}${newline}${
      lstrings.transaction_details_exchange_refund_address
    }:${newline}${refundAddress || ''}${newline}`
  }

  return (
    <CardUi4 sections>
      <RowUi4 rightButtonType="touchable" title={lstrings.transaction_details_exchange_details} onPress={handleExchangeDetails}>
        <View style={styles.tileColumn}>
          <EdgeText>{lstrings.title_exchange + ' ' + sourceAmount + ' ' + symbolString}</EdgeText>
          <EdgeText>{lstrings.string_to_capitalize + ' ' + destinationAmount + ' ' + destinationCurrencyCode}</EdgeText>
          <EdgeText>{swapData.isEstimate ? lstrings.estimated_quote : lstrings.fixed_quote}</EdgeText>
        </View>
      </RowUi4>
      {orderUri == null ? null : (
        <RowUi4 rightButtonType="touchable" title={lstrings.transaction_details_exchange_status_page} onPress={handleLink} body={swapData.orderUri} />
      )}
      {plugin.supportEmail == null ? null : (
        <RowUi4 rightButtonType="touchable" title={lstrings.transaction_details_exchange_support} onPress={handleEmail} body={swapData.plugin.supportEmail} />
      )}
    </CardUi4>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileColumn: {
    flexDirection: 'column',
    justifyContent: 'center'
  }
}))
