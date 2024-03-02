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
  walletAccountActivationQuoteError: string
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
  walletAccountActivationQuoteError
})
