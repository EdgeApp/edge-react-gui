// @flow

import React, { Component } from 'react'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { InteractiveModal, TextInput } from '../../modules/UI/components/Modals/index'

export type Props = {
  isActive: boolean,
  onConfirm: (uniqueIdentifier: string) => any,
  onBackButtonPress: () => any,
  onBackdropPress: () => any,
  onModalHide: () => any,
  onCancel: () => any,
  currencyCode: string,
  uniqueIdentifier: string,
  uniqueIdentifierChanged: (uniqueIdentifier: string) => void
}
export class UniqueIdentifierModal extends Component<Props> {
  render () {
    const { currencyCode, isActive, onBackButtonPress, onBackdropPress, onCancel, onModalHide, uniqueIdentifier, uniqueIdentifierChanged } = this.props
    const type = getUniqueIdentifierType(currencyCode)
    const description = getUniqueIdentifierDescription(type)
    const title = type
    const label = type
    const confirm = s.strings.unique_identifier_modal_confirm
    const cancel = s.strings.unique_identifier_modal_cancel
    const icon = { type: 'ionIcons', name: 'ios-key' }
    const keyboardType = 'numeric'

    return (
      <InteractiveModal legacy isActive={isActive} onBackdropPress={onBackdropPress} onBackButtonPress={onBackButtonPress} onModalHide={onModalHide}>
        <InteractiveModal.Icon>
          <Icon style={{}} type={icon.type} name={icon.name} size={30} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <InteractiveModal.Description>
                <Text>{description}</Text>
              </InteractiveModal.Description>
            </InteractiveModal.Item>
          </InteractiveModal.Row>

          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TextInput
                autoFocus
                onChangeText={uniqueIdentifierChanged}
                keyboardType={keyboardType}
                value={uniqueIdentifier}
                label={label}
                onSubmit={this.onConfirm}
              />
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <SecondaryButton onPress={() => onCancel()} style={{ flex: -1 }}>
                <SecondaryButton.Text>
                  <Text>{cancel}</Text>
                </SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
            <InteractiveModal.Item>
              <PrimaryButton onPress={() => this.onConfirm()} style={{ flex: -1 }}>
                <PrimaryButton.Text>
                  <Text>{confirm}</Text>
                </PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }

  onConfirm () {
    const { uniqueIdentifier } = this.props
    this.props.onConfirm(uniqueIdentifier)
  }
}

const getUniqueIdentifierType = (currencyCode: string): string => {
  const types = {
    XRP: s.strings.unique_identifier_destination_tag,
    XMR: s.strings.unique_identifier_payment_id,
    default: s.strings.unique_identifier
  }

  return types[currencyCode] || types['default']
}
const getUniqueIdentifierDescription = (type: string): string => {
  return sprintf(s.strings.unique_identifier_modal_description, type)
}
