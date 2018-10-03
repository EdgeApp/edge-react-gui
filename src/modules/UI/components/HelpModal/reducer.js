// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../../ReduxTypes'

export type HelpModalState = boolean

export const helpModal: Reducer<HelpModalState, Action> = (state = false, action: Action) => {
  switch (action.type) {
    case 'OPEN_HELP_MODAL':
      return true
    case 'CLOSE_HELP_MODAL':
      return false
    default:
      return state
  }
}
