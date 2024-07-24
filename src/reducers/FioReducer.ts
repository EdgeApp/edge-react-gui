import { Reducer } from 'redux'

import { Action } from '../types/reduxActions'

/**
 * { [fullCurrencyCode]: walletId }
 */
export interface CcWalletMap {
  [fullCurrencyCode: string]: string
}

export interface FioState {
  connectedWalletsByFioAddress: {
    [fioAddress: string]: CcWalletMap
  }
}

const initialState: FioState = {
  connectedWalletsByFioAddress: {}
}

export const fio: Reducer<FioState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS': {
      const { connectedWalletsByFioAddress } = state
      connectedWalletsByFioAddress[action.data.fioAddress] = { ...connectedWalletsByFioAddress[action.data.fioAddress], ...action.data.ccWalletMap }
      return {
        ...state,
        connectedWalletsByFioAddress
      }
    }
    default:
      return state
  }
}
