// @flow

import { combineReducers } from 'redux'

import * as Constants from '../../../../../../constants/indexConstants'
import type { Action } from '../../../../../ReduxTypes.js'
import { CLOSE_MODAL_VALUE, OPEN_MODAL_VALUE } from '../WalletOptions/action'
import { UPDATE_RENAME_WALLET_INPUT } from './WalletNameInputConnector'

export const walletName = (state: string = '', action: Action) => {
  switch (action.type) {
    case OPEN_MODAL_VALUE(Constants.RENAME_VALUE):
      if (action.data && action.data.walletName) {
        return action.data.walletName
      }
      return 'Wallet Name'
    // case ACTION.CLOSE_RENAME_WALLET_MODAL:
    //   return ''
    default:
      return state
  }
}

export const renameWalletInput = (state: string = '', action: Action) => {
  switch (action.type) {
    case UPDATE_RENAME_WALLET_INPUT:
      if (action.data && action.data.renameWalletInput) {
        return action.data.renameWalletInput
      }
      return ''
    case CLOSE_MODAL_VALUE(Constants.RENAME_VALUE):
      return ''
    default:
      return state
  }
}

const walletList = combineReducers({
  renameWalletInput,
  walletName
})

export default walletList
