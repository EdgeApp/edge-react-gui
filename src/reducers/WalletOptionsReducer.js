// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../types/reduxTypes.js'
import { xPubExplorer, xPubSyntax } from './XPubModalReducer.js'

export type WalletListState = {
  +viewXPubWalletModalVisible: boolean,
  +walletId: string,
  +xPubSyntax: string,
  +xPubExplorer: string
}

const walletId = (state = '', action: Action): string => {
  switch (action.type) {
    case 'OPEN_VIEWXPUB_WALLET_MODAL': {
      return action.data.walletId
    }

    case 'CLOSE_VIEWXPUB_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}

const viewXPubWalletModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_VIEWXPUB_WALLET_MODAL': {
      return true
    }

    case 'CLOSE_VIEWXPUB_WALLET_MODAL': {
      return false
    }

    default:
      return state
  }
}

export const walletList: Reducer<WalletListState, Action> = combineReducers({
  viewXPubWalletModalVisible,
  walletId,
  xPubSyntax,
  xPubExplorer
})
