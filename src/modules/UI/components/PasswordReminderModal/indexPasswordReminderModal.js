// @flow

import {passwordReminderModalConnector} from './passwordReminderModalConnector.js'
import {PasswordReminderModal} from './PasswordReminderModal.ui.js'
import {initialState, passwordReminderModalReducer, IS_CHECKING, VERIFIED, INVALID} from './passwordReminderModalReducer.js'
import type {PasswordReminderModalState} from './passwordReminderModalReducer.js'
import {checkPasswordStart, checkPassword, checkPasswordSuccess, checkPasswordFail, CHECK_PASSWORD_SUCCESS, requestChangePassword, postponePasswordReminder, setPasswordReminder} from './actions.js'

export {
  initialState,
  checkPassword,
  checkPasswordStart,
  checkPasswordSuccess,
  checkPasswordFail,
  requestChangePassword,
  postponePasswordReminder,
  passwordReminderModalConnector,
  PasswordReminderModal,
  passwordReminderModalReducer,
  CHECK_PASSWORD_SUCCESS,
  setPasswordReminder,
  IS_CHECKING,
  VERIFIED,
  INVALID
}

export type {PasswordReminderModalState}
