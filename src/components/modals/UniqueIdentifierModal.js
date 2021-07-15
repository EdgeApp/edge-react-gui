// @flow

import * as React from 'react'
import { TextField } from 'react-native-material-textfield'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { InteractiveModal } from '../../modules/UI/components/Modals/InteractiveModal/InteractiveModal.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'

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
export class UniqueIdentifierModal extends React.Component<Props> {
  render() {
    const { currencyCode, isActive, onBackButtonPress, onBackdropPress, onCancel, onModalHide, uniqueIdentifier, uniqueIdentifierChanged } = this.props

    let title = ''
    let keyboardType = 'default'
    const uniqueIdentifierInfo = getSpecialCurrencyInfo(currencyCode).uniqueIdentifier
    if (uniqueIdentifierInfo != null) {
      title = uniqueIdentifierInfo.identifierName
      keyboardType = uniqueIdentifierInfo.identifierKeyboardType
    }

    return (
      <InteractiveModal legacy isActive={isActive} onBackdropPress={onBackdropPress} onBackButtonPress={onBackButtonPress} onModalHide={onModalHide}>
        <InteractiveModal.Icon>
          <IonIcon name="ios-key" size={30} />
        </InteractiveModal.Icon>

        <InteractiveModal.Title>
          <Text>{title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <InteractiveModal.Description>
                <Text>{sprintf(s.strings.unique_identifier_modal_description, title)}</Text>
              </InteractiveModal.Description>
            </InteractiveModal.Item>
          </InteractiveModal.Row>

          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TextField
                baseColor={THEME.COLORS.SECONDARY}
                tintColor={THEME.COLORS.SECONDARY}
                onChangeText={uniqueIdentifierChanged}
                keyboardType={keyboardType}
                value={uniqueIdentifier}
                label={title}
                onSubmitEditing={this.onConfirm}
              />
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <SecondaryButton onPress={() => onCancel()} style={{ flex: -1 }}>
                <SecondaryButton.Text>
                  <Text>{s.strings.unique_identifier_modal_cancel}</Text>
                </SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
            <InteractiveModal.Item>
              <PrimaryButton onPress={() => this.onConfirm()} style={{ flex: -1 }}>
                <PrimaryButton.Text>
                  <Text>{s.strings.unique_identifier_modal_confirm}</Text>
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
