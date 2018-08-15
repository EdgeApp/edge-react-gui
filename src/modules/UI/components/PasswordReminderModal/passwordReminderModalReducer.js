// @flow

import type { Action } from '../../../ReduxTypes'
import { CHECK_PASSWORD_FAIL, CHECK_PASSWORD_START, CHECK_PASSWORD_SUCCESS, PASSWORD_REMINDER_POSTPONED } from './actions.js'

export const initialState = {
  status: null
}

export const IS_CHECKING = 'IS_CHECKING'
export const VERIFIED = 'VERIFIED'
export const INVALID = 'INVALID'
export type PasswordReminderModalState = {
  status: typeof IS_CHECKING | typeof CHECK_PASSWORD_SUCCESS | typeof CHECK_PASSWORD_FAIL | null
}

export const passwordReminderModalReducer = (state: PasswordReminderModalState = initialState, action: Action) => {
  switch (action.type) {
    case CHECK_PASSWORD_START: {
      return {
        ...state,
        status: IS_CHECKING
      }
    }
    case CHECK_PASSWORD_SUCCESS: {
      return {
        ...state,
        status: VERIFIED
      }
    }
    case CHECK_PASSWORD_FAIL: {
      return {
        ...state,
        status: INVALID
      }
    }
    case PASSWORD_REMINDER_POSTPONED: {
      return {
        ...state,
        status: null
      }
    }
    default:
      return state
  }
}
