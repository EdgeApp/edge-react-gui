// @flow

import {combineReducers} from 'redux'
import type {Action} from '../../../../../ReduxTypes.js'
import * as Constants from '../../../../../../constants/indexConstants'
import {LOCK, UNLOCK} from './GetSeedConnector.js'

export const privateSeedLocked = (state: string = '', action: Action) => {
  switch (action.type) {
    case LOCK:
      return true
    case UNLOCK:
      return false
    default:
      return state
  }
}
