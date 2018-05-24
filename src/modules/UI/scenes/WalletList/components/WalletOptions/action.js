// @flow

import { Actions } from 'react-native-router-flux'

import * as Constants from '../../../../../../constants/indexConstants'
import * as ACCOUNT_API from '../../../../../Core/Account/api.js'
import * as CORE_SELECTORS from '../../../../../Core/selectors.js'
import type { Dispatch, GetState } from '../../../../../ReduxTypes'
import * as WALLET_SELECTORS from '../../../../selectors.js'

export const OPEN_MODAL_VALUE = (value: string) => `OPEN_${value.toUpperCase()}_WALLET_MODAL`
export const OPEN_MODAL_FUNCTION = (value: string) => `open${value.charAt(0).toUpperCase() + value.slice(1)}WalletModal`

export const CLOSE_MODAL_VALUE = (value: string) => `CLOSE_${value.toUpperCase()}_WALLET_MODAL`
export const CLOSE_MODAL_FUNCTION = (value: string) => `close${value.charAt(0).toUpperCase() + value.slice(1)}WalletModal`
export const VISIBLE_MODAL_NAME = (value: string) => `${value}WalletModalVisible`

export const START_MODAL_VALUE = (value: string) => `${value.toUpperCase()}_WALLET_START`
export const SUCCESS_MODAL_VALUE = (value: string) => `CLOSE_${value.toUpperCase()}_WALLET_SUCCESS`

export const ARCHIVE_WALLET_START = 'ARCHIVE_WALLET_START'
export const ARCHIVE_WALLET_SUCCESS = 'ARCHIVE_WALLET_SUCCESS'

export const ACTIVATE_WALLET_START = 'ACTIVATE_WALLET_START'
export const ACTIVATE_WALLET_SUCCESS = 'ACTIVATE_WALLET_SUCCESS'

export const ADD_TOKEN = 'ADD_TOKEN'

export const wrap = (type: string, data: any) => ({ type, data })

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

        dispatch(wrap(ACTIVATE_WALLET_START, { walletId }))

        ACCOUNT_API.activateWalletRequest(account, walletId)
          .then(() => {
            dispatch(wrap(ACTIVATE_WALLET_SUCCESS, { walletId }))
          })
          .catch(e => console.log(e))
      }

    case Constants.ARCHIVE_VALUE:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const account = CORE_SELECTORS.getAccount(state)

        dispatch(wrap(ARCHIVE_WALLET_START, { walletId }))

        ACCOUNT_API.archiveWalletRequest(account, walletId)
          .then(() => {
            dispatch(wrap(ARCHIVE_WALLET_SUCCESS, { walletId }))
          })
          .catch(e => console.log(e))
      }

    case Constants.ADD_TOKEN_VALUE:
      return (dispatch: Dispatch) => {
        dispatch(wrap(ADD_TOKEN, { walletId }))
      }

    case Constants.MANAGE_TOKENS_VALUE:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = WALLET_SELECTORS.getWallet(state, walletId)
        Actions.manageTokens({ guiWallet: wallet })
      }

    case Constants.RENAME_VALUE:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const walletName = CORE_SELECTORS.getWallet(state, walletId).name

        dispatch(wrap(OPEN_MODAL_VALUE(Constants.RENAME_VALUE), { walletId, walletName }))
      }

    case Constants.DELETE_VALUE:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.DELETE_VALUE), { walletId }))
      }

    case Constants.RESYNC_VALUE:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.RESYNC_VALUE), { walletId }))
      }

    case Constants.SPLIT_VALUE:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.SPLIT_VALUE), { walletId }))
      }

    case Constants.GET_SEED_VALUE:
      return (dispatch: Dispatch) => {
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.GET_SEED_VALUE), { walletId }))
      }

    case Constants.VIEW_XPUB_VALUE:
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = CORE_SELECTORS.getWallet(state, walletId)
        const xPub = wallet.getDisplayPublicSeed()
        dispatch(wrap(OPEN_MODAL_VALUE(Constants.VIEW_XPUB_VALUE), { xPub, walletId }))
      }
    case Constants.EXPORT_WALLET_TRANSACTIONS_VALUE:
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = state.core.wallets.byId[walletId]
        Actions[Constants.TRANSACTIONS_EXPORT]({ sourceWallet: wallet })
      }
  }
}
