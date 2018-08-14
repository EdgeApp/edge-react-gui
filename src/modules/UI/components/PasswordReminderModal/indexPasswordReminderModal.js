// @flow

import {
  CHECK_PASSWORD_SUCCESS,
  REQUEST_CHANGE_PASSWORD,
  checkPassword,
  checkPasswordFail,
  checkPasswordStart,
  checkPasswordSuccess,
  postponePasswordReminder,
  requestChangePassword,
  setPasswordReminder
} from './actions.js'
import { PasswordReminderModal } from './PasswordReminderModal.ui.js'
import { passwordReminderModalConnector } from './passwordReminderModalConnector.js'
import { INVALID, IS_CHECKING, VERIFIED, initialState, passwordReminderModalReducer } from './passwordReminderModalReducer.js'
import type { PasswordReminderModalState } from './passwordReminderModalReducer.js'

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
  INVALID,
  REQUEST_CHANGE_PASSWORD
}

export type { PasswordReminderModalState }
