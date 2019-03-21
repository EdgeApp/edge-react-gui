// @flow

import type { EdgeLobby } from 'edge-core-js'
import { type Reducer } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'

export type EdgeLoginState = {
  lobby: EdgeLobby | null,
  error: string | null,
  isProcessing: boolean
}

const initialState = {
  lobby: null,
  error: null,
  isProcessing: false
}

export const edgeLogin: Reducer<EdgeLoginState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'PROCESS_EDGE_LOGIN': {
      return {
        ...state,
        isProcessing: true
      }
    }

    case 'EDGE_LOBBY_ACCEPT_FAILED': {
      return {
        ...state,
        isProcessing: false
      }
    }

    case 'INVALIDATE_EDGE_LOBBY': {
      return {
        ...state,
        lobby: null,
        isProcessing: false
      }
    }

    case 'SET_LOBBY_ERROR': {
      return {
        ...state,
        lobby: null,
        error: action.data,
        isProcessing: false
      }
    }

    case 'SAVE_EDGE_LOBBY': {
      return {
        ...state,
        lobby: action.data,
        error: null,
        isProcessing: false
      }
    }

    default:
      return state
  }
}
