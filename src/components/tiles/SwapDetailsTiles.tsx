import { EdgeCurrencyWallet, EdgeTransaction, EdgeTxSwap } from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform, View } from 'react-native'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDisplay } from '../../util/utils'
import { RawTextModal } from '../modals/RawTextModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

interface Props {
  swapData: EdgeTxSwap
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
}

export function SwapDetailsTiles(props: Props) {
  const { swapData, transaction, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { currencyCode, spendTargets = [] } = transaction
  const { currencyInfo } = wallet
  const walletName = useWalletName(wallet)
  const walletDefaultDenom = useSelector(state =>
    currencyInfo.currencyCode === transaction.currencyCode
      ? getExchangeDenomination(state, currencyInfo.pluginId, currencyCode)
      : getDisplayDenomination(state, currencyInfo.pluginId, currencyCode)
  )

  const { isEstimate, orderId, orderUri, payoutAddress, payoutWalletId, plugin, refundAddress } = swapData
  const payoutCurrencyCode = swapData.payoutCurrencyCode.toUpperCase()

  const handleExchangeDetails = useHandler(() => {
    Airship.show(bridge => <RawTextModal bridge={bridge} body={createExchangeDataString()} title={s.strings.transaction_details_exchange_details} />)
  })

  const handleEmail = useHandler(() => {
    const email = plugin.supportEmail
    const body = createExchangeDataString('<br />')

    Mailer.mail(
      {
        subject: sprintf(s.strings.transaction_details_exchange_support_request, plugin.displayName),
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

  const handleLink = () => {
    if (orderUri == null) return

    if (Platform.OS === 'ios') {
      SafariView.isAvailable()
        .then(async available => {
          if (available) await SafariView.show({ url: orderUri })
          else Linking.openURL(orderUri)
        })
        .catch(error => {
          showError(error)
          Linking.openURL(orderUri)
        })
    } else {
      Linking.openURL(orderUri)
    }
  }

  // The wallet may have been deleted:
  const destinationWallet = useSelector(state => state.core.account.currencyWallets[payoutWalletId])
  const destinationWalletName = destinationWallet == null ? '' : getWalletName(destinationWallet)
  const destinationDenomination = useSelector(state =>
    destinationWallet == null ? undefined : getDisplayDenomination(state, destinationWallet.currencyInfo.pluginId, payoutCurrencyCode)
  )
  if (destinationDenomination == null) return null

  const sourceAmount = convertNativeToDisplay(walletDefaultDenom.multiplier)(spendTargets[0].nativeAmount)
  const destinationAmount = convertNativeToDisplay(destinationDenomination.multiplier)(swapData.payoutNativeAmount)
  const destinationCurrencyCode = destinationDenomination.name

  const symbolString =
    currencyInfo.currencyCode === transaction.currencyCode && walletDefaultDenom.symbol != null ? walletDefaultDenom.symbol : transaction.currencyCode

  const createExchangeDataString = (newline: string = '\n') => {
    const uniqueIdentifier = spendTargets[0].uniqueIdentifier ?? ''
    const exchangeAddresses = spendTargets.map((target, index) => `${target.publicAddress}${index + 1 !== spendTargets.length ? newline : ''}`).toString()

    return `${s.strings.transaction_details_exchange_service}: ${plugin.displayName}${newline}${s.strings.transaction_details_exchange_order_id}: ${
      orderId || ''
    }${newline}${s.strings.transaction_details_exchange_source_wallet}: ${walletName}${newline}${
      s.strings.fragment_send_from_label
    }: ${sourceAmount} ${symbolString}${newline}${s.strings.string_to_capitalize}: ${destinationAmount} ${destinationCurrencyCode}${newline}${
      s.strings.transaction_details_exchange_destination_wallet
    }: ${destinationWalletName}${newline}${isEstimate ? s.strings.estimated_quote : s.strings.fixed_quote}${newline}${newline}${
      s.strings.transaction_details_exchange_exchange_address
    }:${newline}  ${exchangeAddresses}${newline}${s.strings.transaction_details_exchange_exchange_unique_id}:${newline}  ${uniqueIdentifier}${newline}${
      s.strings.transaction_details_exchange_payout_address
    }:${newline}  ${payoutAddress}${newline}${s.strings.transaction_details_exchange_refund_address}:${newline}  ${refundAddress || ''}${newline}`
  }

  return (
    <>
      <Tile type="touchable" title={s.strings.transaction_details_exchange_details} onPress={handleExchangeDetails}>
        <View style={styles.tileColumn}>
          <EdgeText style={styles.tileTextBottom}>{s.strings.title_exchange + ' ' + sourceAmount + ' ' + symbolString}</EdgeText>
          <EdgeText style={styles.tileTextBottom}>{s.strings.string_to_capitalize + ' ' + destinationAmount + ' ' + destinationCurrencyCode}</EdgeText>
          <EdgeText style={styles.tileTextBottom}>{swapData.isEstimate ? s.strings.estimated_quote : s.strings.fixed_quote}</EdgeText>
        </View>
      </Tile>
      {orderUri == null ? null : (
        <Tile type="touchable" title={s.strings.transaction_details_exchange_status_page} onPress={handleLink} body={swapData.orderUri} />
      )}
      {plugin.supportEmail == null ? null : (
        <Tile type="touchable" title={s.strings.transaction_details_exchange_support} onPress={handleEmail} body={swapData.plugin.supportEmail} />
      )}
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileColumn: {
    flexDirection: 'column',
    justifyContent: 'center'
  },
  tileTextBottom: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  }
}))
