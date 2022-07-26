// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../types/reduxTypes'
import { type ActionQueueMap } from '../types'

export type ActionQueueState = {
  +queue: ActionQueueMap
}

export const actionQueue: Reducer<ActionQueueState, Action> = combineReducers({
  queue(state: ActionQueueMap = {}, action: Action): ActionQueueMap {
    switch (action.type) {
      case 'ACTION_QUEUE/LOAD_QUEUE': {
        return action.data
      }
      case 'ACTION_QUEUE/QUEUE_ITEM': {
        return {
          ...state,
          [action.programId]: action.item
        }
      }
      case 'ACTION_QUEUE/UPDATE_PROGRAM_STATE': {
        const { programId } = action.state

        // Remvoe program from action queue if it has finished
        if (action.state.effect?.type === 'end') {
          const { [programId]: _removed, ...rest } = state
          return rest
        }

        return {
          ...state,
          [programId]: {
            ...state[programId],
            state: action.state
          }
        }
      }
      default:
        return state
    }
  }
})
