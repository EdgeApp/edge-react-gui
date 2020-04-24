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
    default:
      return state
  }
}
