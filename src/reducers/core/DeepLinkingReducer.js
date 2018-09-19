// @flow

import { type Action } from '../../modules/ReduxTypes.js'

const initialState = {
  passwordRecoveryLink: null
}

export default function (state: any = initialState, action: Action) {
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
