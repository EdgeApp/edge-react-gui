import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import { combineReducers, type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes'

export interface WalletsState {
  fioWallets: EdgeCurrencyWallet[]
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
  fioWallets
})
