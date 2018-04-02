// @flow

import React, { Component } from 'react'
import { Text, View } from 'react-native'

import { Icon } from '../../Icon/Icon.ui.js'
import { InteractiveModal, NonInteractiveModal, PrimaryButton, SecondaryButton } from '..'

import s from '../../../../../locales/strings.js'

type InitialProps = {
  isPrimaryModalVisible: false,
  isSecondaryModalVisible: false,
  publicAddress: null,
  error: null
}
type PrimaryModalVisibleProps = {
  isPrimaryModalVisible: true,
  isSecondaryModalVisible: false,
  publicAddress: string,
  error: null
}
type SecondaryModalVisibleProps = {
  isPrimaryModalVisible: false,
  isSecondaryModalVisible: true,
  publicAddress: string,
  error: Error | null
}
type FixedProps = {
  onSweep: () => void,
  onCancel: () => void,
  reset: () => void
}

type Props = (InitialProps & FixedProps)
  | (PrimaryModalVisibleProps & FixedProps)
  | (SecondaryModalVisibleProps & FixedProps)
export class PrivateKeyModalComponent extends Component<Props> {
  static defaultProps = {
    publicAddress: '0x123f681646d4a755815f9cb19e1acc8565a0c2ac'
  }

  render () {
    const { isPrimaryModalVisible, isSecondaryModalVisible, publicAddress, error } = this.props
    return (
      <View>
        <InteractiveModal isVisible={isPrimaryModalVisible} onBackdropPress={this.onCancel} onBackButtonPress={this.onCancel} onModalHide={this.onModalHide}>
          <InteractiveModal.Icon>
            <Icon style={{}} type={'ionIcons'} name="ios-key" size={30} />
          </InteractiveModal.Icon>

          <InteractiveModal.Title>
            <Text>{s.strings.private_key_import_sweep}</Text>
          </InteractiveModal.Title>

          <InteractiveModal.Body>
            <InteractiveModal.Description>{publicAddress}</InteractiveModal.Description>
          </InteractiveModal.Body>

          <InteractiveModal.Footer>
            <InteractiveModal.Item>
              <PrimaryButton onPress={this.onSweep}>
                <PrimaryButton.Text>{s.strings.private_key_import_sweep}</PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>

            <InteractiveModal.Item>
              <SecondaryButton onPress={this.onCancel}>
                <SecondaryButton.Text>{s.strings.private_key_import_cancel}</SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Footer>
        </InteractiveModal>

        <NonInteractiveModal isVisible={isSecondaryModalVisible} onBackButtonPress={this.onCancel} onBackdropPress={this.onCancel} onModalHide={this.onModalHide} onExpired={this.onCancel}>
          <NonInteractiveModal.Icon>
            <Icon style={{}} type={'ionIcons'} name="ios-key" size={30} />
          </NonInteractiveModal.Icon>

          <NonInteractiveModal.Message>
            <Text>{error ? error.message : 'Sweeping private key...'}</Text>
          </NonInteractiveModal.Message>
        </NonInteractiveModal>
      </View>
    )
  }

  onModalHide = () => {
    if (this.props.isPrimaryModalVisible || this.props.isSecondaryModalVisible) return
    this.props.reset()
  }

  onSweep = () => {
    this.props.onSweep()
  }

  onCancel = () => {
    this.props.onCancel()
  }
}

export default PrivateKeyModalComponent
