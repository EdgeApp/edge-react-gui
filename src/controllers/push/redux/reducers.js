// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../types/reduxTypes'
import { type PushEvent } from '../types'

export type PushState = {
  +pushEvents: PushEvent[]
}

export const actionQueue: Reducer<PushState, Action> = combineReducers({
  pushEvents(state: PushEvent[] = [], action: Action): PushEvent[] {
    switch (action.type) {
      case 'PUSH/ADD_PUSH_EVENTS': {
        return [...state, ...action.events]
      }
      default:
        return state
    }
  }
})
