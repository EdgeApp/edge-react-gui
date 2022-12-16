import { combineReducers } from 'redux'

import { Action } from '../../../types/reduxTypes'
import { ActionQueueMap } from '../types'
import { checkEffectIsDone } from '../util/checkEffectIsDone'

export interface ActionQueueState {
  readonly actionQueueMap: ActionQueueMap
  readonly activeProgramIds: string[]
}

export const actionQueue = combineReducers<ActionQueueState, Action>({
  actionQueueMap(state: ActionQueueMap = {}, action: Action): ActionQueueMap {
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
  },
  activeProgramIds(state: string[] = [], action: Action): string[] {
    switch (action.type) {
      case 'ACTION_QUEUE/LOAD_QUEUE': {
        const ids = Object.keys(action.data)
        return ids
      }
      case 'ACTION_QUEUE/QUEUE_ITEM': {
        return [...state, action.programId]
      }
      case 'ACTION_QUEUE/UPDATE_PROGRAM_STATE': {
        const { programId } = action.state
        const { effect } = action.state

        // Remove program from action queue if it has finished
        if (checkEffectIsDone(effect)) {
          return state.filter(id => id !== programId)
        }

        return state
      }
      case 'LOGOUT': {
        return []
      }
      default:
        return state
    }
  }
})
