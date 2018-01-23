// @flow

import {combineReducers} from 'redux'
import type {Action} from '../../../../../ReduxTypes.js'
import * as Constants from '../../../../../../constants/indexConstants'
import {LOCK, UNLOCK} from './GetSeedModalConnector.js'

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
