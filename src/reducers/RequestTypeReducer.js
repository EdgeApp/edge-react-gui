import * as Constants from '../constants/indexConstants.js'

const initialState = {
  useLegacyAddress: false,
  receiveAddress: {},
  uniqueLegacyAddress: false
}
export const requestType = (state = initialState, action) => {
  switch (action.type) {
    case Constants.UPDATE_RECEIVE_ADDRESS_SUCCESS:
      let uniqueLegacy = true
      if (action.data.receiveAddress.legacyAddress) {
        uniqueLegacy = action.data.receiveAddress.publicAddress === action.data.receiveAddress.legacyAddress
      }
      return {
        ...state,
        useLegacyAddress: false,
        receiveAddress: action.data.receiveAddress,
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

export default requestType
