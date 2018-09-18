// @flow

import type { Action } from '../../../ReduxTypes'

type HelpModalState = boolean
export const helpModal = (state: HelpModalState = false, action: Action) => {
  switch (action.type) {
    case 'OPEN_HELP_MODAL':
      return true
    case 'CLOSE_HELP_MODAL':
      return false
    default:
      return state
  }
}
