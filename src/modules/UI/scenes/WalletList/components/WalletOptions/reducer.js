// @flow

import { combineReducers } from 'redux'

import * as Constants from '../../../../../../constants/indexConstants'
import type { Action } from '../../../../../ReduxTypes.js'
import { privateSeedUnlocked } from '../GetSeedModal/reducer'
import { renameWalletInput, walletName } from '../RenameModal/reducer'
import { xPubSyntax } from '../XPubModal/reducer.js'
import * as ACTION from './action'

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

const walletList = combineReducers(
  Object.assign(reducers, {
    walletArchivesVisible,
    renameWalletInput,
    walletId,
    walletName,
    privateSeedUnlocked,
    xPubSyntax
  })
)

export default walletList
