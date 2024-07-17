import { abs, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction, EdgeTxSwap } from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform, View } from 'react-native'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom, selectDisplayDenom, selectDisplayDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDisplay, unixToLocaleDateTime } from '../../util/utils'
import { RawTextModal } from '../modals/RawTextModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  swapData: EdgeTxSwap
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
}

export function SwapDetailsCard(props: Props) {
  const { swapData, transaction, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { memos = [], spendTargets = [], tokenId } = transaction
  const { currencyInfo } = wallet
  const walletName = useWalletName(wallet)
  const walletDefaultDenom = useSelector(state =>
    currencyInfo.currencyCode === transaction.currencyCode
      ? getExchangeDenom(wallet.currencyConfig, tokenId)
      : selectDisplayDenom(state, wallet.currencyConfig, tokenId)
  )

  const { isEstimate, orderId, orderUri, payoutAddress, payoutWalletId, plugin, refundAddress } = swapData
  const payoutCurrencyCode = swapData.payoutCurrencyCode

  const handleExchangeDetails = useHandler(async () => {
    await Airship.show(bridge => <RawTextModal bridge={bridge} body={createExchangeDataString()} title={lstrings.transaction_details_exchange_details} />)
  })

  const handleEmail = useHandler(() => {
    const body = createExchangeDataString('<br />')

    Mailer.mail(
      {
        subject: sprintf(lstrings.transaction_details_exchange_support_request, plugin.displayName),
        recipients: plugin.supportEmail != null ? [plugin.supportEmail] : undefined,
        body,
        isHTML: true
      },
      (error, event) => {
        if (String(error) === 'not_available') {
          showError(lstrings.error_no_email_account)
          return
        }

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
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const destinationWallet = currencyWallets[payoutWalletId]
  const destinationWalletName = destinationWallet == null ? '' : getWalletName(destinationWallet)
  const destinationDenomination = useSelector(state =>
    destinationWallet == null ? undefined : selectDisplayDenomByCurrencyCode(state, destinationWallet.currencyConfig, payoutCurrencyCode)
  )
  if (destinationDenomination == null) return null

  const sourceNativeAmount = sub(abs(transaction.nativeAmount), transaction.networkFee)
  const sourceAmount = convertNativeToDisplay(walletDefaultDenom.multiplier)(sourceNativeAmount)
  const sourceAssetName = tokenId == null ? walletDefaultDenom.name : `${walletDefaultDenom.name} (${getExchangeDenom(wallet.currencyConfig, null).name})`

  const destinationAmount = convertNativeToDisplay(destinationDenomination.multiplier)(swapData.payoutNativeAmount)
  const destinationAssetName =
    payoutCurrencyCode === getExchangeDenom(destinationWallet.currencyConfig, null).name
      ? payoutCurrencyCode
      : `${payoutCurrencyCode} (${getExchangeDenom(destinationWallet.currencyConfig, null).name})`

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
    }: ${sourceAmount} ${sourceAssetName}${newline}${lstrings.string_to_capitalize}: ${destinationAmount} ${destinationAssetName}${newline}${
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
    <EdgeCard sections>
      <EdgeRow rightButtonType="touchable" title={lstrings.transaction_details_exchange_details} onPress={handleExchangeDetails}>
        <View style={styles.tileColumn}>
          <EdgeText>{lstrings.title_exchange + ' ' + sourceAmount + ' ' + symbolString}</EdgeText>
          <EdgeText>{lstrings.string_to_capitalize + ' ' + destinationAmount + ' ' + destinationAssetName}</EdgeText>
          <EdgeText>{swapData.isEstimate ? lstrings.estimated_quote : lstrings.fixed_quote}</EdgeText>
        </View>
      </EdgeRow>
      {orderUri == null ? null : (
        <EdgeRow rightButtonType="touchable" title={lstrings.transaction_details_exchange_status_page} onPress={handleLink} body={swapData.orderUri} />
      )}
      {plugin.supportEmail == null ? null : (
        <EdgeRow rightButtonType="touchable" title={lstrings.transaction_details_exchange_support} onPress={handleEmail} body={swapData.plugin.supportEmail} />
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
