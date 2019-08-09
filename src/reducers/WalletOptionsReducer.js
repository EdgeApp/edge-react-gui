// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../types/reduxTypes.js'
import { xPubSyntax } from './XPubModalReducer.js'

export type WalletListState = {
  +viewXPubWalletModalVisible: boolean,
  +walletArchivesVisible: boolean,
  +walletId: string,
  +xPubSyntax: string
}

const walletId = (state = '', action: Action): string => {
  switch (action.type) {
    case 'OPEN_VIEWXPUB_WALLET_MODAL': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.walletId
    }

    case 'CLOSE_VIEWXPUB_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}

const walletArchivesVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    // case ACTION.OPEN_WALLET_ARCHIVES:
    //   return true
    // case ACTION.CLOSE_WALLET_ARCHIVES:
    //   return false
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
  walletArchivesVisible,
  walletId,
  xPubSyntax
})
