// @flow

import * as React from 'react'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { TextInput } from '../../modules/UI/components/Modals/components/TextInput.ui.js'
import { InteractiveModal } from '../../modules/UI/components/Modals/InteractiveModal/InteractiveModal.ui.js'

export type Props = {
  isActive: boolean,
  onConfirm: (uniqueIdentifier: string) => any,
  onBackButtonPress: () => any,
  onBackdropPress: () => any,
  onModalHide: () => any,
  onCancel: () => any,
  currencyCode: string,
  uniqueIdentifier: string,
  uniqueIdentifierChanged: (uniqueIdentifier: string) => void,
  keyboardType: ?string
}
export class UniqueIdentifierModal extends React.Component<Props> {
  render() {
    const {
      currencyCode,
      isActive,
      onBackButtonPress,
      onBackdropPress,
      onCancel,
      onModalHide,
      uniqueIdentifier,
      uniqueIdentifierChanged,
      keyboardType
    } = this.props
    let type = ''
    if (getSpecialCurrencyInfo(currencyCode).uniqueIdentifier) {
      type = getSpecialCurrencyInfo(currencyCode).uniqueIdentifier.identifierName
    }
    const description = sprintf(s.strings.unique_identifier_modal_description, type)
    const title = type
    const label = type
    const confirm = s.strings.unique_identifier_modal_confirm
    const cancel = s.strings.unique_identifier_modal_cancel

    return (
      <InteractiveModal legacy isActive={isActive} onBackdropPress={onBackdropPress} onBackButtonPress={onBackButtonPress} onModalHide={onModalHide}>
        <InteractiveModal.Icon>
          <Ionicon name="ios-key" size={30} />
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

  onConfirm() {
    const { uniqueIdentifier } = this.props
    this.props.onConfirm(uniqueIdentifier)
  }
}
