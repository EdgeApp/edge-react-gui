import { combineReducers, Reducer } from 'redux'

import { Action } from '../../types/reduxActions'

export interface HandleActivationInfo {
  supportedCurrencies: { [key: string]: boolean }
  activationCost: string
}

export type HandleAvailableStatus = 'AVAILABLE' | 'INVALID' | 'UNAVAILABLE' | 'UNKNOWN_ERROR' | ''

export interface AccountActivationPaymentInfo {
  paymentAddress: string
  amount: string
  currencyCode: string
  exchangeAmount: string
  expireTime: number
}

export interface CreateWalletState {
  isCheckingHandleAvailability: boolean
  handleAvailableStatus: HandleAvailableStatus
  handleActivationInfo: HandleActivationInfo
  walletAccountActivationPaymentInfo: AccountActivationPaymentInfo
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

export const createWallet = combineReducers<CreateWalletState, Action>({
  isCheckingHandleAvailability,
  handleAvailableStatus,
  handleActivationInfo,
  walletAccountActivationPaymentInfo,
  walletAccountActivationQuoteError
})
