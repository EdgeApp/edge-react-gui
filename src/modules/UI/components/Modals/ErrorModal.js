// @flow

import React from 'react'
import { Text } from 'react-native'

import { EXCLAMATION, MATERIAL_COMMUNITY } from '../../../../constants/IconConstants.js'
import s from '../../../../locales/strings.js'
import { PrimaryButton } from '../Buttons/PrimaryButton.ui.js'
import { Icon } from '../Icon/Icon.ui.js'
import { InteractiveModal } from './InteractiveModal/InteractiveModal.ui.js'

type Props = {
  onDone(): mixed
}

export const errorModal = (title: string, error: Error) =>
  class ErrorModal extends React.Component<Props> {
    render () {
      return (
        <InteractiveModal>
          <InteractiveModal.Icon>
            <Icon type={MATERIAL_COMMUNITY} name={EXCLAMATION} size={30} />
          </InteractiveModal.Icon>

          <InteractiveModal.Title>
            <Text style={{ textAlign: 'center' }}>{title}</Text>
          </InteractiveModal.Title>

          <InteractiveModal.Body>
            <InteractiveModal.Description style={{ textAlign: 'center' }}>{error.message}</InteractiveModal.Description>
          </InteractiveModal.Body>

          <InteractiveModal.Footer>
            <InteractiveModal.Row>
              <InteractiveModal.Item>
                <PrimaryButton
                  onPress={() => {
                    this.props.onDone()
                  }}
                >
                  <PrimaryButton.Text>{s.strings.string_ok}</PrimaryButton.Text>
                </PrimaryButton>
              </InteractiveModal.Item>
            </InteractiveModal.Row>
          </InteractiveModal.Footer>
        </InteractiveModal>
      )
    }
  }
