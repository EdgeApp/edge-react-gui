// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

export type IsCreatingWallet = boolean

const isCreatingWallet = (state = false, action: Action) => {
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

export const createWallet = combineReducers({
  isCreatingWallet
})

export default createWallet
