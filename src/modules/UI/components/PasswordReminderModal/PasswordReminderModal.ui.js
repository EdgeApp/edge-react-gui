// @flow

import React, { Component } from 'react'
import { ActivityIndicator } from 'react-native'
import { equals } from 'ramda'

import * as Constants from '../../../../constants/indexConstants.js'
import s from '../../../../locales/strings.js'
import { Icon } from '../Icon/Icon.ui'

import { Modal, SecondaryButton, TertiaryButton, Title } from './components'
import { PasswordInput } from './components/PasswordInput.ui.js'
import { styles } from './styles.js'

type Props = {
  status: 'IS_CHECKING' | 'VERIFIED' | 'INVALID' | null,
  isVisible: boolean,
  style: Object,
  onSubmit: (password: string) => void,
  onRequestChangePassword: () => void,
  onPostpone: () => void,
  setPasswordReminder: (passwordReminder: Object) => void,
  passwordReminder: {
    needsPasswordCheck: boolean,
    lastPasswordUse: Date,
    nonPasswordDaysRemaining: number,
    nonPasswordLoginsRemaining: number,
    nonPasswordDaysLimit: number,
    nonPasswordLoginsLimit: number
  }
}

type State = {
  password: string
}

const REMEMBER_YOUR_PASSWORD_TEXT = s.strings.password_reminder_remember_your_password
const YOU_WILL_NEED_YOUR_PASSWORD_TEXT = s.strings.password_reminder_you_will_need_your_password
const ENTER_PASSWORD_BELOW_TEXT = s.strings.password_reminder_enter_password_below
const INVALID_PASSWORD_TEXT = 'Invalid Password'
const CHECK_PASSWORD_TEXT = s.strings.password_reminder_check_password
const FORGOT_PASSWORD_TEXT = s.strings.password_reminder_forgot_password
const POSTPONE_TEXT = s.strings.password_reminder_postpone

export class PasswordReminderModal extends Component<Props, State> {
  constructor (props: Props) {
    super(props)

    this.state = this.initialState()
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.loginStatus && !equals(this.props.passwordReminder, nextProps.passwordReminder)) {
      nextProps.setPasswordReminder(nextProps.passwordReminder)
    }
  }

  render () {
    return (
      <Modal isVisible={this.props.isVisible} onModalHide={this.reset}>
        <Modal.Container>
          <Modal.FeaturedIcon>
            <Icon style={styles.icon} name={Constants.LOCKED_ICON} type={Constants.ION_ICONS} />
          </Modal.FeaturedIcon>

          <Modal.Header>
            <Title>{REMEMBER_YOUR_PASSWORD_TEXT}</Title>
          </Modal.Header>

          <Modal.Body>
            <Modal.Description style={styles.descriptionTop}>{YOU_WILL_NEED_YOUR_PASSWORD_TEXT}</Modal.Description>
            <Modal.Description style={styles.descriptionBottom}>{ENTER_PASSWORD_BELOW_TEXT}</Modal.Description>

            <Modal.Item>
              <PasswordInput onChangeText={this.onChangeText} error={this.error()} />
            </Modal.Item>
          </Modal.Body>

          <Modal.Footer style={styles.footer}>
            <Modal.Item style={styles.buttonContainer}>
              <TertiaryButton onPress={this.onSubmit} disabled={this.isChecking()}>
                {this.isChecking() ? <ActivityIndicator /> : <TertiaryButton.Text>{CHECK_PASSWORD_TEXT}</TertiaryButton.Text>}
              </TertiaryButton>
            </Modal.Item>

            <Modal.Item style={styles.buttonContainer}>
              <TertiaryButton onPress={this.onSubmit} disabled={this.isChecking()}>
                <TertiaryButton.Text>{FORGOT_PASSWORD_TEXT}</TertiaryButton.Text>
              </TertiaryButton>
            </Modal.Item>

            <Modal.Item style={styles.buttonContainer}>
              <SecondaryButton onPress={this.onPostpone} disabled={this.isChecking()}>
                <SecondaryButton.Text>{POSTPONE_TEXT}</SecondaryButton.Text>
              </SecondaryButton>
            </Modal.Item>
          </Modal.Footer>
        </Modal.Container>
      </Modal>
    )
  }

  isChecking = () => {
    return this.props.status === 'IS_CHECKING'
  }

  error = () => {
    return this.props.status === 'INVALID' ? INVALID_PASSWORD_TEXT : ''
  }

  onChangeText = (password: string) => {
    this.setState({
      password
    })
  }

  onSubmit = () => {
    this.props.onSubmit(this.state.password)
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
