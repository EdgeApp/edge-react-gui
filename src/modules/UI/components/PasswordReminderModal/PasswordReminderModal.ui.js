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
import type { PasswordReminder } from '../../../../types.js'

type Props = {
  status: 'IS_CHECKING' | 'VERIFIED' | 'INVALID' | null,
  isVisible: boolean,
  style?: Object,
  onSubmit: (password: string) => void,
  onRequestChangePassword: () => void,
  onPostpone: () => void,
  setPasswordReminder: (passwordReminder: Object) => void,
  passwordReminder: PasswordReminder
}

type State = {
  password: string
}

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
            <Title>{s.strings.password_reminder_remember_your_password}</Title>
          </Modal.Header>

          <Modal.Body>
            <Modal.Description style={styles.descriptionTop}>{s.strings.password_reminder_you_will_need_your_password}</Modal.Description>
            <Modal.Description style={styles.descriptionBottom}>{s.strings.password_reminder_enter_password_below}</Modal.Description>

            <Modal.Item>
              <PasswordInput onChangeText={this.onChangeText} error={this.error()} />
            </Modal.Item>
          </Modal.Body>

          <Modal.Footer style={styles.footer}>
            <Modal.Item style={styles.buttonContainer}>
              <TertiaryButton onPress={this.onSubmit} disabled={this.isChecking()}>
                {this.isChecking() ? <ActivityIndicator /> : <TertiaryButton.Text>{s.strings.password_reminder_check_password}</TertiaryButton.Text>}
              </TertiaryButton>
            </Modal.Item>

            <Modal.Item style={styles.buttonContainer}>
              <TertiaryButton onPress={this.onRequestChangePassword} disabled={this.isChecking()}>
                <TertiaryButton.Text>{s.strings.password_reminder_forgot_password}</TertiaryButton.Text>
              </TertiaryButton>
            </Modal.Item>

            <Modal.Item style={styles.buttonContainer}>
              <SecondaryButton onPress={this.onPostpone} disabled={this.isChecking()}>
                <SecondaryButton.Text>{s.strings.password_reminder_postpone}</SecondaryButton.Text>
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
    return this.props.status === 'INVALID' ? s.strings.password_reminder_invalid : ''
  }

  onChangeText = (password: string) => {
    this.setState({
      password
    })
  }

  onSubmit = () => {
    this.props.onSubmit(this.state.password)
  }

  verified = () => {
    return this.props.status === 'VERIFIED'
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
