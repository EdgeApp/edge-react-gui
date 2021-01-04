// @flow

import { isEqual } from 'lodash'
import * as React from 'react'
import { ActivityIndicator, Text } from 'react-native'
import { TextField } from 'react-native-material-textfield'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import s from '../../../../locales/strings.js'
import { THEME } from '../../../../theme/variables/airbitz.js'
import type { PasswordReminder } from '../../../../types/types.js'
import { SecondaryButton } from '../Buttons/SecondaryButton.ui.js'
import { TertiaryButton } from '../Buttons/TertiaryButton.ui.js'
import { InteractiveModal } from '../Modals/InteractiveModal/InteractiveModal.ui.js'
import { styles } from './styles.js'

type Props = {
  status: 'IS_CHECKING' | 'VERIFIED' | 'INVALID' | null,
  isVisible: boolean,
  style?: Object,
  onSubmit: (password: string) => void,
  onRequestChangePassword: () => void,
  onPostpone: () => void,
  setPasswordReminder: (passwordReminder: PasswordReminder) => void,
  passwordReminder: PasswordReminder,
  loginStatus: boolean | null
}

type State = {
  password: string
}

export class PasswordReminderModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = this.initialState()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.loginStatus && !isEqual(this.props.passwordReminder, prevProps.passwordReminder)) {
      this.props.setPasswordReminder(this.props.passwordReminder)
    }
  }

  render() {
    const error = this.props.status === 'INVALID' ? s.strings.password_reminder_invalid : ''
    const isChecking = this.props.status === 'IS_CHECKING'
    return (
      <InteractiveModal legacy isActive={this.props.isVisible} onModalHide={this.reset}>
        <InteractiveModal.Icon>
          <AntDesignIcon style={styles.icon} name="lock" />
        </InteractiveModal.Icon>

        <InteractiveModal.Title style={{ textAlign: 'center' }}>
          <Text>{s.strings.password_reminder_remember_your_password}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{ textAlign: 'center' }}>{s.strings.password_reminder_you_will_need_your_password}</InteractiveModal.Description>
          <InteractiveModal.Description>{s.strings.password_reminder_enter_password_below}</InteractiveModal.Description>

          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TextField
                baseColor={THEME.COLORS.GRAY_2}
                error={error}
                label={s.strings.password}
                onChangeText={this.onChangeText}
                secureTextEntry
                tintColor={THEME.COLORS.GRAY_2}
              />
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Body>

        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TertiaryButton onPress={this.onSubmit} disabled={isChecking} style={{ flex: -1 }}>
                {isChecking ? (
                  <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
                ) : (
                  <TertiaryButton.Text>{s.strings.password_reminder_check_password}</TertiaryButton.Text>
                )}
              </TertiaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>

          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TertiaryButton onPress={this.onRequestChangePassword} disabled={isChecking} style={{ flex: -1 }}>
                <TertiaryButton.Text>{s.strings.password_reminder_forgot_password}</TertiaryButton.Text>
              </TertiaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>

          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <SecondaryButton onPress={this.onPostpone} disabled={isChecking} style={{ flex: -1 }}>
                <SecondaryButton.Text>{s.strings.password_reminder_postpone}</SecondaryButton.Text>
              </SecondaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }

  onChangeText = (password: string) => {
    this.setState({
      password
    })
  }

  onSubmit = () => {
    this.props.onSubmit(this.state.password)
  }

  onRequestChangePassword = () => {
    this.props.onRequestChangePassword()
  }

  onPostpone = () => {
    this.props.onPostpone()
    this.reset()
  }

  onDone = () => {
    this.reset()
  }

  reset = () => {
    this.setState(this.initialState())
  }

  initialState = () => ({
    password: ''
  })
}
