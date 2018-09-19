// @flow

import { Alert } from 'react-native'

import s from '../../../../locales/strings.js'
import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as SETTINGS_API from '../../../Core/Account/settings.js'
import type { Dispatch, GetState } from '../../../ReduxTypes.js'

export const checkPasswordStart = () => ({
  type: 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_START'
})

export const checkPasswordSuccess = () => ({
  type: 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS'
})

export const checkPasswordFail = () => ({
  type: 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_FAIL'
})

export const requestChangePassword = () => ({
  type: 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD'
})

export const postponePasswordReminder = () => ({
  type: 'PASSWORD_REMINDER_MODAL/PASSWORD_REMINDER_POSTPONED'
})

// Loading data from account local folder
export const setPasswordReminderStart = () => ({
  type: 'PASSWORD_REMINDER_MODAL/SET_PASSWORD_REMINDER_START'
})

export const setPasswordReminderSuccess = () => ({
  type: 'PASSWORD_REMINDER_MODAL/SET_PASSWORD_REMINDER_SUCCESS'
})

export const setPasswordReminderFail = () => ({
  type: 'PASSWORD_REMINDER_MODAL/SET_PASSWORD_REMINDER_FAIL'
})

export const checkPassword = (password: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = state.core.account

  dispatch(checkPasswordStart())
  ACCOUNT_API.checkPassword(account, password).then(isValidPassword => {
    if (isValidPassword) {
      dispatch(checkPasswordSuccess())
      setTimeout(() => Alert.alert(s.strings.password_reminder_verified, s.strings.password_reminder_great_job), 500)
    } else {
      dispatch(checkPasswordFail())
    }
  })
}

// Saving data to account local folder
export const setPasswordReminder = (passwordReminder: Object) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = state.core.account
  dispatch(setPasswordReminderStart())
  SETTINGS_API.setPasswordReminderRequest(account, passwordReminder).then(
    () => {
      dispatch(setPasswordReminderSuccess())
    },
    () => {
      dispatch(setPasswordReminderFail())
    }
  )
}
