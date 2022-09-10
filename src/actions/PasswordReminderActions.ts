import { showError } from '../components/services/AirshipInstance'
import { setPasswordReminderRequest } from '../modules/Core/Account/settings'
import { Dispatch, GetState } from '../types/reduxTypes'

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
