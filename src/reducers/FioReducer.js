// @flow

import type { Reducer } from 'redux'

import type { Action } from '../types/reduxActions'
import type { FioObtRecord } from '../types/types'

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
  obtRecords: FioObtRecord[]
}

const initialState: FioState = {
  connectedWalletsByFioAddress: {},
  obtRecords: []
}

export const fio: Reducer<FioState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/UPDATE_CONNECTED_WALLETS':
      if (!action.data) throw new Error(`Invalid action FIO/UPDATE_CONNECTED_WALLETS`)
      return {
        ...state,
        connectedWalletsByFioAddress: action.data.connectedWalletsByFioAddress
      }
    case 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS`)
      const { connectedWalletsByFioAddress } = state
      connectedWalletsByFioAddress[action.data.fioAddress] = { ...connectedWalletsByFioAddress[action.data.fioAddress], ...action.data.ccWalletMap }
      return {
        ...state,
        connectedWalletsByFioAddress
      }
    case 'FIO/SET_OBT_DATA':
      if (!action.data) throw new Error('Invalid action SET_OBT_DATA')
      return {
        ...state,
        obtRecords: action.data
      }
    default:
      return state
  }
}
