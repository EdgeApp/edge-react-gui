// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes'
import { HIDE_PASSWORD_RECOVERY_MODAL, SHOW_PASSWORD_RECOVERY_MODAL } from './PasswordRecoveryModalActions.js'

export const isVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case SHOW_PASSWORD_RECOVERY_MODAL:
      return true
    case HIDE_PASSWORD_RECOVERY_MODAL:
      return false
    default:
      return state
  }
}

export const passwordRecoveryModal = combineReducers({
  isVisible
})
