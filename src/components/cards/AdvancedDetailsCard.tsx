import type { EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'

import { lstrings } from '../../locales/strings'
import { openBrowserUri } from '../../util/WebUtils'
import { EdgeRow } from '../rows/EdgeRow'
import { type ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeCard } from './EdgeCard'

const localizedFeeText = {
  satPerVByte: lstrings.transaction_details_advance_details_satpervbyte,
  gasPrice: lstrings.transaction_details_advance_details_gasprice,
  minerTip: lstrings.transaction_details_advance_details_minertip,
  gasLimit: lstrings.transaction_details_advance_details_gaslimit
}

const feeString = {
  high: lstrings.mining_fee_high_label_choice,
  standard: lstrings.mining_fee_standard_label_choice,
  low: lstrings.mining_fee_low_label_choice
}

interface OwnProps {
  transaction: EdgeTransaction
  url?: string
}

type Props = OwnProps & ThemeProps

export class AdvancedDetailsCardComponent extends PureComponent<Props> {
  getRecipientAddress = (): string => {
    const spendTargets = this.props.transaction.spendTargets
    const spendTarget = spendTargets != null ? spendTargets[0] : undefined
    if (spendTarget != null) {
      return spendTarget.publicAddress
    }
    return ''
  }

  /**
   * The transaction key, preferring the one the core saved with the
   * transaction. Monero sends made while the send path reported no key only
   * carry their key in otherParams, mirrored there by the wallet engine from
   * its own store, so fall back to that.
   */
  getTxSecret = (): string | undefined => {
    const { otherParams, txSecret } = this.props.transaction
    if (txSecret != null) return txSecret
    const mirrored = otherParams?.txSecret
    return typeof mirrored === 'string' ? mirrored : undefined
  }

  handleUrlPress = async (): Promise<void> => {
    const { url } = this.props
    if (url == null || url === '') return
    await openBrowserUri(url)
  }

  handleProveUrlPress = async (): Promise<void> => {
    const { txid } = this.props.transaction
    const txSecret = this.getTxSecret()
    const recipientAddress = this.getRecipientAddress()
    if (recipientAddress === '' || txid === '' || txSecret == null) return
    const url = `https://blockchair.com/monero/transaction/${txid}?address=${recipientAddress}&viewkey=${txSecret}&txprove=1`
    await openBrowserUri(url)
  }

  renderFeeOptions(): string {
    const { networkFeeOption, requestedCustomFee } = this.props.transaction

    if (networkFeeOption === 'custom') {
      return `${lstrings.mining_fee_custom_label_choice}\n${this.renderFees(
        requestedCustomFee
      )}`
    }

    return networkFeeOption != null
      ? feeString[networkFeeOption]
      : lstrings.mining_fee_standard_label_choice
  }

  renderFees(fees: any = {}): string {
    let feeValueText = ''

    for (const feeKey of Object.keys(fees)) {
      // @ts-expect-error - feeKey indexes an untyped fee object, so it cannot
      // be proven to be a key of localizedFeeText
      const feeFullString = `${localizedFeeText[feeKey] ?? feeKey} ${
        fees[feeKey]
      }`
      feeValueText =
        feeValueText === ''
          ? feeValueText + feeFullString
          : feeValueText + `\n${feeFullString}`
    }

    return feeValueText
  }

  render(): React.ReactNode {
    const { url } = this.props
    const {
      feeRateUsed,
      networkFeeOption,
      ourReceiveAddresses,
      signedTx,
      txid,
      deviceDescription
    } = this.props.transaction
    const txSecret = this.getTxSecret()
    const recipientAddress = this.getRecipientAddress()
    let receiveAddressesString
    if (ourReceiveAddresses != null && ourReceiveAddresses.length > 0) {
      receiveAddressesString = ourReceiveAddresses.join('\n')
    }

    return (
      <EdgeCard sections>
        {url != null && url !== '' && (
          <EdgeRow
            rightButtonType="touchable"
            title={lstrings.transaction_details_view_advanced_data}
            body={lstrings.transaction_details_advance_details_show_explorer}
            onPress={this.handleUrlPress}
          />
        )}
        {receiveAddressesString != null && (
          <EdgeRow
            rightButtonType="copy"
            title={lstrings.my_receive_addresses_title}
            body={receiveAddressesString}
          />
        )}
        {networkFeeOption != null && (
          <EdgeRow
            title={lstrings.transaction_details_advance_details_fee_setting}
            body={this.renderFeeOptions()}
          />
        )}
        {feeRateUsed != null && (
          <EdgeRow
            title={lstrings.transaction_details_advance_details_fee_used}
            body={this.renderFees(feeRateUsed)}
          />
        )}
        {txSecret != null && (
          <EdgeRow
            rightButtonType="copy"
            title={lstrings.transaction_details_advance_details_txSecret}
            body={txSecret}
          />
        )}
        {txSecret != null && recipientAddress !== '' && txid !== '' && (
          <EdgeRow
            rightButtonType="touchable"
            title={lstrings.transaction_details_advance_details_payment_proof}
            body={lstrings.transaction_details_advance_details_show_explorer}
            onPress={this.handleProveUrlPress}
          />
        )}
        {signedTx != null && signedTx !== '' ? (
          <EdgeRow
            rightButtonType="copy"
            title={lstrings.transaction_details_advance_details_raw_txbytes}
            body={signedTx}
            maximumHeight="small"
          />
        ) : null}

        {deviceDescription != null && (
          <EdgeRow
            title={lstrings.transaction_details_advance_details_device}
            body={deviceDescription}
          />
        )}
      </EdgeCard>
    )
  }
}

export const AdvancedDetailsCard = withTheme(AdvancedDetailsCardComponent)
