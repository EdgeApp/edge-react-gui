// @flow

import React, { Component } from 'react'
import { Text } from 'react-native'

import { InteractiveModal, PrimaryButton, SecondaryButton } from '../../../../components/Modals'
import { Icon } from '../../../../components/Icon/Icon.ui'
import s from '../../../../../../locales/strings'

export type Props = {
  isActive: boolean,
  onAccept: () => void,
  onBackButtonPress: () => void,
  onBackdropPress: () => void,
  onReject: () => void
}
export class PrimaryModal extends Component<Props> {
  render () {
    const { onBackButtonPress, onBackdropPress, isActive, onAccept, onReject } = this.props

    return (
      <InteractiveModal isActive={isActive} onBackdropPress={onBackdropPress} onBackButtonPress={onBackButtonPress}>
        <InteractiveModal.Icon>
          <Icon style={{transform: [{rotate: '270deg'}]}} type={'ionIcons'} name='ios-key' size={30} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.private_key_modal_sweep_from_private_address}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <PrimaryButton onPress={onAccept}>
                <PrimaryButton.Text>
                  <Text>{s.strings.private_key_modal_import}</Text>
                </PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>

            <InteractiveModal.Item>
              <SecondaryButton onPress={onReject}>
                <SecondaryButton.Text>
                  <Text>{s.strings.private_key_modal_cancel}</Text>
                </SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
