// @flow

import { combineReducers } from 'redux'

import * as ACTIONS from './action.js'
import * as WALLET_ACTIONS from '../../Wallets/action.js'
const displayDropdown = (state = false, action = {}) => {
  const { type } = action
  switch (type) {
    case ACTIONS.DISPLAY_WALLET_PROGRESS_DROPDOWN:
      return true
    case WALLET_ACTIONS.UPDATE_WALLET_LOADING_PROGRESS:
      return true
    case ACTIONS.DISMISS_WALLET_PROGRESS_DROPDOWN:
      return false
    default:
      return state
  }
}

export const walletListProgressDropdown = combineReducers({
  displayDropdown
})

export default walletListProgressDropdown
