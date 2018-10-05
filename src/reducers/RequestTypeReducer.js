// @flow

import { type Reducer } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'

export type RequestTypeState = {
  useLegacyAddress: boolean,
  uniqueLegacyAddress: boolean
}

const initialState: RequestTypeState = {
  useLegacyAddress: false,
  uniqueLegacyAddress: false
}

export const requestType: Reducer<RequestTypeState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'NEW_RECEIVE_ADDRESS':
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

    case 'USE_REGULAR_REQUEST_ADDRESS': {
      return {
        ...state,
        useLegacyAddress: false
      }
    }

    case 'USE_LEGACY_REQUEST_ADDRESS': {
      return {
        ...state,
        useLegacyAddress: true
      }
    }

    default:
      return state
  }
}
