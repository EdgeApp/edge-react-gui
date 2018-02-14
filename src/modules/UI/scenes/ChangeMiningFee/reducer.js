// @flow

import { combineReducers } from 'redux'

import * as Constants from '../../../../constants/indexConstants'
import type { Action } from '../../../ReduxTypes.js'
import * as ACTION from '../WalletList/components/WalletOptions/action'

const isCustomFeeVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case ACTION.OPEN_MODAL_VALUE(Constants.CUSTOM_FEES):
      return true
    case ACTION.CLOSE_MODAL_VALUE(Constants.CUSTOM_FEES):
      return false
    default:
      return state
  }
}

export const changeMiningFee = combineReducers({
  isCustomFeeVisible
})

export default changeMiningFee
