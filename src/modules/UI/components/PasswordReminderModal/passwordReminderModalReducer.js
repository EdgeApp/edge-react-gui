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
    case 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_START': {
      return {
        ...state,
        status: 'IS_CHECKING'
      }
    }
    case 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS': {
      return {
        ...state,
        status: 'VERIFIED'
      }
    }
    case 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_FAIL': {
      return {
        ...state,
        status: 'INVALID'
      }
    }
    case 'PASSWORD_REMINDER_MODAL/PASSWORD_REMINDER_POSTPONED': {
      return {
        ...state,
        status: null
      }
    }
    default:
      return state
  }
}
