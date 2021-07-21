// @flow

import * as React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import s from '../../locales/strings.js'
import { NonInteractiveModal } from '../../modules/UI/components/Modals/NonInteractiveModal/NonInteractiveModal.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'

type StateProps = {
  error: Error | null,
  isActive: boolean,
  isSweeping: boolean
}
type DispatchProps = {
  onDeactivated: () => void
}

type Props = StateProps & DispatchProps

class SecondaryModalComponent extends React.Component<Props> {
  render() {
    const { error, isSweeping, isActive, onDeactivated } = this.props

    return (
      <NonInteractiveModal isActive={isActive} onBackButtonPress={onDeactivated} onBackdropPress={onDeactivated}>
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

export const SecondaryModal = connect<StateProps, DispatchProps, {}>(
  state => ({
    error: state.ui.scenes.scan.privateKeyModal.error,
    isSweeping: state.ui.scenes.scan.privateKeyModal.isSweeping,
    isActive: state.ui.scenes.scan.privateKeyModal.secondaryModal.isActive
  }),
  dispatch => ({
    onDeactivated() {
      dispatch({ type: 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/DEACTIVATED' })
    }
  })
)(SecondaryModalComponent)
