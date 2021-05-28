// @flow

import type { Reducer } from 'redux'

import type { Action } from '../types/reduxActions'

/**
 * { [fullCurrencyCode]: walletId }
 */
export type CcWalletMap = {
  [fullCurrencyCode: string]: string
}

export type FioState = {
  connectedWalletsByFioAddress: {
    [fioAddress: string]: CcWalletMap
  },
  needToCheckExpired: boolean
}

const initialState: FioState = {
  connectedWalletsByFioAddress: {},
  needToCheckExpired: false
}

export const fio: Reducer<FioState, Action> = (
  state = initialState,
  action: Action
) => {
  switch (action.type) {
    case 'FIO/UPDATE_CONNECTED_WALLETS':
      return {
        ...state,
        connectedWalletsByFioAddress: {
          ...action.data.connectedWalletsByFioAddress
        }
      }
    case 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS': {
      const { connectedWalletsByFioAddress } = state
      connectedWalletsByFioAddress[action.data.fioAddress] = {
        ...connectedWalletsByFioAddress[action.data.fioAddress],
        ...action.data.ccWalletMap
      }
      return {
        ...state,
        connectedWalletsByFioAddress
      }
    }
    case 'FIO/NEED_TO_CHECK_EXPIRED': {
      return {
        ...state,
        needToCheckExpired: action.data
      }
    }
    default:
      return state
  }
}
