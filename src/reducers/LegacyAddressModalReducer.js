// @flow

import type { Action } from '../modules/ReduxTypes.js'

export type LegacyAddressModalState = {
  isActive: boolean
}

export const initialState = {
  isActive: false
}

export const legacyAddressModal = (state: LegacyAddressModalState = initialState, action: Action) => {
  switch (action.type) {
    case 'LEGACY_ADDRESS_MODAL/ACTIVATED': {
      return {
        ...state,
        isActive: true
      }
    }

    case 'LEGACY_ADDRESS_MODAL/DEACTIVATED': {
      return {
        ...state,
        isActive: false
      }
    }

    case 'LEGACY_ADDRESS_MODAL/TOGGLED': {
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
