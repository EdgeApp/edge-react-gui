// @flow

import React, { Component } from 'react'

import * as Constants from '../../../../constants/indexConstants.js'
import s from '../../../../locales/strings.js'
import { PrimaryButton, TertiaryButton } from '../Buttons'
import Text from '../FormattedText/index.js'
import { Icon } from '../Icon/Icon.ui'
import { InteractiveModal } from '../Modals'
import { styles } from './PasswordRecoveryReminderModalStyles.js'

export type PasswordRecoveryReminderModalOwnProps = {}

export type PasswordRecoveryReminderModalStateProps = {
  isVisible: boolean
}

export type PasswordRecoveryReminderModalDispatchProps = {
  hidePasswordRecoveryReminderModal: () => void,
  onGoToPasswordRecoveryScene: () => void
}

export type PasswordRecoveryReminderModalProps = PasswordRecoveryReminderModalOwnProps &
  PasswordRecoveryReminderModalStateProps &
  PasswordRecoveryReminderModalDispatchProps

export class PasswordRecoveryReminderModalComponent extends Component<PasswordRecoveryReminderModalProps> {
  render () {
    const { isVisible, hidePasswordRecoveryReminderModal, onGoToPasswordRecoveryScene } = this.props
    return (
      <InteractiveModal isActive={isVisible} onModalHide={hidePasswordRecoveryReminderModal}>
        <InteractiveModal.Icon>
          <Icon style={styles.icon} name={Constants.LOCKED_ICON} type={Constants.ION_ICONS} />
        </InteractiveModal.Icon>
        <InteractiveModal.Title>
          <Text>{s.strings.password_recovery_reminder_modal_title}</Text>
        </InteractiveModal.Title>

        <InteractiveModal.Body>
          <InteractiveModal.Description style={{ textAlign: 'center' }}>{s.strings.password_recovery_reminder_modal_message}</InteractiveModal.Description>
        </InteractiveModal.Body>
        <InteractiveModal.Footer>
          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <PrimaryButton onPress={onGoToPasswordRecoveryScene}>
                <PrimaryButton.Text>{s.strings.password_recovery_reminder_modal_set_up}</PrimaryButton.Text>
              </PrimaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>

          <InteractiveModal.Row>
            <InteractiveModal.Item>
              <TertiaryButton onPress={hidePasswordRecoveryReminderModal}>
                <TertiaryButton.Text>{s.strings.password_check_check_later}</TertiaryButton.Text>
              </TertiaryButton>
            </InteractiveModal.Item>
          </InteractiveModal.Row>
        </InteractiveModal.Footer>
      </InteractiveModal>
    )
  }
}
