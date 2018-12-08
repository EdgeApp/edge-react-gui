// @flow

import type { EdgeParsedUri } from 'edge-core-js'
import { type Reducer } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'

export const initialState = null

export const parsedUri: Reducer<EdgeParsedUri | null, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'PARSE_URI_SUCCEEDED': {
      return action.data.parsedUri
    }

    default:
      return state
  }
}
