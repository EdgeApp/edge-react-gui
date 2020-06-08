// @flow

import { PrimaryButton } from 'edge-components'
import type { EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import { type GuiWallet } from '../../types/types.js'
import { type AirshipBridge, AirshipModal, ContentArea, IconCircle, THEME } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<void>,
  edgeTransaction: EdgeTransaction,
  walletDenomination: EdgeDenomination,
  destinationDenomination?: EdgeDenomination,
  destinationWallet?: GuiWallet,
  sourceAmount: string,
  destinationAmount: string,
  theme: EdgeTheme
}

export class TransactionDetailsExchangeDetailsModal extends Component<Props> {
  // copyToClipboard = () => {
  //   const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
  //   Clipboard.setString(requestAddress)
  //   showToast(s.strings.fragment_request_address_copied)
  // }
  render() {
    const { bridge, edgeTransaction, destinationWallet, sourceAmount, destinationAmount, theme } = this.props
    const { spendTargets, swapData } = edgeTransaction

    if (!spendTargets || !swapData) return null

    const styles = getStyles(this.props.theme)
    const { plugin, isEstimate, orderId, payoutAddress, refundAddress } = swapData
    const sourceCurrencyCode = spendTargets[0].currencyCode
    const destinationCurrencyCode = swapData.payoutCurrencyCode
    const walletName = edgeTransaction.wallet && edgeTransaction.wallet.name ? edgeTransaction.wallet.name : ''
    const destinationWalletName = destinationWallet ? destinationWallet.name : ''
    const uniqueIdentifier = spendTargets && spendTargets[0].uniqueIdentifier ? spendTargets[0].uniqueIdentifier : ''
    const exchangeAddresses = spendTargets && spendTargets.length > 0 ? spendTargets.map(target => `${target.publicAddress}`).toString() : ''

    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <IconCircle>
          <FontAwesome name="exchange" size={THEME.rem(1.5)} color={THEME.COLORS.SECONDARY} />
        </IconCircle>
        <Text style={styles.header}>{s.strings.transaction_details_exchange_details}</Text>
        <ContentArea grow>
          <ScrollView>
            <Text>
              {s.strings.transaction_details_exchange_service}: {plugin.displayName}
            </Text>
            <Text>
              {s.strings.transaction_details_exchange_order_id}: {orderId || ''}
            </Text>
            <Text>
              {s.strings.transaction_details_exchange_source_wallet}: {walletName}
            </Text>
            <Text>
              {s.strings.fragment_send_from_label}: {sourceAmount} {sourceCurrencyCode}
            </Text>
            <Text>
              {s.strings.string_to_capitalize}: {destinationAmount} {destinationCurrencyCode}
            </Text>
            <Text>
              {s.strings.transaction_details_exchange_destination_wallet}: {destinationWalletName}
            </Text>
            <Text>{isEstimate ? s.strings.transaction_details_exchange_fixed_rate : s.strings.transaction_details_exchange_variable_rate}</Text>
            <View style={styles.spacer} />
            <Text>{s.strings.transaction_details_exchange_exchange_address}:</Text>
            <Text> {exchangeAddresses}</Text>
            <Text>{s.strings.transaction_details_exchange_exchange_unique_id}:</Text>
            <Text> {uniqueIdentifier}</Text>
            <Text>{s.strings.transaction_details_exchange_payout_address}:</Text>
            <Text> {payoutAddress}</Text>
            <Text>{s.strings.transaction_details_exchange_refund_address}:</Text>
            <Text> {refundAddress || ''}</Text>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <PrimaryButton style={[styles.button, { marginRight: theme.rem(0.25) }]} onPress={() => bridge.resolve()}>
              <PrimaryButton.Text>{s.strings.fragment_request_copy_title}</PrimaryButton.Text>
            </PrimaryButton>
            <PrimaryButton style={[styles.button, { marginRight: theme.rem(0.25) }]} onPress={() => bridge.resolve()}>
              <PrimaryButton.Text>{s.strings.string_ok_cap}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
        </ContentArea>
      </AirshipModal>
    )
  }
}

const getStyles = (theme: EdgeTheme) => {
  return StyleSheet.create({
    header: {
      width: '100%',
      textAlign: 'center',
      fontSize: theme.rem(1.5),
      paddingTop: theme.rem(0.75)
    },
    buttonContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    button: {
      width: '100%'
    },
    spacer: {
      height: theme.rem(1)
    }
  })
}
