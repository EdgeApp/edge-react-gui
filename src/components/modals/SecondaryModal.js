// @flow

import * as React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import s from '../../locales/strings.js'
import { NonInteractiveModal } from '../../modules/UI/components/Modals/NonInteractiveModal/NonInteractiveModal.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'

export type Props = {
  error: Error | null,
  isActive: boolean,
  isSweeping: boolean,
  onBackButtonPress: () => void,
  onBackdropPress: () => void,
  onModalHide: () => void
}
export class SecondaryModal extends React.Component<Props> {
  render() {
    const { error, isSweeping, isActive, onBackButtonPress, onBackdropPress, onModalHide } = this.props

    return (
      <NonInteractiveModal isActive={isActive} onBackButtonPress={onBackButtonPress} onBackdropPress={onBackdropPress} onModalHide={onModalHide}>
        <NonInteractiveModal.Icon>
          <IonIcon name="ios-key" color={THEME.COLORS.WHITE} size={30} style={{ transform: [{ rotate: '270deg' }] }} />
        </NonInteractiveModal.Icon>

        <NonInteractiveModal.Footer>
          {error ? (
            <NonInteractiveModal.Message>
              <Text>{error.message}</Text>
            </NonInteractiveModal.Message>
          ) : null}

          {isSweeping ? (
            <View>
              <NonInteractiveModal.Message>
                <Text>{s.strings.private_key_modal_importing_private_key}</Text>
              </NonInteractiveModal.Message>
              <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} size="large" style={{ padding: 10 }} />
            </View>
          ) : null}

          {!isSweeping && !error ? (
            <NonInteractiveModal.Message>
              <Text>{s.strings.private_key_modal_success}</Text>
            </NonInteractiveModal.Message>
          ) : null}
        </NonInteractiveModal.Footer>
      </NonInteractiveModal>
    )
  }
}
