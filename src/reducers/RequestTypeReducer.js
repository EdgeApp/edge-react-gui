// @flow

import * as Constants from '../constants/indexConstants.js'
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
    case Constants.NEW_RECEIVE_ACCRESS:
    case Constants.UPDATE_RECEIVE_ADDRESS_SUCCESS:
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
    case Constants.USE_REGULAR_REQUEST_ADDRESS:
      return { ...state, useLegacyAddress: false }
    case Constants.USE_LEGACY_REQUEST_ADDRESS:
      return { ...state, useLegacyAddress: true }
    default:
      return state
  }
}

export { requestType }
