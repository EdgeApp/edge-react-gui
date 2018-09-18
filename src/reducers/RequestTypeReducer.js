// @flow

import type { Action } from '../modules/ReduxTypes.js'

type RequestType = {
  useLegacyAddress: boolean,
  uniqueLegacyAddress: boolean
}
const initialState: RequestType = {
  useLegacyAddress: false,
  uniqueLegacyAddress: false
}
const requestType = (state: RequestType = initialState, action: Action): RequestType => {
  switch (action.type) {
    case 'newReceiveAddress':
    case 'UPDATE_RECEIVE_ADDRESS_SUCCESS': {
      if (!action.data) return state
      let uniqueLegacy = true
      if (action.data.receiveAddress.legacyAddress) {
        uniqueLegacy = action.data.receiveAddress.publicAddress === action.data.receiveAddress.legacyAddress
      }
      return {
        ...state,
        useLegacyAddress: false,
        uniqueLegacyAddress: !uniqueLegacy
      }
    }

    case 'useRegularRequestAddress': {
      return {
        ...state,
        useLegacyAddress: false
      }
    }

    case 'useLegacyRequestAddress': {
      return {
        ...state,
        useLegacyAddress: true
      }
    }

    default:
      return state
  }
}

export { requestType }
