// Login/action.js

import * as ACCOUNT_ACTIONS from '../Core/Account/action.js'
import * as WALLET_API from '../Core/Wallets/api.js'
import * as WALLET_ACTIONS from '../Core/Wallets/action.js'
import * as UI_ACTIONS from '../UI/Wallets/action.js'
import * as SETTINGS_ACTIONS from '../UI/Settings/action.js'
import * as SETTINGS_API from '../Core/Account/settings.js'

import * as CORE_SELECTORS from '../Core/selectors.js'

export const initializeAccount = account => {
  return dispatch => {
    dispatch(ACCOUNT_ACTIONS.addAccount(account))
    dispatch(updateWallets())
    dispatch(loadSettings())
  }
}

export const updateWallets = () => {
  return (dispatch, getState) => {
    console.log('updating wallets')
    // dispatch(updateWalletsStart())
    const state = getState()
    const { account } = state.core
    const supportedTypes = [
      'wallet:shitcoin',
      // 'wallet:bitcoin',
      'wallet:ethereum'
    ]

    const filteredSortedKeyInfos = account.allKeys
      .filter(keyInfo => {
        return (supportedTypes.includes(keyInfo.type))
      })
      .sort((a, b) => a.sortIndex - b.sortIndex)

    filteredSortedKeyInfos.forEach(keyInfo => {
      processKeyInfo(keyInfo, dispatch, getState)
    })
  }
}

const processKeyInfo = (keyInfo, dispatch, getState) => {
  if (isPending(keyInfo, getState)) { return }

  if (shouldActivate(keyInfo, getState)) {
    activateWallet(keyInfo, dispatch, getState)
  } else if (shouldArchive(keyInfo, getState)) {
    archiveWallet(keyInfo, dispatch, getState)
  } else if (shouldDelete(keyInfo, getState)) {
    deleteWallet(keyInfo, dispatch, getState)
  }
}

const activateWallet = (keyInfo, dispatch, getState) => {
  dispatch(WALLET_ACTIONS.updateWalletStart(keyInfo.id))

  const state = getState()
  // Retreive or instantiate a wallet object
  const getOrMakeWallet = () => {
    const wallet = CORE_SELECTORS.getWallet(state, keyInfo.id)
    if (wallet) {
      return Promise.resolve(wallet)
    }
    return WALLET_API.makeCurrencyWalletRequest(keyInfo, dispatch, getState)
  }

  getOrMakeWallet()
  .then(wallet => {
    wallet.sortIndex = keyInfo.sortIndex
    if (!wallet.name) { wallet.name = 'no name' }
    // Turn the wallet on
    return WALLET_API.activateWalletRequest(wallet)
  })
  .then(wallet => {
    wallet.archived = false
    wallet.deleted = false
    // Add the wallet to Redux Core
    dispatch(WALLET_ACTIONS.addWallet(wallet))

    // If changes were made during the wallet activation process,
    // start over
    const keyInfo = getState().core.account.allKeys.find(keyInfo => {
      return keyInfo.id === wallet.id
    })
    if (!isInSync(wallet, keyInfo)) {
      dispatch(WALLET_ACTIONS.removePendingStatus(wallet.id))
      return processKeyInfo(keyInfo, dispatch, getState)
    }

    dispatch(WALLET_ACTIONS.updateWalletComplete(keyInfo.id))
    const wallets = getState().core.wallets.byId
    Object.keys(wallets).forEach(id => {
      dispatch(UI_ACTIONS.upsertWalletRequest(wallets[id]))
    })
    // dispatch(UI_ACTIONS.upsertWalletRequest(wallet))
  })
}

const archiveWallet = (keyInfo, dispatch, getState) => {
  dispatch(WALLET_ACTIONS.updateWalletStart(keyInfo.id))

  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, keyInfo.id)
  wallet.sortIndex = keyInfo.sortIndex
  // Turn the wallet off
  WALLET_API.archiveWalletRequest(wallet)
  .then(() => {
    wallet.archived = true
    wallet.deleted = false
    // If changes were made during the wallet activation process,
    // start over
    const keyInfo = getState().core.account.allKeys.find(keyInfo => {
      return keyInfo.id === wallet.id
    })
    if (!isInSync(wallet, keyInfo)) {
      dispatch(WALLET_ACTIONS.removePendingStatus(wallet.id))
      return processKeyInfo(keyInfo, dispatch, getState)
    }

    dispatch(WALLET_ACTIONS.updateWalletComplete(keyInfo.id))
    const wallets = getState().core.wallets.byId
    Object.keys(wallets).forEach(id => {
      dispatch(UI_ACTIONS.upsertWalletRequest(wallets[id]))
    })
  })
}

const deleteWallet = (keyInfo, dispatch, getState) => {
  // Remove the wallet from Redux Core
  // Remove the wallet from Redux UI
  dispatch(deleteWallet(keyInfo.id))
  const state = getState()
  const wallets = state.core.wallets.byId
  Object.keys(wallets).forEach(id => {
    dispatch(UI_ACTIONS.upsertWalletRequest(wallets[id]))
  })
}

const isPending = (keyInfo, getState) => {
  const state = getState()
  const { pendingWalletIds } = state.core.wallets
  const isPending = pendingWalletIds.includes(keyInfo.id)

  return isPending
}
const shouldActivate = (keyInfo, getState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, keyInfo.id)
  const isNew = (!wallet)
  const outOfSync = !isNew && (!keyInfo.archived && wallet.archived)
  const shouldActivate = (isNew || outOfSync)

  return shouldActivate
}
const shouldArchive = (keyInfo, getState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, keyInfo.id)
  const outOfSync = ((keyInfo.archived || keyInfo.deleted) && !wallet.archived)
  const shouldArchive = outOfSync

  return shouldArchive
}
const shouldDelete = (keyInfo, getState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, keyInfo.id)
  const shouldDelete = (keyInfo.deleted && wallet)

  return shouldDelete
}

const isInSync = (wallet, keyInfo) => {
  const isInSync = (
    wallet.archived === !!keyInfo.archived &&
    wallet.deleted === !!keyInfo.deleted
  )

  return isInSync
}

const loadSettings = () => {
  return (dispatch, getState) => {
    const { account } = getState().core
    SETTINGS_API.getSyncedSettings(account)
    .then(settings => {

      console.warn('Duplicated in Settings/reducer.js')
      const syncDefaults = {
        autoLogoutTimeInSeconds: 3600,
        defaultFiat: 'USD',
        merchantMode: false,
        'BTC': {
          denomination: 1
        },
        'ETH': {
          denomination: 1
        },
        'TRD': {
          denomination: 1
        }
      }

      const syncFinal = Object.assign({}, syncDefaults, settings)

      // Add all the  settings to UI/Settings
      dispatch(SETTINGS_ACTIONS.setAutoLogoutTime(syncFinal.autoLogoutTimeInSeconds))
      dispatch(SETTINGS_ACTIONS.setDefaultFiat(syncFinal.defaultFiat))
      dispatch(SETTINGS_ACTIONS.setMerchantMode(syncFinal.merchantMode))
      dispatch(SETTINGS_ACTIONS.setBitcoinDenomination(syncFinal.BTC.denomination))
      dispatch(SETTINGS_ACTIONS.setEthereumDenomination(syncFinal.ETH.denomination))
    })

    SETTINGS_API.getLocalSettings(account)
    .then(settings => {
      const localDefaults = {
        bluetoothMode: true
      }

      const localFinal = Object.assign({}, localDefaults, settings)
      // Add all the local settings to UI/Settings
      dispatch(SETTINGS_ACTIONS.setBluetoothMode(localFinal.bluetoothMode))
    })

    SETTINGS_API.getCoreSettings(account)
    .then(settings => {
      const coreDefaults = {
        pinMode: false,
        otpMode: false
      }

      const coreFinal = Object.assign({}, coreDefaults, settings)
      dispatch(SETTINGS_ACTIONS.setPINMode(coreFinal.pinMode))
      dispatch(SETTINGS_ACTIONS.setOTPMode(coreFinal.otpMode))
    })
  }
}
