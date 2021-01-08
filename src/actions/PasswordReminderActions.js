// @flow

import { showError } from '../components/services/AirshipInstance.js'
import { setPasswordReminderRequest } from '../modules/Core/Account/settings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const passwordReminderSuccess = () => ({
  type: 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS'
})

export const requestChangePassword = () => ({
  type: 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD'
})

export const postponePasswordReminder = () => ({
  type: 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED'
})

// Saving data to account local folder
export const setPasswordReminder = (passwordReminder: Object) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = state.core.account
  setPasswordReminderRequest(account, passwordReminder).catch(showError)
}
