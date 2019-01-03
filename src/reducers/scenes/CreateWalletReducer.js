// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/Action.js'

export type HandleActivationInfo = {
  supportedCurrencies: { [string]: boolean },
  activationCost: string
}

export type HandleAvailableStatus = 'AVAILABLE' | 'INVALID' | 'UNAVAILABLE' | 'UNKNOWN_ERROR' | ''

export type AccountActivationPaymentInfo = {
  paymentAddress: string,
  amount: string,
  currencyCode: string,
  exchangeAmount: string,
  expireTime: number
}

export type CreateWalletState = {
  isCreatingWallet: boolean,
  isCheckingHandleAvailability: boolean,
  handleAvailableStatus: HandleAvailableStatus,
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

const isCheckingHandleAvailability: Reducer<boolean, Action> = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'IS_CHECKING_HANDLE_AVAILABILITY': {
      return action.data
    }
    case 'HANDLE_AVAILABLE_STATUS': {
      return false
    }
    default:
      return state
  }
}

const handleAvailableStatus: Reducer<HandleAvailableStatus, Action> = (state = '', action: Action): HandleAvailableStatus => {
  switch (action.type) {
    case 'HANDLE_AVAILABLE_STATUS': {
      if (!action.data) return state
      return action.data
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
      return action.data
    default:
      return state
  }
}

const initialActivationPaymentState = {
  paymentAddress: '',
  amount: '',
  currencyCode: '',
  exchangeAmount: '',
  expireTime: 0
}

const walletAccountActivationPaymentInfo = (state = initialActivationPaymentState, action: Action): AccountActivationPaymentInfo => {
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
  handleAvailableStatus,
  handleActivationInfo,
  walletAccountActivationPaymentInfo
})
