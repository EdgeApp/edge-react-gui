import * as ACCOUNT_ACTIONS from '../Core/Account/action.js'
import * as WALLET_ACTIONS from '../Core/Wallets/action.js'

export const initializeAccount = account => {
  return dispatch => {
    dispatch(ACCOUNT_ACTIONS.addAccount(account))
    dispatch(updateWallets(account))
  }
}

export const updateWallets = account => {
  return (dispatch, getState) => {
    console.log('updating wallets')
    // dispatch(updateWalletsStart())
    const state = getState()
    const supportedTypes = [
      'wallet:shitcoin',
      'wallet:bitcoin'
    ]
    let allKeys = account.allKeys
    const keyInfos = allKeys.filter(keyInfo => {
      return supportedTypes.includes(keyInfo.type)
    })

    const walletIds = Object.keys(state.core.wallets.byId)

    const filteredSortedKeyInfos = keyInfos
      .filter(key => { return !key.deleted })
      .sort((a, b) => a.sortIndex - b.sortIndex)

    const activatedKeyInfos = getActivatedKeyInfos(filteredSortedKeyInfos)
    const archivedKeyInfos = getArchivedKeyInfos(filteredSortedKeyInfos)
    const deletedWalletIds = getDeletedWalletIds(walletIds, filteredSortedKeyInfos)

    activatedKeyInfos.forEach(keyInfo => {
      dispatch(WALLET_ACTIONS.activateWalletRequest(keyInfo))
    })

    archivedKeyInfos.forEach(keyInfo => {
      dispatch(WALLET_ACTIONS.archiveWalletRequest(keyInfo))
    })

    deletedWalletIds.forEach(walletId => {
      dispatch(WALLET_ACTIONS.deleteWalletRequest(walletId))
    })
  }
}

const getActivatedKeyInfos = keyInfos => {
  const activatedKeyInfos = keyInfos.filter(keyInfo => {
    return !keyInfo.archived
  })
  return activatedKeyInfos
}

const getArchivedKeyInfos = keyInfos => {
  const archivedKeyInfos = keyInfos.filter(keyInfo => {
    return keyInfo.archived
  })
  return archivedKeyInfos
}

const getDeletedWalletIds = (walletIds, keyInfos) => {
  const deletedWalletIds = walletIds
    .filter(walletId => {
      return !keyInfos.find(info => info.id === walletId)
    })

  return deletedWalletIds
}
