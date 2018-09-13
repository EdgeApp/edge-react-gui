// @flow

import type { EdgeParsedUri } from 'edge-core-js'

import type { Action } from '../../../../ReduxTypes.js'

export const initialState = null
export type State = EdgeParsedUri | null
export const parsedUri = (state: State = initialState, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case 'PARSE_URI_SUCCEEDED': {
      return action.data.parsedUri
    }

    case 'PARSE_URI_RESET': {
      return initialState
    }

    default:
      return state
  }
}
