// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { passwordReminderSuccess, postponePasswordReminder, requestChangePassword } from '../../actions/PasswordReminderActions.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { showToast } from '../services/AirshipInstance.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeTextField } from '../themed/EdgeTextField.js'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<void>,
  navigation: NavigationProp<any>
}

type StateProps = {
  account: EdgeAccount
}

type DispatchProps = {
  onSuccess: () => void,
  onPostpone: () => void,
  onRequestChangePassword: () => void
}

type State = {
  errorMessage?: string,
  password: string,
  spinning: boolean
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class PasswordReminderModalComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { spinning: false, password: '' }
  }

  handleCancel = () => {
    if (!this.state.spinning) {
      this.props.onPostpone()
      this.props.bridge.resolve()
    }
  }

  handleRequestChangePassword = () => {
    if (!this.state.spinning) {
      this.props.bridge.resolve()
      this.props.onRequestChangePassword()
      setTimeout(() => this.props.navigation.navigate('changePassword'), 10)
    }
  }

  handleSubmit = () => {
    const { bridge, account } = this.props
    const { password } = this.state

    this.setState({ spinning: true })
    account.checkPassword(password).then(isValidPassword => {
      if (isValidPassword) {
        this.props.onSuccess()
        this.setState({ spinning: false })
        showToast(s.strings.password_reminder_great_job)
        setTimeout(() => bridge.resolve(), 10)
      } else {
        this.setState({ errorMessage: s.strings.password_reminder_invalid, spinning: false })
      }
    })
  }

  handleChangeText = (password: string) => this.setState({ password })

  render() {
    const { bridge, theme } = this.props
    const { errorMessage, password, spinning } = this.state

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCancel}>
        <ModalTitle>{s.strings.password_reminder_remember_your_password}</ModalTitle>
        <ScrollView style={{ maxHeight: theme.rem(9) }}>
          <ModalMessage>{s.strings.password_reminder_you_will_need_your_password}</ModalMessage>
          <ModalMessage>{s.strings.password_reminder_enter_password_below}</ModalMessage>
        </ScrollView>
        <EdgeTextField
          secureTextEntry
          error={errorMessage}
          label={s.strings.password}
          onChangeText={this.handleChangeText}
          onSubmitEditing={this.handleSubmit}
          value={password}
        />
        {
          // Hack around the Android keyboard glitch:
          Platform.OS === 'android' ? <View style={{ flex: 1 }} /> : null
        }
        {spinning ? (
          <MainButton marginRem={0.5} spinner />
        ) : (
          <MainButton label={s.strings.password_reminder_check_password} marginRem={0.5} onPress={this.handleSubmit} />
        )}
        <MainButton label={s.strings.password_reminder_forgot_password} marginRem={0.5} type="secondary" onPress={this.handleRequestChangePassword} />
        <ModalCloseArrow onPress={this.handleCancel} />
      </ThemedModal>
    )
  }
}

export const PasswordReminderModal = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    account: state.core.account
  }),
  dispatch => ({
    onSuccess() {
      dispatch(passwordReminderSuccess())
    },
    onRequestChangePassword() {
      dispatch(requestChangePassword())
    },
    onPostpone() {
      dispatch(postponePasswordReminder())
    }
  })
)(withTheme(PasswordReminderModalComponent))
