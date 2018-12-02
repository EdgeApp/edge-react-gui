// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/Action.js'

type HandleActivationInfo = {
  supportedCurrencies: {
    [string]: boolean
  },
  activationCost: string
}

type AccountActivationPaymentInfo = {
  paymentAddress: string,
  nativeAmount: string,
  currencyCode: string,
  exchangeAmount: string,
  expirationDate: number
}

export type CreateWalletState = {
  isCreatingWallet: boolean,
  isCheckingHandleAvailability: boolean,
  isHandleAvailable: boolean,
  handleActivationInfo: HandleActivationInfo,
  walletAccountActivationPaymentInfo: AccountActivationPaymentInfo
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
      if (action.data === true) {
        return true
      } else {
        return false
      }
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
      if (action.data === true) {
        return true
      } else {
        return false
      }
    }
    default:
      return state
  }
}

const initialHandleActivationInfo = {
  supportedCurrencies: {},
  activationCost: ''
}

const handleActivationInfo = (state = initialHandleActivationInfo, action: Action): HandleActivationInfo => {
  switch (action.type) {
    case 'ACCOUNT_ACTIVATION_INFO':
      if (action.data) {
        return action.data
      } else {
        return state
      }
    default:
      return state
  }
}

const initialActivationPaymentState = {
  paymentAddress: '',
  nativeAmount: '',
  currencyCode: '',
  exchangeAmount: '',
  expirationDate: 0
}

const walletAccountActivationPaymentInfo = (state = initialActivationPaymentState, action: Action): AccountActivationPaymentInfo => {
  switch (action.type) {
    case 'ACCOUNT_ACTIVATION_PAYMENT_INFO':
      if (action.data) {
        return action.data
      } else {
        return state
      }
    default:
      return state
  }
}

export const createWallet: Reducer<CreateWalletState, Action> = combineReducers({
  isCreatingWallet,
  isCheckingHandleAvailability,
  isHandleAvailable,
  handleActivationInfo,
  walletAccountActivationPaymentInfo
})
