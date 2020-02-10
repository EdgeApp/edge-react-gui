// @flow

import type { EdgeContext } from 'edge-core-js'
import { type Reducer } from 'redux'

import { type Action } from '../types/reduxTypes.js'

export type ContextState = {
  context: EdgeContext | Object
}

const initialState = {
  context: {}
}

export const context: Reducer<ContextState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'CORE/CONTEXT/ADD_CONTEXT': {
      if (!action.data) throw new Error('Invalid action')
      const context: EdgeContext = action.data.context
      return {
        ...state,
        context
      }
    }

    default:
      return state
  }
}
