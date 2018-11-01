// @flow

import React, { Component } from 'react'
import { Text } from 'react-native'

import s from '../../locales/strings'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { InteractiveModal } from '../../modules/UI/components/Modals/index'

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
      <InteractiveModal legacy isActive={isActive} onBackdropPress={onBackdropPress} onBackButtonPress={onBackButtonPress}>
        <InteractiveModal.Icon>
          <Icon style={{ transform: [{ rotate: '270deg' }] }} type={'ionIcons'} name="ios-key" size={30} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.private_key_modal_sweep_from_private_address}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <SecondaryButton onPress={onReject} style={{ flex: -1 }}>
                <SecondaryButton.Text>
                  <Text>{s.strings.private_key_modal_cancel}</Text>
                </SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
            <InteractiveModal.Item>
              <PrimaryButton onPress={onAccept} style={{ flex: -1 }}>
                <PrimaryButton.Text>
                  <Text>{s.strings.private_key_modal_import}</Text>
                </PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
