// @flow

import { type Reducer } from 'redux'

import { type Action } from '../types/reduxTypes.js'

export type DeepLinkingState = {
  deepLinkPending: boolean,
  passwordRecoveryLink: string | null,
  addressDeepLinkData: Object
}

const initialState = {
  deepLinkPending: false,
  passwordRecoveryLink: null,
  addressDeepLinkData: {}
}

export const deepLinking: Reducer<DeepLinkingState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'DEEP_LINK_RECEIVED': {
      return {
        ...state,
        passwordRecoveryLink: action.data
      }
    }

    case 'ADDRESS_DEEP_LINK_RECEIVED': {
      return {
        ...state,
        deepLinkPending: true,
        addressDeepLinkData: action.data
      }
    }

    case 'ADDRESS_DEEP_LINK_COMPLETE': {
      return {
        ...state,
        deepLinkPending: false,
        addressDeepLinkData: {}
      }
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      return {
        ...state,
        passwordRecoveryLink: null
      }
    }

    default:
      return state
  }
}
