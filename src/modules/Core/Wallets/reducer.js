// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../ReduxTypes.js'

export type WalletsState = {
  byId: {
    [id: string]: EdgeCurrencyWallet
  }
}

export const initialState = {}

const byId = (state = initialState, action: Action): $PropertyType<WalletsState, 'byId'> => {
  switch (action.type) {
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

export const wallets: Reducer<WalletsState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    state = undefined
  }

  return combineReducers({ byId })(state, action)
}
