// @flow

import React, { PureComponent } from 'react'
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { getDeviceName } from 'react-native-device-info'
import SafariView from 'react-native-safari-view'

import s from '../../locales/strings.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { ModalCloseArrow } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { Tile } from '../themed/Tile.js'
import { type AirshipBridge } from './modalParts'

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
  networkFeeOption?: 'high' | 'standard' | 'low' | 'custom',
  requestedCustomFee?: Object,
  feeRateUsed?: Object,
  signedTx: string,
  txid: string,
  txSecret?: string,
  recipientAddress?: string,
  url?: string
}

type State = {
  deviceName: string
}

type Props = OwnProps & ThemeProps

class TransactionAdvanceDetailsComponent extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      deviceName: ''
    }
  }

  componentDidMount() {
    getDeviceName().then(deviceName => {
      this.setState({ deviceName })
    })
  }

  openUrl = () => {
    const { url } = this.props
    if (url) {
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
  }

  openProveUrl = () => {
    const { recipientAddress, txid, txSecret } = this.props
    // Early return to satisfy flow. Button isn't visible without all params present.
    if (!recipientAddress || !txid || !txSecret) return
    const url = `https://blockchair.com/monero/transaction/${txid}?address=${recipientAddress}&viewkey=${txSecret}&txprove=1`
    if (url) {
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
  }

  renderFeeOptions(styles: StyleSheet) {
    const { networkFeeOption, requestedCustomFee } = this.props

    if (networkFeeOption === 'custom') {
      return this.renderFees(styles, s.strings.mining_fee_custom_label_choice, requestedCustomFee)
    }
    return <EdgeText style={styles.text}>{networkFeeOption ? feeString[networkFeeOption] : s.strings.mining_fee_standard_label_choice}</EdgeText>
  }

  renderFees(styles: StyleSheet, title: string, fees: Object = {}) {
    const feeRows = []
    for (const feeKey of Object.keys(fees)) {
      const feeString = localizedFeeText[feeKey] || feeKey
      feeRows.push(
        <View key={feeKey} style={styles.feesRow}>
          <EdgeText style={styles.feesRowText}>{feeString + ' '}</EdgeText>
          <EdgeText style={styles.feesRowText}>{fees[feeKey]}</EdgeText>
        </View>
      )
    }
    return (
      <View style={styles.feesContainer}>
        <EdgeText style={styles.feesRowText}>{title + ':'}</EdgeText>
        <View style={styles.feesBodyContainer}>{feeRows}</View>
      </View>
    )
  }

  render() {
    const { bridge, feeRateUsed, networkFeeOption, signedTx, theme, txid, txSecret, recipientAddress, url } = this.props
    const styles = getStyles(theme)

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCancel} paddingRem={0}>
        <View style={styles.headerContainer}>
          <EdgeText style={styles.headerText}>{s.strings.transaction_details_advance_details_header}</EdgeText>
        </View>
        <View style={styles.body}>
          <ScrollView>
            <Tile type="copy" title={s.strings.transaction_details_tx_id_modal_title} body={txid} />
            {url && (
              <Tile
                type="touchable"
                title={s.strings.transaction_details_tx_id_modal_title}
                body={s.strings.transaction_details_advance_details_show_explorer}
                onPress={this.openUrl}
              />
            )}
            {(networkFeeOption || feeRateUsed) && (
              <Tile type="static" title={s.strings.transaction_details_advance_details_fee_info}>
                {networkFeeOption ? this.renderFeeOptions(styles) : null}
                {feeRateUsed ? this.renderFees(styles, s.strings.transaction_details_advance_details_fee_used, feeRateUsed) : null}
              </Tile>
            )}
            {txSecret && <Tile type="copy" title={s.strings.transaction_details_advance_details_txSecret} body={txSecret} />}
            {txSecret && recipientAddress && txid && (
              <Tile
                type="touchable"
                title={s.strings.transaction_details_advance_details_payment_proof}
                body={s.strings.transaction_details_advance_details_show_explorer}
                onPress={this.openProveUrl}
              />
            )}
            {signedTx && signedTx !== '' ? <Tile type="copy" title={s.strings.transaction_details_advance_details_raw_txbytes} body={signedTx} /> : null}

            <Tile type="static" title={s.strings.transaction_details_advance_details_device} body={this.state.deviceName} />
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
  },
  text: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  feesContainer: {
    width: '100%',
    flexDirection: 'row'
  },
  feesBodyContainer: {
    flexDirection: 'column',
    marginLeft: theme.rem(0.25)
  },
  feesRow: {
    flexDirection: 'row'
  },
  feesRowText: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  }
}))

export const TransactionAdvanceDetails = withTheme(TransactionAdvanceDetailsComponent)
