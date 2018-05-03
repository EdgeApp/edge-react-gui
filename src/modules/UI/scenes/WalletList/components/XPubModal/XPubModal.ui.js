// @flow

import React, { Component } from 'react'
import { Platform, Text, Alert, Clipboard } from 'react-native'
import s from '../../../../../../locales/strings.js'
// import StylizedModal from '../../../../components/Modal/Modal.ui'
import { InteractiveModal } from '../../../../components/Modals/InteractiveModal/InteractiveModal.ui.js'
import {PrimaryButton} from '../../../../components/Modals/components/PrimaryButton.ui.js'
import { Icon } from '../../../../components/Icon/Icon.ui.js'
import styles from './style.js'

type XPubModalOwnProps = {

}

type XPubModalStateProps = {
  xPubSyntax: string,
  visibilityBoolean: boolean,
}

type XPubModalDispatchProps = {
  onExit: () => void
}

type XPubModalState = {

}

type XPubModalComponentProps = XPubModalOwnProps & XPubModalStateProps & XPubModalDispatchProps

export default class XPubModal extends Component<XPubModalComponentProps, XPubModalState> {
  _onPressCopy = () => {
    try {
      Clipboard.setString(this.props.xPubSyntax)
      Alert.alert(
        s.strings.fragment_wallets_pubkey_copied_title,
        s.strings.fragment_wallets_pubkey_copied_success,
        [{
          text: s.strings.string_ok, onPress: () => this.props.onExit()
        }]
      )
    } catch (e) {
      console.log('Error:', e.title, e.message)
      Alert.alert('Error', s.strings.fragment_wallets_pubkey_copied_error)
    }
  }

  render () {
    const osPrefix = Platform.OS === 'ios' ? 'ios-' : 'md-'
    // const iconNa = <IonIcon name={`${osPrefix}eye`} size={24} color={colors.primary} style={styles.icon} />
    return (

      <InteractiveModal isActive={this.props.visibilityBoolean} onBackButtonPress={this.props.onExit} onBackdropPress={this.props.onExit} onModalHide={this.props.onExit}>
        <InteractiveModal.Icon>
          <Icon style={{}} type={'ionIcons'} name={`${osPrefix}eye`} size={30} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.fragment_wallets_view_xpub}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={styles.xPubSyntax}>{this.props.xPubSyntax}</InteractiveModal.Description>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <PrimaryButton onPress={this._onPressCopy}>
                <PrimaryButton.Text>{s.strings.fragment_request_copy_title}</PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>

    )
  }
}
