// @flow

import type { EdgeParsedUri } from 'edge-core-js'

import type { Action } from '../../../../ReduxTypes.js'
import * as ACTION from '../action'

export const initialState = null
export type State = EdgeParsedUri | null
export const parsedUri = (state: State = initialState, action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case ACTION.PARSE_URI_SUCCEEDED:
      return action.data.parsedUri
    case ACTION.PARSE_URI_RESET:
      return initialState
    default:
      return state
  }
}
