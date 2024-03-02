import { combineReducers } from 'redux'

import { Action } from '../../types/reduxActions'
import { EdgeAsset } from '../../types/types'

export interface HandleActivationInfo {
  supportedAssets: EdgeAsset[]
  activationCost: string
}

export interface AccountActivationPaymentInfo {
  paymentAddress: string
  amount: string
  currencyCode: string
  exchangeAmount: string
  expireTime: number
}

export interface CreateWalletState {
  walletAccountActivationPaymentInfo: AccountActivationPaymentInfo
  walletAccountActivationQuoteError: string
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
  walletAccountActivationPaymentInfo,
  walletAccountActivationQuoteError
})
