import { showError } from '../components/services/AirshipInstance'
import { setPasswordReminderRequest } from '../modules/Core/Account/settings'
import { ThunkAction } from '../types/reduxTypes'
import { PasswordReminder } from '../types/types'

// Saving data to account local folder
export function setPasswordReminder(passwordReminder: PasswordReminder): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    setPasswordReminderRequest(account, passwordReminder).catch(showError)
  }
}
