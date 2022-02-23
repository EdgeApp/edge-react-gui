// @flow

import type { EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { Linking, Platform, ScrollView, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import SafariView from 'react-native-safari-view'

import s from '../../locales/strings.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { ModalCloseArrow } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { Tile } from '../themed/Tile.js'

const localizedFeeText = {
  satPerVByte: s.strings.transaction_details_advance_details_satpervbyte,
  gasPrice: s.strings.transaction_details_advance_details_gasprice,
  gasLimit: s.strings.transaction_details_advance_details_gaslimit
}

const feeString = {
  high: s.strings.mining_fee_high_label_choice,
  standard: s.strings.mining_fee_standard_label_choice,
  low: s.strings.mining_fee_low_label_choice
}

type OwnProps = {
  bridge: AirshipBridge<null>,
  transaction: EdgeTransaction,
  url?: string
}

type Props = OwnProps & ThemeProps

class TransactionAdvanceDetailsComponent extends PureComponent<Props> {
  getRecipientAddress = () => (this.props.transaction.spendTargets ? this.props.transaction.spendTargets[0].publicAddress : '')

  openUrl = () => {
    const { url } = this.props
    if (url == null || url === '') return
    if (Platform.OS === 'ios') {
      return SafariView.isAvailable()
        .then(SafariView.show({ url }))
        .catch(error => {
          Linking.openURL(url)
          console.log(error)
        })
    }
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      }
    })
  }

  openProveUrl = () => {
    const { txid, txSecret } = this.props.transaction
    const recipientAddress = this.getRecipientAddress()
    if (recipientAddress === '' || txid === '' || txSecret == null) return
    const url = `https://blockchair.com/monero/transaction/${txid}?address=${recipientAddress}&viewkey=${txSecret}&txprove=1`
    if (Platform.OS === 'ios') {
      return SafariView.isAvailable()
        .then(SafariView.show({ url }))
        .catch(error => {
          Linking.openURL(url)
          console.log(error)
        })
    }
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      }
    })
  }

  renderFeeOptions(): string {
    const { networkFeeOption, requestedCustomFee } = this.props.transaction

    if (networkFeeOption === 'custom') {
      return `${s.strings.mining_fee_custom_label_choice}\n${this.renderFees(requestedCustomFee)}`
    }

    return networkFeeOption != null ? feeString[networkFeeOption] : s.strings.mining_fee_standard_label_choice
  }

  renderFees(fees: Object = {}): string {
    let feeValueText = ''

    for (const feeKey of Object.keys(fees)) {
      const feeFullString = `${localizedFeeText[feeKey] ?? feeKey} ${fees[feeKey]}`
      feeValueText = feeValueText === '' ? feeValueText + feeFullString : feeValueText + `\n${feeFullString}`
    }

    return feeValueText
  }

  render() {
    const { bridge, theme, url } = this.props
    const { feeRateUsed, networkFeeOption, signedTx, txid, txSecret, deviceDescription } = this.props.transaction
    const recipientAddress = this.getRecipientAddress()
    const styles = getStyles(theme)

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCancel} paddingRem={0}>
        <View style={styles.headerContainer}>
          <EdgeText style={styles.headerText}>{s.strings.transaction_details_advance_details_header}</EdgeText>
        </View>
        <View style={styles.body}>
          <ScrollView>
            <Tile type="copy" title={s.strings.transaction_details_tx_id_modal_title} body={txid} />
            {url != null && url !== '' && (
              <Tile
                type="touchable"
                title={s.strings.transaction_details_tx_id_modal_title}
                body={s.strings.transaction_details_advance_details_show_explorer}
                onPress={this.openUrl}
              />
            )}
            {networkFeeOption != null && (
              <Tile type="static" title={s.strings.transaction_details_advance_details_fee_setting} body={this.renderFeeOptions()} />
            )}
            {feeRateUsed != null && <Tile type="static" title={s.strings.transaction_details_advance_details_fee_used} body={this.renderFees(feeRateUsed)} />}
            {txSecret != null && <Tile type="copy" title={s.strings.transaction_details_advance_details_txSecret} body={txSecret} />}
            {txSecret != null && recipientAddress !== '' && txid !== '' && (
              <Tile
                type="touchable"
                title={s.strings.transaction_details_advance_details_payment_proof}
                body={s.strings.transaction_details_advance_details_show_explorer}
                onPress={this.openProveUrl}
              />
            )}
            {signedTx != null && signedTx !== '' ? (
              <Tile type="copy" title={s.strings.transaction_details_advance_details_raw_txbytes} body={signedTx} maximumHeight="small" />
            ) : null}

            {deviceDescription != null && <Tile type="static" title={s.strings.transaction_details_advance_details_device} body={deviceDescription} />}
          </ScrollView>
        </View>
        <ModalCloseArrow onPress={this.handleCancel} />
      </ThemedModal>
    )
  }

  handleCancel = () => {
    const { bridge } = this.props
    bridge.resolve(null)
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    height: theme.rem(3.75),
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerText: {
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  body: {
    maxHeight: theme.rem(20)
  }
}))

export const TransactionAdvanceDetails = withTheme(TransactionAdvanceDetailsComponent)
