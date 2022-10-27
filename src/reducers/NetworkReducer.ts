import { Action } from '../types/reduxTypes'

export const initialState = {
  isConnected: true
}

export interface NetworkState {
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
