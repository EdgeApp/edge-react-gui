// @flow

import type { Action } from '../../../../ReduxTypes.js'
import { ACTIVATED, DEACTIVATED, TOGGLED } from './LegacyAddressModalActions.js'

export type LegacyAddressModalState = {
  isActive: boolean
}
export const initialState = {
  isActive: false
}
export const legacyAddressModal = (state: LegacyAddressModalState = initialState, action: Action) => {
  switch (action.type) {
    case ACTIVATED: {
      return {
        ...state,
        isActive: true
      }
    }
    case DEACTIVATED: {
      return {
        ...state,
        isActive: false
      }
    }
    case TOGGLED: {
      return {
        ...state,
        isActive: !state.isActive
      }
    }
    default:
      return state
  }
}

export default legacyAddressModal
