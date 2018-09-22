// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { combineReducers } from 'redux'

import { type Action } from '../../ReduxTypes.js'

type WalletState = { [id: string]: EdgeCurrencyWallet } | void

export const initialState = {}

const byId = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE':
    case 'CORE/WALLETS/UPDATE_WALLETS':
      if (!action.data) throw new Error('Invalid action')
      const currencyWallets = action.data.currencyWallets
      return {
        ...state,
        ...currencyWallets
      }

    default:
      return state
  }
}

export const wallets = (state: WalletState, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    state = undefined
  }

  return combineReducers({ byId })(state, action)
}
