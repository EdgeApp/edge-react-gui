// @flow
import type { Action } from '../types/reduxTypes.js'

export const initialState = {
  isConnected: true
}

export type NetworkState = {
  isConnected: boolean
}

export const network = (state: NetworkState = initialState, action: Action) => {
  switch (action.type) {
    case 'NETWORK/NETWORK_STATUS': {
      return {
        ...state,
        isConnected: action.data.isConnected
      }
    }

    default:
      return state
  }
}
