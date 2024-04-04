import { EdgeCurrencyWallet } from 'edge-core-js'
import { combineReducers, Reducer } from 'redux'

import { Action } from '../../types/reduxTypes'

export interface WalletsState {
  selectedWalletId: string
  selectedCurrencyCode: string
  fioWallets: EdgeCurrencyWallet[]
}

const selectedWalletId = (state = '', action: Action): string => {
  switch (action.type) {
    case 'UI/WALLETS/SELECT_WALLET': {
      return action.data.walletId
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      if (action.data == null) throw new TypeError('Invalid action')
      if (action.data.walletId === '') return state
      return action.data.walletId
    }

    default:
      return state
  }
}

const selectedCurrencyCode = (state = '', action: Action): string => {
  switch (action.type) {
    case 'UI/WALLETS/SELECT_WALLET': {
      return action.data.currencyCode
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      if (action.data == null) throw new TypeError('Invalid action')
      if (action.data.currencyCode === '') return state
      return action.data.currencyCode
    }

    default:
      return state
  }
}

const fioWallets: Reducer<WalletsState['fioWallets'], Action> = (state = [], action) => {
  switch (action.type) {
    case 'UPDATE_FIO_WALLETS': {
      const { fioWallets } = action.data
      return fioWallets
    }

    default:
      return state
  }
}

export const wallets = combineReducers<WalletsState, Action>({
  selectedWalletId,
  selectedCurrencyCode,
  fioWallets
})
