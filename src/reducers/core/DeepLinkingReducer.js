// @flow

import type { Action } from '../../modules/ReduxTypes'

import * as Constants from '../../constants/indexConstants'

const initialState = {
  passwordRecoveryLink: null
}

type DeepLinkingReducer = {
  passwordRecoveryLink: string | null
}

export default function (state: DeepLinkingReducer = initialState, action: Action) {
  switch (action.type) {
    case Constants.DEEP_LINK_RECEIVED:
      return {
        ...state,
        passwordRecoveryLink: action.data
      }
    case Constants.ACCOUNT_INIT_COMPLETE:
      return {
        ...state,
        passwordRecoveryLink: null
      }
    default:
      return state
  }
}
