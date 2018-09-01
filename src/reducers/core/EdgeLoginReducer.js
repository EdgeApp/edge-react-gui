// @flow

import type { EdgeLobby } from 'edge-core-js'

import * as Constants from '../../constants/indexConstants'
import type { Action } from '../../modules/ReduxTypes.js'

const initialState = {
  lobby: null,
  error: null,
  isProcessing: false
}
export type InitialEdgeLoginState = {
  lobby: null | EdgeLobby,
  error: null | Error,
  isProcessing: boolean
}
export default function (state: InitialEdgeLoginState = initialState, action: Action) {
  switch (action.type) {
    case Constants.PROCESS_ABC_LOGIN:
      return { ...state, isProcessing: true }
    case Constants.INVALIDATE_ABC_LOBBY:
      return { ...state, lobby: null, isProcessing: false }
    case Constants.SET_LOBBY_ERROR:
      return { ...state, lobby: null, error: action.data }
    case Constants.SAVE_ABC_LOBBY:
      return { ...state, lobby: action.data, error: null }
    default:
      return state
  }
}
