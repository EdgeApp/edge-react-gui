// @flow

import type { Action } from '../modules/ReduxTypes.js'

export const privateSeedUnlocked = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case 'LOCK_WALLET_SEED': {
      return false
    }

    case 'UNLOCK_WALLET_SEED': {
      return true
    }

    default:
      return state
  }
}
