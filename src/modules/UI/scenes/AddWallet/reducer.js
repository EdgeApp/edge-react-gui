import {combineReducers} from 'redux'
import * as ACTION from './action'

const newWalletName = (state = '', action) => {
  switch (action.type) {
    case ACTION.UPDATE_NEW_WALLET_NAME :
      return action.data
    default:
      return state
  }
}

const addWallet = combineReducers({
  newWalletName
})

export default addWallet