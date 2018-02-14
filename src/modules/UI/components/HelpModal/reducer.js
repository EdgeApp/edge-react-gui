// @flow

import type { Action } from '../../../ReduxTypes'
import * as ACTION from './actions.js'

type HelpModalState = boolean
export const helpModal = (state: HelpModalState = false, action: Action) => {
  switch (action.type) {
    case ACTION.OPEN_HELP_MODAL:
      return true
    case ACTION.CLOSE_HELP_MODAL:
      return false
    default:
      return state
  }
}
