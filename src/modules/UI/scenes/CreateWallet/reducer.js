// @flow

import {combineReducers} from 'redux'
import * as ACTION from '../../Wallets/action'
import type {Action} from '../../../ReduxTypes.js'

export type IsCreatingWallet = boolean

const isCreatingWallet = (state = false, action) => {
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

const createWallet = combineReducers({
  isCreatingWallet
})

export default createWallet
