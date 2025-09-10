import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import { combineReducers, type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes'

export interface WalletsState {
  selectedWalletId: string
  selectedTokenId: EdgeTokenId
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

const selectedTokenId = (
  state: EdgeTokenId = null,
  action: Action
): EdgeTokenId => {
  switch (action.type) {
    case 'UI/WALLETS/SELECT_WALLET': {
      return action.data.tokenId
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      if (action.data == null) throw new TypeError('Invalid action')
      if (action.data.tokenId === '') return state
      return action.data.tokenId
    }

    default:
      return state
  }
}

const fioWallets: Reducer<WalletsState['fioWallets'], Action> = (
  state = [],
  action
) => {
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
  selectedTokenId,
  fioWallets
})
