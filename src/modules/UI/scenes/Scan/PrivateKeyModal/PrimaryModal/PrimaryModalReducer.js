// @flow

import type { Action } from '../../../../../ReduxTypes.js'
import { ACTIVATED, DEACTIVATED } from './PrimaryModalActions.js'

export const initialState = { isActive: false }
export type State = { isActive: boolean }
export const primaryModal = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case ACTIVATED: {
      return {
        isActive: true
      }
    }
    case DEACTIVATED: {
      return {
        isActive: false
      }
    }
    default:
      return state
  }
}
