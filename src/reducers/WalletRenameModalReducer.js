// @flow

import type { Action } from '../modules/ReduxTypes.js'

export const walletName = (state: string = '', action: Action): string => {
  switch (action.type) {
    case 'OPEN_RENAME_WALLET_MODAL': {
      if (!action.data) throw new Error('Invalid action')
      // $FlowFixMe
      return action.data.walletName || 'Wallet Name'
    }

    case 'CLOSE_RENAME_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}

export const renameWalletInput = (state: string = '', action: Action): string => {
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
