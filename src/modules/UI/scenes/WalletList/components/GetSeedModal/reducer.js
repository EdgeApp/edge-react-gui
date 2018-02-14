// @flow

import type { Action } from '../../../../../ReduxTypes.js'
import { LOCK, UNLOCK } from './GetSeedModalConnector.js'

export const privateSeedUnlocked = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case LOCK:
      return false
    case UNLOCK:
      return true
    default:
      return state
  }
}
