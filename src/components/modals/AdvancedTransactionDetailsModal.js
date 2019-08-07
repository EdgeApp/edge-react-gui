// @flow

import { PrimaryButton, SecondaryButton, TertiaryButton } from 'edge-components'
import { type EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, Clipboard, Linking } from 'react-native'

import { MATERIAL_COMMUNITY, TELESCOPE } from '../../constants/indexConstants.js'
import { scale } from '../../lib/scaling.js'
import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { InteractiveModal } from '../../modules/UI/components/Modals/InteractiveModal/InteractiveModal.ui.js'
import styles, { activeOpacity } from '../../styles/scenes/TransactionDetailsStyle.js'

export type AdvancedTransactionDetailsModalOwnProps = {
  ...EdgeTransaction,
  txExplorerUrl: string | null,
  onDone: () => void,
  txid: string,
  signedTx?: string
}

export class AdvancedTransactionDetailsModal extends Component<AdvancedTransactionDetailsModalOwnProps> {
  handleClick = () => {
    if (this.props.txExplorerUrl) {
      Linking.canOpenURL(this.props.txExplorerUrl).then(supported => {
        if (supported) {
          Linking.openURL(this.props.txExplorerUrl)
        }
      })
    }
  }

  copyTxIdToClipboard = () => {
    const { txid, onDone } = this.props
    Clipboard.setString(txid)
    Alert.alert(s.strings.transaction_details_copy_txid_title, s.strings.transaction_details_copy_txid_message, [
      { text: s.strings.string_ok, onPress: onDone }
    ])
  }

  copyRawHexToClipboard = () => {
    const { signedTx, onDone } = this.props
    Clipboard.setString(signedTx)
    Alert.alert(s.strings.transaction_details_copy_txid_title, s.strings.transaction_details_copy_raw_hex_message, [
      { text: s.strings.string_ok, onPress: onDone }
    ])
  }

  render () {
    const { txid, signedTx } = this.props
    const isTxId = !!txid
    const hexRegExp = /^[0-9a-fA-F]+$/
    let isSignedTx
    if (signedTx && hexRegExp.test(signedTx)) {
      isSignedTx = true
    } else {
      isSignedTx = false
    }
    return (
      <InteractiveModal>
        <InteractiveModal.Icon>
          <Icon style={styles.txIDIcon} name={TELESCOPE} type={MATERIAL_COMMUNITY} size={scale(34)} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.transaction_details_tx_id_modal_title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{ textAlign: 'center' }}>
            <Text>{isTxId && `${txid}\n`}</Text>
          </InteractiveModal.Description>
        </InteractiveModal.Body>
        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TertiaryButton onPress={this.handleClick} activeOpacity={activeOpacity}>
                <TertiaryButton.Text>{s.strings.transaction_details_show_advanced_block_explorer}</TertiaryButton.Text>
              </TertiaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <PrimaryButton onPress={this.copyTxIdToClipboard}>
                <PrimaryButton.Text>{s.strings.transaction_details_copy_tx_id}</PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
          {isSignedTx && (
            <InteractiveModal.Row>
              <InteractiveModal.Item>
                <SecondaryButton onPress={this.copyRawHexToClipboard}>
                  <SecondaryButton.Text>{s.strings.transaction_details_copy_signed_tx}</SecondaryButton.Text>
                </SecondaryButton>
              </InteractiveModal.Item>
            </InteractiveModal.Row>
          )}
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}

export type AdvancedTransactionDetailsOpts = {
  txid: string,
  txExplorerUrl: string | null,
  signedTx?: string
}

export const createAdvancedTransactionDetailsModal = (opts: AdvancedTransactionDetailsOpts) => {
  function AdvancedTransactionDetailsWrapped (props: { +onDone: Function }) {
    return <AdvancedTransactionDetailsModal {...opts} {...props} />
  }
  return AdvancedTransactionDetailsWrapped
}
