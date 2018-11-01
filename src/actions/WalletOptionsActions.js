// @flow

import { Actions } from 'react-native-router-flux'

import * as Constants from '../constants/indexConstants'
import * as ACCOUNT_API from '../modules/Core/Account/api.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes'
import * as WALLET_SELECTORS from '../modules/UI/selectors.js'
import { showDeleteWalletModal } from './DeleteWalletModalActions.js'
import { showResyncWalletModal } from './ResyncWalletModalActions.js'
import { showSplitWalletModal } from './SplitWalletModalActions.js'

export const walletRowOption = (walletId: string, option: string, archived: boolean) => {
  if (option === 'archive' && archived) {
    option = 'activate'
  }
  switch (option) {
    case 'restore':
    case 'activate': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const account = CORE_SELECTORS.getAccount(state)

        dispatch({ type: 'ACTIVATE_WALLET_START', data: { walletId } })

        ACCOUNT_API.activateWalletRequest(account, walletId)
          .then(() => {
            dispatch({ type: 'ACTIVATE_WALLET_SUCCESS', data: { walletId } })
          })
          .catch(error => console.log(error))
      }
    }

    case 'archive': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const account = CORE_SELECTORS.getAccount(state)

        dispatch({ type: 'ARCHIVE_WALLET_START', data: { walletId } })

        ACCOUNT_API.archiveWalletRequest(account, walletId)
          .then(() => {
            dispatch({ type: 'ARCHIVE_WALLET_SUCCESS', data: { walletId } })
          })
          .catch(error => console.log(error))
      }
    }

    case 'addToken': {
      return (dispatch: Dispatch) => {
        dispatch({ type: 'ADD_TOKEN', data: { walletId } })
      }
    }

    case 'manageTokens': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = WALLET_SELECTORS.getWallet(state, walletId)
        Actions.manageTokens({ guiWallet: wallet })
      }
    }

    case 'rename': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const walletName = CORE_SELECTORS.getWallet(state, walletId).name
        // $FlowFixMe
        dispatch({ type: 'OPEN_RENAME_WALLET_MODAL', data: { walletId, walletName } })
      }
    }

    case 'delete': {
      return (dispatch: Dispatch) => {
        dispatch(showDeleteWalletModal(walletId))
      }
    }

    case 'resync': {
      return (dispatch: Dispatch) => {
        dispatch(showResyncWalletModal(walletId))
      }
    }

    case 'split': {
      return (dispatch: Dispatch) => {
        dispatch(showSplitWalletModal(walletId))
      }
    }

    case 'getSeed': {
      return (dispatch: Dispatch) => {
        dispatch({ type: 'OPEN_GETSEED_WALLET_MODAL', data: { walletId } })
      }
    }

    case 'viewXPub': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = CORE_SELECTORS.getWallet(state, walletId)
        const xPub = wallet.getDisplayPublicSeed()
        dispatch({ type: 'OPEN_VIEWXPUB_WALLET_MODAL', data: { xPub, walletId } })
      }
    }

    case 'exportWalletTransactions': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = state.core.wallets.byId[walletId]
        Actions[Constants.TRANSACTIONS_EXPORT]({ sourceWallet: wallet })
      }
    }
  }
}
