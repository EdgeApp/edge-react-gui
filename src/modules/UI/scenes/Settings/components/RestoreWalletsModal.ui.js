// @flow

import React, { Component } from 'react'
import { Text } from 'react-native'

import s from '../../../../../locales/strings'
import { PrimaryButton, SecondaryButton } from '../../../components/Buttons'
import { Icon } from '../../../components/Icon/Icon.ui'
import { InteractiveModal } from '../../../components/Modals'

export type Props = {
  isActive: boolean,
  onConfirm: () => void,
  onBackButtonPress: () => void,
  onBackdropPress: () => void,
  onCancel: () => void
}
export class RestoreWalletsModal extends Component<Props> {
  render () {
    const { onBackButtonPress, onBackdropPress, isActive, onConfirm, onCancel } = this.props

    return (
      <InteractiveModal isActive={isActive} onBackdropPress={onBackdropPress} onBackButtonPress={onBackButtonPress}>
        <InteractiveModal.Icon>
          <Icon style={{}} type={'entypo'} name="wallet" size={30} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{s.strings.restore_wallets_modal_title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description>
            <Text>{s.strings.restore_wallets_modal_description}</Text>
          </InteractiveModal.Description>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <PrimaryButton onPress={onConfirm}>
                <PrimaryButton.Text>
                  <Text>{s.strings.restore_wallets_modal_confirm}</Text>
                </PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>

            <InteractiveModal.Item>
              <SecondaryButton onPress={onCancel}>
                <SecondaryButton.Text>
                  <Text>{s.strings.restore_wallets_modal_cancel}</Text>
                </SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
