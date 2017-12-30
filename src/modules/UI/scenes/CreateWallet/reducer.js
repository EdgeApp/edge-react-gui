// @flow

import {combineReducers} from 'redux'
import * as ACTION from './action'
import type {Action} from '../../../ReduxTypes.js'

export type WalletNameState = string
export type SelectedWalletTypeState = string
export type SelectedFiatState = string

const walletName = (state: WalletNameState = '', action: Action) => {
  if (!action.data) return state
  switch (action.type) {
  case ACTION.UPDATE_WALLET_NAME:
    return action.data.walletName
  default:
    return state
  }
}

const selectedWalletType = (state: SelectedWalletTypeState = '', action: Action) => {
  if (!action.data) return state
  switch (action.type) {
  case ACTION.SELECT_WALLET_TYPE:
    return action.data.walletType
  default:
    return state
  }
}

const selectedFiat = (state: SelectedFiatState = '', action: Action) => {
  if (!action.data) return state
  switch (action.type) {
  case ACTION.SELECT_FIAT:
    return action.data.fiat
  default:
    return state
  }
}

const createWallet = combineReducers({
  walletName,
  selectedWalletType,
  selectedFiat
})

export default createWallet
