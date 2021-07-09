// @flow

import * as React from 'react'
import { TextField } from 'react-native-material-textfield'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { InteractiveModal } from '../../modules/UI/components/Modals/InteractiveModal/InteractiveModal.ui.js'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'

type OwnProps = {
  currencyCode: string,
  onConfirm: (info: GuiMakeSpendInfo) => void
}
type StateProps = {
  isActive: boolean,
  uniqueIdentifier: string
}
type DispatchProps = {
  onDeactivated: () => void,
  onModalHide: () => void,
  uniqueIdentifierChanged: (uniqueIdentifier: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

class UniqueIdentifierModalComponent extends React.Component<Props> {
  render() {
    const { currencyCode, isActive, onDeactivated, onModalHide, uniqueIdentifier, uniqueIdentifierChanged } = this.props

    let title = ''
    let keyboardType = 'default'
    const uniqueIdentifierInfo = getSpecialCurrencyInfo(currencyCode).uniqueIdentifier
    if (uniqueIdentifierInfo != null) {
      title = uniqueIdentifierInfo.identifierName
      keyboardType = uniqueIdentifierInfo.identifierKeyboardType
    }

    return (
      <InteractiveModal legacy isActive={isActive} onBackdropPress={onDeactivated} onBackButtonPress={onDeactivated} onModalHide={onModalHide}>
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
              <SecondaryButton onPress={onDeactivated} style={{ flex: -1 }}>
                <SecondaryButton.Text>
                  <Text>{s.strings.unique_identifier_modal_cancel}</Text>
                </SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
            <InteractiveModal.Item>
              <PrimaryButton onPress={this.onConfirm} style={{ flex: -1 }}>
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
    this.props.onDeactivated()
    this.props.onConfirm({ uniqueIdentifier })
  }
}

export const UniqueIdentifierModal = connect(
  (state: RootState): StateProps => ({
    isActive: state.ui.scenes.uniqueIdentifierModal.isActive,
    uniqueIdentifier: state.ui.scenes.uniqueIdentifierModal.uniqueIdentifier ?? state.ui.scenes.sendConfirmation.guiMakeSpendInfo.uniqueIdentifier ?? ''
  }),
  (dispatch: Dispatch): DispatchProps => ({
    onDeactivated() {
      dispatch({ type: 'UNIQUE_IDENTIFIER_MODAL/DEACTIVATED' })
    },
    onModalHide() {
      dispatch({ type: 'UNIQUE_IDENTIFIER_MODAL/RESET' })
    },
    uniqueIdentifierChanged(uniqueIdentifier: string) {
      dispatch({
        type: 'UNIQUE_IDENTIFIER_MODAL/UNIQUE_IDENTIFIER_CHANGED',
        data: { uniqueIdentifier }
      })
    }
  })
)(UniqueIdentifierModalComponent)
