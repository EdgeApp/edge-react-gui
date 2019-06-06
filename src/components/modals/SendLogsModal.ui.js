/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { ActivityIndicator } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import StylizedModal from '../../modules/UI/components/Modal/Modal.ui'
import styles from '../../styles/SettingsComponentsStyle'
import THEME, { colors } from '../../theme/variables/airbitz'
import { FormField } from '../common/FormField.js'
import ModalButtons from '../common/ModalButtons'

export default class SendLogsModal extends Component {
  state = {
    text: ''
  }

  onDone = () => {
    this.props.onDone(this.state.text)
    this.setState({ text: '' })
  }

  onCancel = () => {
    this.props.onCancel()
    this.setState({ text: '' })
  }

  onChangeText = text => {
    this.setState({ text })
  }

  getModalHeaderText = () => {
    const status = this.props.sendLogsStatus
    const { SUCCESS, FAILURE, PENDING, LOADING } = Constants.REQUEST_STATUS

    switch (status) {
      case SUCCESS:
        return s.strings.settings_modal_send_logs_success
      case FAILURE:
        return s.strings.settings_modal_send_logs_failure
      case PENDING:
        return s.strings.settings_modal_send_logs_title
      case LOADING:
        return s.strings.settings_modal_send_logs_loading
      default:
        return null
    }
  }

  getModalMiddle = () => {
    const status = this.props.sendLogsStatus
    const { PENDING, LOADING } = Constants.REQUEST_STATUS

    switch (status) {
      case PENDING:
        return (
          <FormField
            style={styles.sendLogsModalInput}
            autoFocus
            label="Type some text"
            value={this.state.text}
            onChangeText={this.onChangeText}
            returnKeyType="done"
          />
        )
      case LOADING:
        return <ActivityIndicator />
      default:
        return null
    }
  }

  getModalBottom = () => {
    const status = this.props.sendLogsStatus
    const { SUCCESS, FAILURE, PENDING } = Constants.REQUEST_STATUS

    switch (status) {
      case SUCCESS:
        return (
          <PrimaryButton style={styles.okButton} onPress={this.onCancel}>
            <PrimaryButton.Text>{s.strings.string_ok}</PrimaryButton.Text>
          </PrimaryButton>
        )
      case FAILURE:
        return (
          <PrimaryButton style={styles.okButton} onPress={this.onCancel}>
            <PrimaryButton.Text>{s.strings.string_ok}</PrimaryButton.Text>
          </PrimaryButton>
        )
      case PENDING:
        return <ModalButtons onDone={this.onDone} onCancel={this.onCancel} />
      default:
        return null
    }
  }

  render () {
    const icon = (
      <IonIcon
        name="ios-paper-plane"
        size={24}
        color={colors.primary}
        style={[
          {
            backgroundColor: THEME.COLORS.TRANSPARENT,
            zIndex: 1015,
            elevation: 1015
          }
        ]}
      />
    )

    return (
      <StylizedModal
        visibilityBoolean={this.props.launchModal}
        featuredIcon={icon}
        headerText={this.getModalHeaderText()}
        modalMiddle={this.getModalMiddle()}
        modalBottom={this.getModalBottom()}
        onExitButtonFxn={this.onCancel}
      />
    )
  }
}
