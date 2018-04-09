// @flow

import { combineReducers } from 'redux'

import * as ACTIONS from './action.js'
import * as WALLET_ACTIONS from '../../Wallets/action.js'
import { ACCOUNT_INIT_COMPLETE } from '../../../../constants/ActionConstants.js'
const displayDropdown = (state = false, action = {}) => {
  const { type } = action
  switch (type) {
    case WALLET_ACTIONS.WALLET_PROGRESS_COMPLETED:
      return false
    case ACTIONS.DISPLAY_WALLET_PROGRESS_DROPDOWN:
      return true
    case WALLET_ACTIONS.UPDATE_WALLET_LOADING_PROGRESS:
      return true
    case ACTIONS.DISMISS_WALLET_PROGRESS_DROPDOWN:
      return false
    case ACCOUNT_INIT_COMPLETE:
      return true
    default:
      return state
  }
}

export const walletListProgressDropdown = combineReducers({
  displayDropdown
})

export default walletListProgressDropdown
