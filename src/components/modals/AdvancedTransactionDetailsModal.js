// @flow

import React, { Component } from 'react'
import { Alert, Clipboard, Linking, TouchableOpacity } from 'react-native'

import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { InteractiveModal } from '../../modules/UI/components/Modals/InteractiveModal/InteractiveModal.ui.js'
import styles, { activeOpacity } from '../../styles/scenes/TransactionDetailsStyle.js'

export type AdvancedTransactionDetailsModalOwnProps = {
  isActive: boolean,
  onExit: () => void,
  txid: string,
  txExplorerUrl: string | null
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

  copyToClipboard = () => {
    Clipboard.setString(this.props.txid)
    Alert.alert(s.strings.transaction_details_copy_txid_title, s.strings.transaction_details_copy_txid_message, [
      { text: s.strings.string_ok, onPress: this.props.onExit }
    ])
  }

  render () {
    return (
      <InteractiveModal
        legacy
        isActive={this.props.isActive}
        onBackButtonPress={this.props.onExit}
        onBackdropPress={this.props.onExit}
        onModalHide={this.props.onExit}
      >
        <InteractiveModal.Icon>
          <Icon style={styles.txIDIcon} name={Constants.QUESTION_ICON} type={Constants.FONT_AWESOME} size={22} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.transaction_details_tx_id_modal_title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{ textAlign: 'center' }}>
            <Text>{this.props.txid}</Text>
          </InteractiveModal.Description>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TouchableOpacity onPress={this.handleClick} style={styles.blockExplorerButton} activeOpacity={activeOpacity}>
                <Text style={styles.blockExplorerButtonText}>{s.strings.transaction_details_show_advanced_block_explorer}</Text>
              </TouchableOpacity>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <PrimaryButton onPress={this.copyToClipboard} style={{ flex: -1 }}>
                <PrimaryButton.Text>{s.strings.fragment_request_copy_title}</PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
