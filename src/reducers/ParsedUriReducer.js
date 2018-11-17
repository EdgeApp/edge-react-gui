// @flow

import type { EdgeParsedUri } from 'edge-core-js'
import { type Reducer } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'

export const initialState = null

export const parsedUri: Reducer<EdgeParsedUri | null, Action> = (state = initialState, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'PARSE_URI_SUCCEEDED': {
      // $FlowFixMe
      return action.data.parsedUri
    }

    case 'PARSE_URI_RESET': {
      return initialState
    }

    default:
      return state
  }
}
