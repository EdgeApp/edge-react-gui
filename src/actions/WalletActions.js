// @flow

import { createSimpleConfirmModal } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import _ from 'lodash'
import React from 'react'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { launchModal } from '../components/common/ModalProvider.js'
import { showError } from '../components/services/AirshipInstance.js'
import * as Constants from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as SETTINGS_API from '../modules/Core/Account/settings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import { updateWalletsRequest } from '../modules/Core/Wallets/action.js'
import { getEnabledTokensFromFile, setEnabledTokens, updateEnabledTokens } from '../modules/Core/Wallets/EnabledTokens.js'
import { updateExchangeRates } from '../modules/ExchangeRates/action.js'
import * as SETTINGS_SELECTORS from '../modules/Settings/selectors'
import { updateMostRecentWallets, updateSettings } from '../modules/Settings/SettingsActions'
import type { ExchangedFlipInputAmounts } from '../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { Icon } from '../modules/UI/components/Icon/Icon.ui.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import type { CustomTokenInfo } from '../types/types.js'
import * as UTILS from '../util/utils'
import { addTokenAsync } from './AddTokenActions.js'

export const refreshReceiveAddressRequest = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const currentWalletId = state.ui.wallets.selectedWalletId

  if (walletId === currentWalletId) {
    const wallet = state.core.wallets.byId[walletId]
    wallet.getReceiveAddress().then(receiveAddress => {
      dispatch({
        type: 'UI/WALLETS/REFRESH_RECEIVE_ADDRESS',
        data: { walletId, receiveAddress }
      })
    })
  }
}

export const selectWallet = (walletId: string, currencyCode: string, from?: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(updateMostRecentWalletsSelected(walletId, currencyCode))
  if (currencyCode === 'EOS') {
    // EOS needs different path in case not activated yet
    dispatch(selectEOSWallet(walletId, currencyCode, from))
    return
  }
  const state = getState()
  const currentWalletId = state.ui.wallets.selectedWalletId
  const currentWalletCurrencyCode = state.ui.wallets.selectedCurrencyCode
  if (walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode) {
    dispatch({
      type: 'UI/WALLETS/SELECT_WALLET',
      data: { walletId, currencyCode }
    })
    const wallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)
    wallet
      .getReceiveAddress({ currencyCode })
      .then(receiveAddress => {
        dispatch({ type: 'NEW_RECEIVE_ADDRESS', data: { receiveAddress } })
      })
      .catch(showError)
  }
}

// check if the EOS wallet is activated (via public address blank string check) and route to activation scene(s)
export const selectEOSWallet = (walletId: string, currencyCode: string, from?: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const currentWalletId = state.ui.wallets.selectedWalletId
  const currentWalletCurrencyCode = state.ui.wallets.selectedCurrencyCode
  const guiWallet = UI_SELECTORS.getWallet(state, walletId)
  if (walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode || from === Constants.WALLET_LIST_SCENE) {
    const { publicAddress } = guiWallet.receiveAddress
    if (!publicAddress) {
      // Update all wallets' addresses. Hopefully gets the updated address for the next time
      // We enter the EOS wallet
      dispatch(updateWalletsRequest())
    }

    if (publicAddress) {
      // already activated
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { walletId, currencyCode }
      })
    } else {
      // not activated yet
      // find fiat and crypto (EOS) types and populate scene props
      const supportedFiats = UTILS.getSupportedFiats()
      const fiatTypeIndex = supportedFiats.findIndex(fiatType => fiatType.value === guiWallet.fiatCurrencyCode)
      const selectedFiat = supportedFiats[fiatTypeIndex]
      const supportedWalletTypes = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
      const selectedWalletType = supportedWalletTypes.find(type => {
        return type.currencyCode === 'EOS'
      })
      const createWalletAccountSetupSceneProps = {
        accountHandle: guiWallet.name,
        selectedWalletType,
        selectedFiat,
        isReactivation: true,
        existingWalletId: walletId
      }
      Actions[Constants.CREATE_WALLET_ACCOUNT_SETUP](createWalletAccountSetupSceneProps)
      const modal = createSimpleConfirmModal({
        title: s.strings.create_wallet_account_unfinished_activation_title,
        message: sprintf(s.strings.create_wallet_account_unfinished_activation_message, 'EOS'),
        icon: <Icon type={Constants.MATERIAL_COMMUNITY} name={Constants.EXCLAMATION} size={30} />,
        buttonText: s.strings.string_ok
      })
      launchModal(modal)
    }
  }
}

export const selectWalletFromModal = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(selectWallet(walletId, currencyCode))
  dispatch(refreshReceiveAddressRequest(walletId))
}

function dispatchUpsertWallets (dispatch, wallets: Array<EdgeCurrencyWallet>) {
  global.pcount('dispatchUpsertWallets')
  dispatch(upsertWallets(wallets))
}

const refreshDetails = {
  lastUpsert: 0,
  delayUpsert: false,
  walletIds: {}
}

const upsertFrequency = 3000

export const refreshWallet = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  if (wallet) {
    if (!refreshDetails.delayUpsert) {
      const now = Date.now()
      if (now - refreshDetails.lastUpsert > upsertFrequency) {
        dispatchUpsertWallets(dispatch, [wallet])
        refreshDetails.lastUpsert = Date.now()
      } else {
        console.log('refreshWallets setTimeout delay upsert id:' + walletId)
        refreshDetails.delayUpsert = true
        refreshDetails.walletIds[walletId] = wallet
        setTimeout(() => {
          const wallets = []
          for (const wid in refreshDetails.walletIds) {
            wallets.push(refreshDetails.walletIds[wid])
          }
          dispatchUpsertWallets(dispatch, wallets)
          refreshDetails.delayUpsert = false
          refreshDetails.lastUpsert = Date.now()
          refreshDetails.walletIds = {}
        }, upsertFrequency)
      }
    } else {
      // Add wallet to the queue to upsert
      refreshDetails.walletIds[walletId] = wallet
      console.log('refreshWallets delayUpsert id:' + walletId)
    }
  } else {
    console.log('refreshWallets no wallet. id:' + walletId)
  }
}

export const upsertWallets = (wallets: Array<EdgeCurrencyWallet>) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(updateExchangeRates())
  dispatch({
    type: 'UI/WALLETS/UPSERT_WALLETS',
    data: {
      wallets
    }
  })
}

export const setWalletEnabledTokens = (walletId: string, enabledTokens: Array<string>, disabledTokens: Array<string>) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  // tell Redux that we are updating the enabledTokens list
  dispatch({ type: 'MANAGE_TOKENS_START' })
  // get a snapshot of the state
  const state = getState()
  // get a copy of the relevant core wallet
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  // now actually tell the wallet to enable the token(s) in the core and save to file
  return setEnabledTokens(wallet, enabledTokens, disabledTokens).then(() => {
    // let Redux know it was completed successfully
    dispatch({ type: 'MANAGE_TOKENS_SUCCESS' })
    dispatch({
      type: 'UPDATE_WALLET_ENABLED_TOKENS',
      data: { walletId, tokens: enabledTokens }
    })
    // refresh the wallet in Redux
    dispatch(refreshWallet(walletId))
  })
}

export const getEnabledTokens = (walletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  // get a snapshot of the state
  const state = getState()
  // get the AbcWallet
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  if (!wallet) return
  const guiWallet = UI_SELECTORS.getWallet(state, walletId)

  // get token information from settings
  const customTokens: Array<CustomTokenInfo> = SETTINGS_SELECTORS.getCustomTokens(state)
  try {
    const enabledTokens = await getEnabledTokensFromFile(wallet)
    const promiseArray = []
    const tokensToEnable = []

    // Add any enabledTokens that are custom tokens or in the currencyInfo
    for (const et of enabledTokens) {
      let found = guiWallet.metaTokens.find(element => {
        return element.currencyCode === et
      })
      if (found) {
        tokensToEnable.push(et)
        continue
      }

      found = customTokens.find(element => {
        return element.currencyCode === et
      })
      if (found) {
        tokensToEnable.push(et)
        promiseArray.push(wallet.addCustomToken(found))
      }
    }
    await Promise.all(promiseArray)
    // now reflect that change in Redux's version of the wallet
    if (tokensToEnable.length) {
      dispatch({
        type: 'UPDATE_WALLET_ENABLED_TOKENS',
        data: { walletId, tokens: tokensToEnable }
      })
      dispatch(refreshWallet(walletId))
    }
  } catch (error) {
    showError(error)
  }
}

export const assembleCustomToken = (currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) => {
  // create modified object structure to match metaTokens
  const newTokenObj: CustomTokenInfo = {
    currencyName,
    currencyCode,
    contractAddress,
    denomination,
    multiplier: denomination,
    denominations: [
      {
        name: currencyCode,
        multiplier: denomination,
        symbol: ''
      }
    ],
    isVisible: true,
    walletType
  }

  return newTokenObj
}

export const editCustomToken = (
  walletId: string,
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  denomination: string,
  oldCurrencyCode: string
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: 'EDIT_CUSTOM_TOKEN_START' })
    const state = getState()
    const settings = SETTINGS_SELECTORS.getSettings(state)
    const customTokens = settings.customTokens
    const guiWallet = UI_SELECTORS.getWallet(state, walletId)
    const allTokens = UTILS.mergeTokens(guiWallet.metaTokens, customTokens)
    const indexInAllTokens = _.findIndex(allTokens, token => token.currencyCode === currencyCode)
    const tokenObj = assembleCustomToken(currencyName, currencyCode, contractAddress, denomination, guiWallet.type)
    if (indexInAllTokens >= 0) {
      // currently exists in some form
      if (currencyCode === oldCurrencyCode) {
        // just updating same token, CASE 1
        addTokenAsync(walletId, currencyName, currencyCode, contractAddress, denomination, state)
          .then(() => {
            dispatch({
              type: 'UPDATE_EXISTING_TOKEN_SUCCESS',
              data: { tokenObj }
            })
            Actions.pop()
          })
          .catch(error => {
            showError(error)
            dispatch({ type: 'EDIT_CUSTOM_TOKEN_FAILURE' })
          })
      } else {
        // replacing an existing but invisible token CASE 3
        addTokenAsync(walletId, currencyName, currencyCode, contractAddress, denomination, state) // update the receiving token
          .then(() => {
            deleteCustomTokenAsync(walletId, oldCurrencyCode, getState) // delete the sending token
              .then(coreWalletsToUpdate => {
                dispatch({
                  type: 'OVERWRITE_THEN_DELETE_TOKEN_SUCCESS',
                  data: { tokenObj, oldCurrencyCode, coreWalletsToUpdate }
                })
                Actions.pop()
              })
          })
          .catch(error => {
            showError(error)
            dispatch({ type: 'EDIT_CUSTOM_TOKEN_FAILURE' })
          })
      }
    } else {
      // does not yet exist. Create the new one then delete the old one, CASE 4
      addTokenAsync(walletId, currencyName, currencyCode, contractAddress, denomination, state)
        .then(addedTokenData => {
          deleteCustomTokenAsync(walletId, oldCurrencyCode, getState).then(coreWalletsToUpdate => {
            tokenObj.isVisible = true
            dispatch({
              type: 'ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS',
              data: {
                walletId,
                code: tokenObj.currencyCode,
                coreWalletsToUpdate,
                enabledTokensOnWallet: addedTokenData.enabledTokensOnWallet,
                oldCurrencyCode,
                setSettings: addedTokenData.setSettings,
                tokenObj: addedTokenData.newTokenObj
              }
            })
            Actions.pop()
          })
        })
        .catch(error => {
          showError(error)
          dispatch({ type: 'EDIT_CUSTOM_TOKEN_FAILURE' })
        })
    }
  }
}

export async function deleteCustomTokenAsync (walletId: string, currencyCode: string, getState: GetState) {
  const state = getState()
  const coreWallets = CORE_SELECTORS.getWallets(state)
  const guiWallets = state.ui.wallets.byId
  const account = CORE_SELECTORS.getAccount(state)
  const coreWalletsToUpdate = []
  const receivedSyncSettings = await SETTINGS_API.getSyncedSettings(account)
  receivedSyncSettings[currencyCode].isVisible = false
  const syncedCustomTokens: Array<CustomTokenInfo> = [...receivedSyncSettings.customTokens]
  const indexOfSyncedToken: number = _.findIndex(syncedCustomTokens, item => item.currencyCode === currencyCode)
  syncedCustomTokens[indexOfSyncedToken].isVisible = false
  receivedSyncSettings.customTokens = syncedCustomTokens
  await SETTINGS_API.setSyncedSettingsAsync(account, receivedSyncSettings)
  const walletPromises = Object.values(guiWallets).map(wallet => {
    // Flow is having issues here, need to fix
    // $FlowFixMe
    const temporaryWalletId = wallet.id
    const theCoreWallet = coreWallets[temporaryWalletId]
    // $FlowFixMe
    if (wallet.enabledTokens && wallet.enabledTokens.length > 0) {
      // if the wallet has some enabled tokens
      coreWalletsToUpdate.push(theCoreWallet)
      return updateEnabledTokens(theCoreWallet, [], [currencyCode])
    }
    return Promise.resolve()
  })
  await Promise.all(walletPromises)
  return coreWalletsToUpdate
}

export const deleteCustomToken = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const coreWallets = CORE_SELECTORS.getWallets(state)
  const guiWallets = state.ui.wallets.byId
  const account = CORE_SELECTORS.getAccount(state)
  const localSettings = {
    ...SETTINGS_SELECTORS.getSettings(state)
  }
  const coreWalletsToUpdate = []
  dispatch({ type: 'DELETE_CUSTOM_TOKEN_START' })
  SETTINGS_API.getSyncedSettings(account)
    .then(settings => {
      if (settings[currencyCode]) settings[currencyCode].isVisible = false // remove top-level property. We should migrate away from it eventually anyway
      if (localSettings[currencyCode]) localSettings[currencyCode].isVisible = false
      const customTokensOnFile = [...settings.customTokens] // should use '|| []' as catch-all or no?
      const customTokensOnLocal = [...localSettings.customTokens]
      const indexOfToken = _.findIndex(customTokensOnFile, item => item.currencyCode === currencyCode)
      const indexOfTokenOnLocal = _.findIndex(customTokensOnLocal, item => item.currencyCode === currencyCode)
      customTokensOnFile[indexOfToken].isVisible = false
      customTokensOnLocal[indexOfTokenOnLocal].isVisible = false
      settings.customTokens = customTokensOnFile
      localSettings.customTokens = customTokensOnLocal
      return settings
    })
    .then(adjustedSettings => {
      return SETTINGS_API.setSyncedSettings(account, adjustedSettings)
    })
    .then(() => {
      const walletPromises = Object.values(guiWallets).map(wallet => {
        // Flow is having issues here, need to fix
        // $FlowFixMe
        const temporaryWalletId = wallet.id
        const theCoreWallet = coreWallets[temporaryWalletId]
        // $FlowFixMe
        if (wallet.enabledTokens && wallet.enabledTokens.length > 0) {
          coreWalletsToUpdate.push(theCoreWallet)
          return updateEnabledTokens(theCoreWallet, [], [currencyCode])
        }
        return Promise.resolve()
      })
      return Promise.all(walletPromises)
    })
    .then(() => {
      coreWalletsToUpdate.forEach(wallet => {
        dispatch(upsertWallets([wallet]))
        const newEnabledTokens = _.difference(guiWallets[wallet.id].enabledTokens, [currencyCode])
        dispatch({
          type: 'UPDATE_WALLET_ENABLED_TOKENS',
          data: { walletId: wallet.id, tokens: newEnabledTokens }
        })
      })
    })
    .then(() => {
      dispatch(updateSettings(localSettings))
      dispatch({
        type: 'DELETE_CUSTOM_TOKEN_SUCCESS',
        data: { currencyCode }
      }) // need to remove modal and update settings
      Actions.pop()
    })
    .catch(error => {
      showError(error)
      dispatch({ type: 'DELETE_CUSTOM_TOKEN_FAILURE' })
    })
}

export const updateWalletLoadingProgress = (walletId: string, newWalletProgress: number) => (dispatch: Dispatch, getState: GetState) => {
  const data = {
    walletId,
    addressLoadingProgress: newWalletProgress
  }
  const state = getState()
  const currentWalletProgress = state.ui.wallets.walletLoadingProgress[walletId]
  const marginalProgress = newWalletProgress - currentWalletProgress

  if (newWalletProgress !== 1 && marginalProgress < 0.1) return

  dispatch({
    type: 'UPDATE_WALLET_LOADING_PROGRESS',
    data
  })
}

export const updateMostRecentWalletsSelected = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { mostRecentWallets } = state.ui.settings
  const currentMostRecentWallets = mostRecentWallets.filter(wallet => {
    return wallet.id !== walletId || wallet.currencyCode !== currencyCode
  })
  if (currentMostRecentWallets.length === 100) {
    currentMostRecentWallets.pop()
  }
  currentMostRecentWallets.unshift({ id: walletId, currencyCode })

  SETTINGS_API.setMostRecentWalletsSelected(CORE_SELECTORS.getAccount(state), currentMostRecentWallets)
    .then(() => {
      dispatch(updateMostRecentWallets(currentMostRecentWallets))
    })
    .catch(showError)
}

export const removeMostRecentWallet = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { mostRecentWallets } = state.ui.settings
  const currentMostRecentWallets = mostRecentWallets.filter(wallet => wallet.id !== walletId || wallet.currencyCode !== currencyCode)
  SETTINGS_API.setMostRecentWalletsSelected(CORE_SELECTORS.getAccount(state), currentMostRecentWallets)
    .then(() => {
      dispatch(updateMostRecentWallets(currentMostRecentWallets))
    })
    .catch(showError)
}

export const checkEnabledTokensArray = (walletId: string, newEnabledTokens: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = UI_SELECTORS.getWallet(state, walletId)
  const oldEnabledTokens = wallet.enabledTokens

  oldEnabledTokens.forEach(oldToken => {
    const checkedToken = newEnabledTokens.find(newToken => newToken === oldToken)
    if (!checkedToken) {
      dispatch(removeMostRecentWallet(walletId, oldToken))
    }
  })
}

export const requestChangeAmounts = (amounts: ExchangedFlipInputAmounts) => ({
  type: 'FIO/FIO_REQUEST_CHANGE_AMOUNTS',
  data: { amounts }
})

export const requestSaveFioModalData = (fioModalData: any) => ({
  type: 'FIO/FIO_REQUEST_SAVE_MODAL_DATA',
  data: { fioModalData }
})
