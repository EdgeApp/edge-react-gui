// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'
import * as ACTION from '../../Wallets/action'

export type IsCreatingWallet = boolean

const isCreatingWallet = (state = false, action: Action) => {
  switch (action.type) {
    case ACTION.CREATE_WALLET_START:
      return true
    case ACTION.CREATE_WALLET_SUCCESS:
      return false
    case ACTION.CREATE_WALLET_FAILURE:
      return false
    default:
      return state
  }
}

export const createWallet = combineReducers({
  isCreatingWallet
})

export default createWallet
