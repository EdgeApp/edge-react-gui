// @flow

import React, { Component } from 'react'
import { Text } from 'react-native'

import s from '../../locales/strings'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { InteractiveModal } from '../../modules/UI/components/Modals/index'

export type Props = {
  onDone: boolean => mixed
}
export class RestoreWalletsModal extends Component<Props> {
  render () {
    const { onDone } = this.props

    return (
      <InteractiveModal>
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
              <SecondaryButton onPress={() => onDone(false)}>
                <SecondaryButton.Text>
                  <Text>{s.strings.restore_wallets_modal_cancel}</Text>
                </SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>

            <InteractiveModal.Item>
              <PrimaryButton onPress={() => onDone(true)}>
                <PrimaryButton.Text>
                  <Text>{s.strings.restore_wallets_modal_confirm}</Text>
                </PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
