import { EdgeCurrencyWallet } from 'edge-core-js'
import { combineReducers, Reducer } from 'redux'

import { Action } from '../../types/reduxTypes'

export interface WalletsState {
  selectedWalletId: string
  selectedCurrencyCode: string
  walletLoadingProgress: { [walletId: string]: number }
  fioWallets: EdgeCurrencyWallet[]
}

const walletLoadingProgress = (state = {}, action: Action): WalletsState['walletLoadingProgress'] => {
  switch (action.type) {
    case 'INSERT_WALLET_IDS_FOR_PROGRESS': {
      const activeWalletIdList = action.data.activeWalletIds
      const activeWalletIdProgress = {}
      activeWalletIdList.forEach(item => {
        // @ts-expect-error
        activeWalletIdProgress[item] = 0
      })
      return activeWalletIdProgress
    }

    case 'UPDATE_WALLET_LOADING_PROGRESS': {
      // prevent backwards progress
      // @ts-expect-error
      if (action.data.addressLoadingProgress < state[action.data.walletId]) return state
      return {
        ...state,
        [action.data.walletId]: action.data.addressLoadingProgress
      }
    }

    case 'RESET_WALLET_LOADING_PROGRESS': {
      return {
        ...state,
        [action.data.walletId]: 0.05
      }
    }

    default:
      return state
  }
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
  walletLoadingProgress,
  fioWallets
})
