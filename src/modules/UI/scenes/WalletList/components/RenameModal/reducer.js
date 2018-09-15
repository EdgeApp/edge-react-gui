// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../../../ReduxTypes.js'

export const walletName = (state: string = '', action: Action) => {
  switch (action.type) {
    case 'OPEN_RENAME_WALLET_MODAL': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.walletName || 'Wallet Name'
    }

    case 'CLOSE_RENAME_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}

export const renameWalletInput = (state: string = '', action: Action) => {
  switch (action.type) {
    case 'UPDATE_RENAME_WALLET_INPUT': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.renameWalletInput
    }

    case 'CLOSE_RENAME_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}

const walletList = combineReducers({
  renameWalletInput,
  walletName
})

export default walletList
