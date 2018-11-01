// @flow

import React, { Component } from 'react'
import { Alert, Clipboard, Platform, Text } from 'react-native'

import { EYE_ICON, ION_ICONS } from '../../constants/IconConstants.js'
import { scale } from '../../lib/scaling.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { InteractiveModal } from '../../modules/UI/components/Modals/InteractiveModal/InteractiveModal.ui.js'

type XPubModalOwnProps = {}

type XPubModalStateProps = {
  xPubSyntax: string,
  visibilityBoolean: boolean
}

type XPubModalDispatchProps = {
  onExit: () => void
}

type XPubModalState = {}

type XPubModalComponentProps = XPubModalOwnProps & XPubModalStateProps & XPubModalDispatchProps

export default class XPubModal extends Component<XPubModalComponentProps, XPubModalState> {
  _onPressCopy = () => {
    try {
      Clipboard.setString(this.props.xPubSyntax)
      Alert.alert(s.strings.fragment_wallets_pubkey_copied_title, s.strings.fragment_wallets_pubkey_copied_success, [
        {
          text: s.strings.string_ok,
          onPress: () => this.props.onExit()
        }
      ])
    } catch (e) {
      console.log('Error:', e.title, e.message)
      Alert.alert('Error', s.strings.fragment_wallets_pubkey_copied_error)
    }
  }

  render () {
    const osPrefix = Platform.OS === 'ios' ? 'ios-' : 'md-'
    return (
      <InteractiveModal
        legacy
        isActive={this.props.visibilityBoolean}
        onBackButtonPress={this.props.onExit}
        onBackdropPress={this.props.onExit}
        onModalHide={this.props.onExit}
      >
        <InteractiveModal.Icon>
          <Icon style={{}} type={ION_ICONS} name={`${osPrefix}${EYE_ICON}`} size={scale(30)} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.fragment_wallets_view_xpub}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{ textAlign: 'center' }}>{this.props.xPubSyntax}</InteractiveModal.Description>
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
