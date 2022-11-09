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
  expiredLastChecks: { [fioName: string]: Date }
  expiredChecking: boolean
  expireReminderShown: boolean
  walletsCheckedForExpired: { [walletId: string]: boolean }
}

const initialState: FioState = {
  connectedWalletsByFioAddress: {},
  expiredLastChecks: {},
  expiredChecking: false,
  expireReminderShown: false,
  walletsCheckedForExpired: {}
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
    case 'FIO/SET_LAST_EXPIRED_CHECKS': {
      return {
        ...state,
        expiredLastChecks: action.data
      }
    }
    case 'FIO/CHECKING_EXPIRED': {
      return {
        ...state,
        expiredChecking: action.data
      }
    }
    case 'FIO/EXPIRED_REMINDER_SHOWN': {
      return {
        ...state,
        expireReminderShown: true
      }
    }
    case 'FIO/WALLETS_CHECKED_FOR_EXPIRED': {
      return {
        ...state,
        walletsCheckedForExpired: action.data
      }
    }
    default:
      return state
  }
}
