import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { showError, showToast } from '../services/AirshipInstance'
import { ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeTextField } from '../themed/EdgeTextField'
import { MainButton } from '../themed/MainButton'
import { ModalFooter, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

interface OwnProps {
  bridge: AirshipBridge<void>
  navigation: NavigationBase
}

interface StateProps {
  account: EdgeAccount
}

interface DispatchProps {
  onSuccess: () => void
  onPostpone: () => void
  onRequestChangePassword: () => void
}

interface State {
  errorMessage?: string
  password: string
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
      setTimeout(() => this.props.navigation.navigate('changePassword', {}), 10)
    }
  }

  handleSubmit = () => {
    const { bridge, account } = this.props
    const { password } = this.state

    this.setState({ spinning: true })
    account
      .checkPassword(password)
      .then(isValidPassword => {
        if (isValidPassword) {
          this.props.onSuccess()
          this.setState({ spinning: false })
          showToast(lstrings.password_reminder_great_job)
          setTimeout(() => bridge.resolve(), 10)
        } else {
          this.setState({ errorMessage: lstrings.password_reminder_invalid, spinning: false })
        }
      })
      .catch(err => showError(err))
  }

  handleChangeText = (password: string) => this.setState({ password })

  render() {
    const { bridge, theme } = this.props
    const { errorMessage, password, spinning } = this.state

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCancel}>
        <ModalTitle>{lstrings.password_reminder_remember_your_password}</ModalTitle>
        <ScrollView style={{ maxHeight: theme.rem(9) }}>
          <ModalMessage>{lstrings.password_reminder_you_will_need_your_password}</ModalMessage>
          <ModalMessage>{lstrings.password_reminder_enter_password_below}</ModalMessage>
        </ScrollView>
        <EdgeTextField
          secureTextEntry
          error={errorMessage}
          label={lstrings.password}
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
          <MainButton label={lstrings.password_reminder_check_password} marginRem={0.5} onPress={this.handleSubmit} />
        )}
        <MainButton label={lstrings.password_reminder_forgot_password} marginRem={0.5} type="secondary" onPress={this.handleRequestChangePassword} />
        <ModalFooter onPress={this.handleCancel} />
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
      dispatch({
        type: 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS'
      })
    },
    onRequestChangePassword() {
      dispatch({
        type: 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD'
      })
    },
    onPostpone() {
      dispatch({
        type: 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED'
      })
    }
  })
)(withTheme(PasswordReminderModalComponent))
