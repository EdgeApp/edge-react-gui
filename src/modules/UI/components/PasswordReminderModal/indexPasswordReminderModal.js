// @flow

import {
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
import { initialState, passwordReminderModalReducer } from './passwordReminderModalReducer.js'
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
  passwordReminderModalReducer as passwordReminderModal,
  setPasswordReminder
}

export type { PasswordReminderModalState }
