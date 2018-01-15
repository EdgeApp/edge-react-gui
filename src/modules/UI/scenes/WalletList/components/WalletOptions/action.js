// @flow

import {Actions} from 'react-native-router-flux'

import type {Dispatch, GetState} from '../../../../../ReduxTypes'

import * as ACCOUNT_API from '../../../../../Core/Account/api.js'
import * as WALLET_API from '../../../../../Core/Wallets/api.js'
import * as UI_ACTIONS from '../../../../Wallets/action.js'
import * as Constants from '../../../../../../constants/indexConstants'

import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import * as WALLET_SELECTORS from '../../../../selectors.js'

export const OPEN_MODAL_VALUE = (value: string) => `OPEN_${value.toUpperCase()}_WALLET_MODAL`
export const OPEN_MODAL_FUNCTION = (value: string) =>
  `open${value.charAt(0).toUpperCase() + value.slice(1)}WalletModal`

export const CLOSE_MODAL_VALUE = (value: string) => `CLOSE_${value.toUpperCase()}_WALLET_MODAL`
export const CLOSE_MODAL_FUNCTION = (value: string) =>
  `close${value.charAt(0).toUpperCase() + value.slice(1)}WalletModal`
export const VISIBLE_MODAL_NAME = (value: string) => `${value}WalletModalVisible`

export const ARCHIVE_WALLET_START = 'ARCHIVE_WALLET_START'
export const ARCHIVE_WALLET_SUCCESS = 'ARCHIVE_WALLET_SUCCESS'

export const ACTIVATE_WALLET_START = 'ACTIVATE_WALLET_START'
export const ACTIVATE_WALLET_SUCCESS = 'ACTIVATE_WALLET_SUCCESS'

export const RENAME_WALLET_START = 'RENAME_WALLET_START'
export const RENAME_WALLET_SUCCESS = 'RENAME_WALLET_SUCCESS'

export const RESYNC_WALLET_START = 'RESYNC_WALLET_START'
export const RESYNC_WALLET_SUCCESS = 'RESYNC_WALLET_SUCCESS'

export const SPLIT_WALLET_START = 'SPLIT_WALLET_START'
export const SPLIT_WALLET_SUCCESS = 'SPLIT_WALLET_SUCCESS'

export const DELETE_WALLET_START = 'DELETE_WALLET_START'
export const DELETE_WALLET_SUCCESS = 'DELETE_WALLET_SUCCESS'

export const UPDATE_RENAME_WALLET_INPUT = 'UPDATE_RENAME_WALLET_INPUT'

export const ADD_TOKEN = 'ADD_TOKEN'

const wrap = (type, data) => ({ type, data })
const getSplitType = () => 'wallet:bitcoincash'

export const walletRowOption = (walletId: string, option: string, archived: boolean) => {
  if (option === Constants.ARCHIVE_VALUE && archived) {
    option = Constants.ACTIVATE_VALUE
  }
  switch (option) {
    case Constants.RESTORE_VALUE:
    case Constants.ACTIVATE_VALUE:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const account = CORE_SELECTORS.getAccount(state)

        dispatch(wrap(ACTIVATE_WALLET_START, {walletId}))

        ACCOUNT_API.activateWalletRequest(account, walletId)
        .then(() => {
          dispatch(wrap(ACTIVATE_WALLET_SUCCESS, {walletId}))
        })
        .catch((e) => console.log(e))
      }

    case Constants.ARCHIVE_VALUE:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const account = CORE_SELECTORS.getAccount(state)

        dispatch(wrap(ARCHIVE_WALLET_START, {walletId}))

        ACCOUNT_API.archiveWalletRequest(account, walletId)
        .then(() => {
          dispatch(wrap(ARCHIVE_WALLET_SUCCESS, {walletId}))
        })
        .catch((e) => console.log(e))
      }

    case Constants.ADD_TOKEN_VALUE:
      return (dispatch: Dispatch) => {
        dispatch(wrap(ADD_TOKEN, {walletId}))
      }

    case Constants.WALLET_OPTIONS.MANAGE_TOKENS.value:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = WALLET_SELECTORS.getWallet(state, walletId)
        Actions.manageTokens({guiWallet: wallet})
      }

    case Constants.WALLET_OPTIONS.RENAME.value:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const walletName = CORE_SELECTORS.getWallet(state, walletId).name

        dispatch(wrap(OPEN_MODAL_VALUE(Constants.WALLET_OPTIONS.RENAME.value), {walletId, walletName}))
      }

    case Constants.WALLET_OPTIONS.DELETE.value:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.WALLET_OPTIONS.DELETE.value), {walletId}))
      }

    case Constants.WALLET_OPTIONS.RESYNC.value:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.WALLET_OPTIONS.RESYNC.value), {walletId}))
      }

    case Constants.WALLET_OPTIONS.SPLIT.value:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.WALLET_OPTIONS.SPLIT.value), {walletId}))
      }

    case Constants.WALLET_OPTIONS.GET_SEED.value:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.WALLET_OPTIONS.GET_SEED.value), {walletId}))
      }
  }
}

export const renameWallet = (walletId: string, walletName: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  dispatch(wrap(RENAME_WALLET_START, {walletId}))

  WALLET_API.renameWalletRequest(wallet, walletName)
    .then(() => {
      dispatch(wrap(RENAME_WALLET_SUCCESS, {walletId}))
      dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch((e) => console.log(e))
}

export const resyncWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  dispatch(wrap(RESYNC_WALLET_START, {walletId}))

  WALLET_API.resyncWallet(wallet)
    .then(() => {
      dispatch(wrap(RESYNC_WALLET_SUCCESS, {walletId}))
      dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch((e) => console.log(e))
}

export const splitWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(wrap(SPLIT_WALLET_START, {walletId}))

  account.splitWalletInfo(walletId, getSplitType())
    .then(() => {
      dispatch(wrap(SPLIT_WALLET_SUCCESS, {walletId}))
      dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch((e) => console.log(e))
}

export const deleteWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(wrap(DELETE_WALLET_START, {walletId}))

  ACCOUNT_API.deleteWalletRequest(account, walletId)
    .then(() => {
      dispatch(wrap(DELETE_WALLET_SUCCESS, {walletId}))
    })
    .catch((e) => console.log(e))
}
