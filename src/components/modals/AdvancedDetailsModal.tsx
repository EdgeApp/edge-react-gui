import { EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { ScrollView, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { openBrowserUri } from '../../util/WebUtils'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ThemedModal } from '../themed/ThemedModal'
import { Tile } from '../tiles/Tile'

const localizedFeeText = {
  satPerVByte: lstrings.transaction_details_advance_details_satpervbyte,
  gasPrice: lstrings.transaction_details_advance_details_gasprice,
  gasLimit: lstrings.transaction_details_advance_details_gaslimit
}

const feeString = {
  high: lstrings.mining_fee_high_label_choice,
  standard: lstrings.mining_fee_standard_label_choice,
  low: lstrings.mining_fee_low_label_choice
}

interface OwnProps {
  bridge: AirshipBridge<void>
  transaction: EdgeTransaction
  url?: string
}

type Props = OwnProps & ThemeProps

export class AdvancedDetailsModalComponent extends PureComponent<Props> {
  getRecipientAddress = () => (this.props.transaction.spendTargets ? this.props.transaction.spendTargets[0].publicAddress : '')

  openUrl = () => {
    const { url } = this.props
    if (url == null || url === '') return
    openBrowserUri(url)
  }

  openProveUrl = () => {
    const { txid, txSecret } = this.props.transaction
    const recipientAddress = this.getRecipientAddress()
    if (recipientAddress === '' || txid === '' || txSecret == null) return
    const url = `https://blockchair.com/monero/transaction/${txid}?address=${recipientAddress}&viewkey=${txSecret}&txprove=1`
    openBrowserUri(url)
  }

  renderFeeOptions(): string {
    const { networkFeeOption, requestedCustomFee } = this.props.transaction

    if (networkFeeOption === 'custom') {
      return `${lstrings.mining_fee_custom_label_choice}\n${this.renderFees(requestedCustomFee)}`
    }

    return networkFeeOption != null ? feeString[networkFeeOption] : lstrings.mining_fee_standard_label_choice
  }

  renderFees(fees: any = {}): string {
    let feeValueText = ''

    for (const feeKey of Object.keys(fees)) {
      // @ts-expect-error
      const feeFullString = `${localizedFeeText[feeKey] ?? feeKey} ${fees[feeKey]}`
      feeValueText = feeValueText === '' ? feeValueText + feeFullString : feeValueText + `\n${feeFullString}`
    }

    return feeValueText
  }

  render() {
    const { bridge, theme, url } = this.props
    const { feeRateUsed, networkFeeOption, ourReceiveAddresses, signedTx, txid, txSecret, deviceDescription } = this.props.transaction
    const recipientAddress = this.getRecipientAddress()
    const styles = getStyles(theme)
    let receiveAddressesString
    if (ourReceiveAddresses != null && ourReceiveAddresses.length > 0) {
      receiveAddressesString = ourReceiveAddresses.join('\n')
    }

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCancel} paddingRem={0}>
        <View style={styles.headerContainer}>
          <EdgeText style={styles.headerText}>{lstrings.transaction_details_advance_details_header}</EdgeText>
        </View>
        <View style={styles.body}>
          <ScrollView>
            <Tile type="copy" title={lstrings.transaction_details_tx_id_modal_title} body={txid} />
            {url != null && url !== '' && (
              <Tile
                type="touchable"
                title={lstrings.transaction_details_tx_id_modal_title}
                body={lstrings.transaction_details_advance_details_show_explorer}
                onPress={this.openUrl}
              />
            )}
            {receiveAddressesString != null && <Tile type="static" title={lstrings.my_receive_addresses_title} body={receiveAddressesString} />}
            {networkFeeOption != null && <Tile type="static" title={lstrings.transaction_details_advance_details_fee_setting} body={this.renderFeeOptions()} />}
            {feeRateUsed != null && <Tile type="static" title={lstrings.transaction_details_advance_details_fee_used} body={this.renderFees(feeRateUsed)} />}
            {txSecret != null && <Tile type="copy" title={lstrings.transaction_details_advance_details_txSecret} body={txSecret} />}
            {txSecret != null && recipientAddress !== '' && txid !== '' && (
              <Tile
                type="touchable"
                title={lstrings.transaction_details_advance_details_payment_proof}
                body={lstrings.transaction_details_advance_details_show_explorer}
                onPress={this.openProveUrl}
              />
            )}
            {signedTx != null && signedTx !== '' ? (
              <Tile type="copy" title={lstrings.transaction_details_advance_details_raw_txbytes} body={signedTx} maximumHeight="small" />
            ) : null}

            {deviceDescription != null && <Tile type="static" title={lstrings.transaction_details_advance_details_device} body={deviceDescription} />}
          </ScrollView>
        </View>
      </ThemedModal>
    )
  }

  handleCancel = () => {
    const { bridge } = this.props
    bridge.resolve()
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

export const AdvancedDetailsModal = withTheme(AdvancedDetailsModalComponent)
