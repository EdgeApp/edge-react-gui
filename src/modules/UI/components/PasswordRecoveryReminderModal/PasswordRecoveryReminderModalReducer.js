// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes'

export const isVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case 'SHOW_PASSWORD_RECOVERY_MODAL': {
      return true
    }

    case 'HIDE_PASSWORD_RECOVERY_MODAL': {
      return false
    }

    default:
      return state
  }
}

export const passwordRecoveryReminderModal = combineReducers({
  isVisible
})
