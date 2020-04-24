// @flow

import type { Reducer } from 'redux'

import type { Action } from '../types/reduxActions'

export type FioState = {
  connectedPubAddresses: {
    [fioAddress: string]: {
      [fullCurrencyCode: string]: string
    }
  }
}

const initialState: FioState = {
  connectedPubAddresses: {}
}

export const fio: Reducer<FioState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/UPDATE_PUB_ADDRESSES':
      if (!action.data) throw new Error(`Invalid action FIO/UPDATE_PUB_ADDRESSES`)
      return {
        ...state,
        connectedPubAddresses: action.data.connectedPubAddresses
      }
    case 'FIO/UPDATE_PUB_ADDRESSES_FOR_FIO_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO/UPDATE_PUB_ADDRESSES`)
      const { connectedPubAddresses } = state
      connectedPubAddresses[action.data.fioAddress] = { ...connectedPubAddresses[action.data.fioAddress], ...action.data.pubAddresses }
      return {
        ...state,
        connectedPubAddresses
      }
    default:
      return state
  }
}
