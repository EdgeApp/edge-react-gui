import { combineReducers, Reducer } from 'redux'

import { Action } from '../../../types/reduxTypes'
import { checkEffectIsDone } from '../runtime'
import { ActionQueueMap } from '../types'

export type ActionQueueState = {
  readonly queue: ActionQueueMap
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
        const { effect } = action.state

        // Remove program from action queue if it has finished
        if (checkEffectIsDone(effect)) {
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
      case 'LOGOUT': {
        return {}
      }
      default:
        return state
    }
  }
})
