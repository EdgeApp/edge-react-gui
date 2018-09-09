// @flow

import type { Action } from '../../../../ReduxTypes.js'
import * as ACTION from '../action'
import { DEACTIVATED as PRIMARY_MODAL_DEACTIVATED } from '../PrivateKeyModal/PrimaryModal/PrimaryModalActions.js'

export const initialState = false
export type State = boolean
export const scanEnabled = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case ACTION.ENABLE_SCAN:
      return true
    case PRIMARY_MODAL_DEACTIVATED:
      return true
    case ACTION.DISABLE_SCAN:
      return false
    default:
      return state
  }
}
