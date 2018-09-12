// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../../../ReduxTypes.js'
import { privateSeedUnlocked } from '../GetSeedModal/reducer'
import { renameWalletInput, walletName } from '../RenameModal/reducer'
import { xPubSyntax } from '../XPubModal/reducer.js'

const walletId = (state: string = '', action: Action) => {
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

const deleteWalletModalVisible = (state: boolean = false, action: Action) => {
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

const renameWalletModalVisible = (state: boolean = false, action: Action) => {
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

const resyncWalletModalVisible = (state: boolean = false, action: Action) => {
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

const getSeedWalletModalVisible = (state: boolean = false, action: Action) => {
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

const viewXPubWalletModalVisible = (state: boolean = false, action: Action) => {
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

const splitWalletModalVisible = (state: boolean = false, action: Action) => {
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

export const walletList = combineReducers({
  splitWalletModalVisible,
  deleteWalletModalVisible,
  renameWalletModalVisible,
  resyncWalletModalVisible,
  getSeedWalletModalVisible,
  viewXPubWalletModalVisible,
  walletArchivesVisible,
  renameWalletInput,
  walletId,
  walletName,
  privateSeedUnlocked,
  xPubSyntax
})

export default walletList
