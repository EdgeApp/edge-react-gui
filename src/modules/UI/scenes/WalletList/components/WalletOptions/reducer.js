// @flow

import * as ACTION from './action'
import {combineReducers} from 'redux'
import type {Action} from '../../../../../ReduxTypes.js'
import * as Constants from '../../../../../../constants/indexConstants'
import { privateSeedLocked } from '../GetSeed/reducer'

const reducers = {}
const openVisible = {}
const closeVisible = {}

for (const walletOption in Constants.WALLET_OPTIONS) {
  const option = Constants.WALLET_OPTIONS[walletOption]
  const value = option.value
  if (option.modalVisible) {
    const open = ACTION.OPEN_MODAL_VALUE(value)
    openVisible[open] = true
    const close = ACTION.CLOSE_MODAL_VALUE(value)
    closeVisible[close] = true
    reducers[ACTION.VISIBLE_MODAL_NAME(value)] = (state: boolean = false, action: Action) => {
      const type = action.type
      switch (type) {
        case open:
          return true
        case close:
          return false
        default:
          return state
      }
    }
  }
}

const walletId = (state: string = '', action: Action) => {
  const { type } = action
  if (openVisible[type]) {
    if (action.data) {
      return action.data.walletId
    }
    return state
  } else if (closeVisible[type]) {
    return ''
  }
  return state
}

const walletArchivesVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    // case ACTION.OPEN_WALLET_ARCHIVES:
    //   return true
    // case ACTION.CLOSE_WALLET_ARCHIVES:
    //   return false
    default:
      return state
  }
}

const walletName = (state: string = '', action: Action) => {
  switch (action.type) {
    case ACTION.OPEN_MODAL_VALUE(Constants.WALLET_OPTIONS.RENAME.value):
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

const renameWalletInput = (state: string = '', action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_RENAME_WALLET_INPUT:
      if (action.data && action.data.renameWalletInput) {
        return action.data.renameWalletInput
      }
      return ''
    case ACTION.CLOSE_MODAL_VALUE(Constants.WALLET_OPTIONS.RENAME.value):
      return ''
    default:
      return state
  }
}

const walletList = combineReducers(Object.assign(reducers, {
  walletArchivesVisible,
  renameWalletInput,
  walletId,
  walletName,
  privateSeedLocked
}))

export default walletList
