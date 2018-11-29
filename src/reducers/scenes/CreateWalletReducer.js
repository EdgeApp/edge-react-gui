// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'

export type CreateWalletState = {
  isCreatingWallet: boolean
}

const isCreatingWallet = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'UI/WALLETS/CREATE_WALLET_START': {
      return true
    }

    case 'UI/WALLETS/CREATE_WALLET_SUCCESS': {
      return false
    }

    case 'UI/WALLETS/CREATE_WALLET_FAILURE': {
      return false
    }

    default:
      return state
  }
}

const isCheckingHandleAvailability = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'IS_CHECKING_HANDLE_AVAILABILITY': {
      return action.data
    }
    case 'IS_HANDLE_AVAILABLE': {
      return false
    }
    default:
      return state
  }
}

const isHandleAvailable = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'IS_CHECKING_HANDLE_AVAILABILITY': {
      if (action.data === true) {
        return false
      }
      return state
    }
    case 'IS_HANDLE_AVAILABLE': {
      return action.data
    }
    default:
      return state
  }
}

const handleActivationInfo = (state: {supportedCurrencies: {[string]: boolean}, activationCost: string} = {}, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_ACTIVATION_INFO':
      return action.data
    default:
      return state
  }
}

const accountActivationPaymentInfo = (state = {}, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_ACTIVATION_PAYMENT_INFO':
      return action.data
    default:
      return state
  }
}

export const createWallet: Reducer<CreateWalletState, Action> = combineReducers({
  isCreatingWallet,
  isCheckingHandleAvailability,
  isHandleAvailable,
  handleActivationInfo,
  accountActivationPaymentInfo
})
