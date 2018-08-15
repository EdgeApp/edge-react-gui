// @flow

import React, { Component } from 'react'
import { Text } from 'react-native'

import { EXCLAMATION, MATERIAL_COMMUNITY } from '../../../../../../constants/IconConstants.js'
import s from '../../../../../../locales/strings.js'
import { PrimaryButton } from '../../../../components/Buttons'
import { Icon } from '../../../../components/Icon/Icon.ui.js'
import { InteractiveModal } from '../../../../components/Modals/InteractiveModal/InteractiveModal.ui.js'

type XRPMinimumModalStateProps = {
  onExit(): void,
  visibilityBoolean: boolean
}

export default class XRPMinimumModal extends Component<XRPMinimumModalStateProps> {
  render () {
    return (
      <InteractiveModal
        isActive={this.props.visibilityBoolean}
        onBackButtonPress={this.props.onExit}
        onBackdropPress={this.props.onExit}
        onModalHide={this.props.onExit}
      >
        <InteractiveModal.Icon>
          <Icon type={MATERIAL_COMMUNITY} name={EXCLAMATION} size={30} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text style={{ textAlign: 'center' }}>{s.strings.request_xrp_minimum_notification_title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{ textAlign: 'center' }}>{s.strings.request_xrp_minimum_notification_body}</InteractiveModal.Description>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <PrimaryButton onPress={this.props.onExit}>
                <PrimaryButton.Text>{s.strings.string_ok}</PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
