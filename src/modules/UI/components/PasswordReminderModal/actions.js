// @flow

import { showError } from '../../../../components/services/AirshipInstance.js'
import type { Dispatch, GetState } from '../../../../types/reduxTypes.js'
import { setPasswordReminderRequest } from '../../../Core/Account/settings.js'

export const requestChangePassword = () => ({
  type: 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD'
})

export const postponePasswordReminder = () => ({
  type: 'PASSWORD_REMINDER_MODAL/PASSWORD_REMINDER_POSTPONED'
})

// Saving data to account local folder
export const setPasswordReminder = (passwordReminder: Object) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = state.core.account
  setPasswordReminderRequest(account, passwordReminder).catch(showError)
}
