// @flow

import { type Action } from '../../modules/ReduxTypes.js'

const initialState = {
  passwordRecoveryLink: null
}

export default function (state: any = initialState, action: Action) {
  switch (action.type) {
    case 'deepLinkReceived': {
      return {
        ...state,
        passwordRecoveryLink: action.data
      }
    }

    case 'accountInitComplete': {
      return {
        ...state,
        passwordRecoveryLink: null
      }
    }

    default:
      return state
  }
}
