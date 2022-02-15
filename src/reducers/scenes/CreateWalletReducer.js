// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../types/reduxActions.js'

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
  isCheckingHandleAvailability: boolean,
  handleAvailableStatus: HandleAvailableStatus,
  handleActivationInfo: HandleActivationInfo,
  walletAccountActivationPaymentInfo: AccountActivationPaymentInfo,
  walletAccountActivationQuoteError: string
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

const walletAccountActivationQuoteError = (state: string = '', action: Action): string => {
  switch (action.type) {
    case 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR':
      return action.data
    default:
      return state
  }
}

export const createWallet: Reducer<CreateWalletState, Action> = combineReducers({
  isCheckingHandleAvailability,
  handleAvailableStatus,
  handleActivationInfo,
  walletAccountActivationPaymentInfo,
  walletAccountActivationQuoteError
})
