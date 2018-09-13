// @flow

import type { Action } from '../../../ReduxTypes'

export const initialState = {
  status: null
}

export type PasswordReminderModalState = {
  status: null | 'IS_CHECKING' | 'VERIFIED' | 'INVALID'
}

export const passwordReminderModalReducer = (state: PasswordReminderModalState = initialState, action: Action) => {
  switch (action.type) {
    case 'PasswordReminderModal/CHECK_PASSWORD_START': {
      return {
        ...state,
        status: 'IS_CHECKING'
      }
    }
    case 'PasswordReminderModal/CHECK_PASSWORD_SUCCESS': {
      return {
        ...state,
        status: 'VERIFIED'
      }
    }
    case 'PasswordReminderModal/CHECK_PASSWORD_FAIL': {
      return {
        ...state,
        status: 'INVALID'
      }
    }
    case 'PasswordReminderModal/PASSWORD_REMINDER_POSTPONED': {
      return {
        ...state,
        status: null
      }
    }
    default:
      return state
  }
}
