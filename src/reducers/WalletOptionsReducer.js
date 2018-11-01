// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../modules/ReduxTypes.js'
import { privateSeedUnlocked } from './GetSeedModalReducer'
import { renameWalletInput, walletName } from './WalletRenameModalReducer.js'
import { xPubSyntax } from './XPubModalReducer.js'

export type WalletListState = {
  +deleteWalletModalVisible: boolean,
  +getSeedWalletModalVisible: boolean,
  +privateSeedUnlocked: boolean,
  +renameWalletInput: string,
  +renameWalletModalVisible: boolean,
  +resyncWalletModalVisible: boolean,
  +splitWalletModalVisible: boolean, // MISSING!!!
  +viewXPubWalletModalVisible: boolean,
  +walletArchivesVisible: boolean,
  +walletId: string,
  +walletName: string,
  +xPubSyntax: string
}

const walletId = (state = '', action: Action): string => {
  switch (action.type) {
    case 'OPEN_RESYNC_WALLET_MODAL':
    case 'OPEN_RENAME_WALLET_MODAL':
    case 'OPEN_VIEWXPUB_WALLET_MODAL':
    case 'OPEN_GETSEED_WALLET_MODAL':
    case 'OPEN_SPLIT_WALLET_MODAL':
    case 'OPEN_DELETE_WALLET_MODAL': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.walletId
    }

    case 'CLOSE_RESYNC_WALLET_MODAL':
    case 'CLOSE_RENAME_WALLET_MODAL':
    case 'CLOSE_VIEWXPUB_WALLET_MODAL':
    case 'CLOSE_GETSEED_WALLET_MODAL':
    case 'CLOSE_SPLIT_WALLET_MODAL':
    case 'CLOSE_DELETE_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}

const walletArchivesVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    // case ACTION.OPEN_WALLET_ARCHIVES:
    //   return true
    // case ACTION.CLOSE_WALLET_ARCHIVES:
    //   return false
    default:
      return state
  }
}

const deleteWalletModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_DELETE_WALLET_MODAL': {
      return true
    }

    case 'CLOSE_DELETE_WALLET_MODAL': {
      return false
    }

    default:
      return state
  }
}

const renameWalletModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_RENAME_WALLET_MODAL': {
      return true
    }

    case 'CLOSE_RENAME_WALLET_MODAL': {
      return false
    }

    default:
      return state
  }
}

const resyncWalletModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_RESYNC_WALLET_MODAL': {
      return true
    }

    case 'CLOSE_RESYNC_WALLET_MODAL': {
      return false
    }

    default:
      return state
  }
}

const getSeedWalletModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_GETSEED_WALLET_MODAL': {
      return true
    }

    case 'CLOSE_GETSEED_WALLET_MODAL': {
      return false
    }

    default:
      return state
  }
}

const viewXPubWalletModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_VIEWXPUB_WALLET_MODAL': {
      return true
    }

    case 'CLOSE_VIEWXPUB_WALLET_MODAL': {
      return false
    }

    default:
      return state
  }
}

const splitWalletModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'OPEN_SPLIT_WALLET_MODAL': {
      return true
    }

    case 'CLOSE_SPLIT_WALLET_MODAL': {
      return false
    }

    default:
      return state
  }
}

export const walletList: Reducer<WalletListState, Action> = combineReducers({
  deleteWalletModalVisible,
  getSeedWalletModalVisible,
  privateSeedUnlocked,
  renameWalletInput,
  renameWalletModalVisible,
  resyncWalletModalVisible,
  splitWalletModalVisible,
  viewXPubWalletModalVisible,
  walletArchivesVisible,
  walletId,
  walletName,
  xPubSyntax
})
