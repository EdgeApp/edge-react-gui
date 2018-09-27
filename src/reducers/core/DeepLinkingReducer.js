// @flow

import { type Reducer } from 'redux'

import { type Action } from '../../modules/ReduxTypes.js'

export type DeepLinkingState = {
  passwordRecoveryLink: string | null
}

const initialState = {
  passwordRecoveryLink: null
}

export const deepLinking: Reducer<DeepLinkingState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'DEEP_LINK_RECEIVED': {
      return {
        ...state,
        passwordRecoveryLink: action.data
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
