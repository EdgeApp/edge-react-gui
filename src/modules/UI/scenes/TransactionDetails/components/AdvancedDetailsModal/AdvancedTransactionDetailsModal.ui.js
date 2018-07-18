// @flow

import React, { Component } from 'react'
import { TouchableOpacity, Linking } from 'react-native'
import Text from '../../../../components/FormattedText/FormattedText.ui.js'
import { InteractiveModal } from '../../../../components/Modals/InteractiveModal/InteractiveModal.ui.js'
import { Icon } from '../../../../components/Icon/Icon.ui.js'
import * as Constants from '../../../../../../constants/indexConstants.js'

import s from '../../../../../../locales/strings.js'
import styles, { activeOpacity } from '../../style.js'

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

  render () {
    return (
      <InteractiveModal
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
          <InteractiveModal.Description style={{textAlign: 'center'}}>{this.props.txid}</InteractiveModal.Description>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TouchableOpacity onPress={this.handleClick} style={styles.blockExplorerButton} activeOpacity={activeOpacity}>
                <Text style={styles.blockExplorerButtonText}>{s.strings.transaction_details_show_advanced_block_explorer}</Text>
              </TouchableOpacity>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
