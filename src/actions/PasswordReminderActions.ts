import { showError } from '../components/services/AirshipInstance'
import { setPasswordReminderRequest } from '../modules/Core/Account/settings'
import { Dispatch, GetState } from '../types/reduxTypes'
import { PasswordReminder } from '../types/types'

// Saving data to account local folder
export const setPasswordReminder = (passwordReminder: PasswordReminder) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = state.core.account
  setPasswordReminderRequest(account, passwordReminder).catch(showError)
}
