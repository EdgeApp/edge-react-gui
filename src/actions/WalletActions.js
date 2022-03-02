// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { CREATE_WALLET_ACCOUNT_SELECT, CREATE_WALLET_ACCOUNT_SETUP } from '../constants/SceneKeys.js'
import { getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { getSyncedSettings, setMostRecentWalletsSelected, setSyncedSettings } from '../modules/Core/Account/settings.js'
import { getEnabledTokensFromFile, setEnabledTokens, updateEnabledTokens } from '../modules/Core/Wallets/EnabledTokens.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { type CustomTokenInfo } from '../types/types.js'
import { getCurrencyInfos, makeCreateWalletType } from '../util/CurrencyInfoHelpers.js'
import { getReceiveAddresses, getSupportedFiats, logPrefix, mergeTokens } from '../util/utils.js'
import { addTokenAsync } from './AddTokenActions.js'
import { updateExchangeRates } from './ExchangeRateActions.js'
import { refreshConnectedWallets } from './FioActions.js'
import { registerNotifications } from './NotificationActions.js'

export const refreshReceiveAddressRequest = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyWallets } = state.core.account
  const currentWalletId = state.ui.wallets.selectedWalletId

  if (walletId === currentWalletId) {
    const wallet = currencyWallets[walletId]
    wallet.getReceiveAddress().then(receiveAddress => {
      dispatch({
        type: 'UI/WALLETS/REFRESH_RECEIVE_ADDRESS',
        data: { walletId, receiveAddress }
      })
    })
  }
}

export const selectWallet = (walletId: string, currencyCode: string, alwaysActivate?: boolean) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyWallets } = state.core.account

  // Manually un-pause the wallet, if necessary:
  const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
  if (wallet.paused) wallet.changePaused(false).catch(showError)

  dispatch(updateMostRecentWalletsSelected(walletId, currencyCode))
  const { isAccountActivationRequired } = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId)
  if (isAccountActivationRequired) {
    // EOS needs different path in case not activated yet
    const currentWalletId = state.ui.wallets.selectedWalletId
    const currentWalletCurrencyCode = state.ui.wallets.selectedCurrencyCode
    if (alwaysActivate || walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode) {
      dispatch(selectEOSWallet(walletId, currencyCode))
    }
    return
  }
  const currentWalletId = state.ui.wallets.selectedWalletId
  const currentWalletCurrencyCode = state.ui.wallets.selectedCurrencyCode
  if (walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode) {
    dispatch({
      type: 'UI/WALLETS/SELECT_WALLET',
      data: { walletId, currencyCode }
    })
    const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
    wallet
      .getReceiveAddress({ currencyCode })
      .then(receiveAddress => {
        dispatch({ type: 'NEW_RECEIVE_ADDRESS', data: { receiveAddress } })
      })
      .catch(showError)
  }
}

// check if the EOS wallet is activated (via public address blank string check) and route to activation scene(s)
const selectEOSWallet = (walletId: string, currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = state.core.account.currencyWallets[walletId]
  const {
    fiatCurrencyCode,
    name,
    currencyInfo: { currencyCode, pluginId }
  } = wallet
  const walletName = name ?? ''
  const { publicAddress } = await wallet.getReceiveAddress()

  if (publicAddress !== '') {
    // already activated
    dispatch({
      type: 'UI/WALLETS/SELECT_WALLET',
      data: { walletId, currencyCode }
    })
  } else {
    // Update all wallets' addresses. Hopefully gets the updated address for the next time
    // We enter the EOSIO wallet
    dispatch(updateWalletsRequest())
    // not activated yet
    // find fiat and crypto (EOSIO) types and populate scene props
    const supportedFiats = getSupportedFiats()
    const fiatTypeIndex = supportedFiats.findIndex(fiatType => fiatType.value === fiatCurrencyCode.replace('iso:', ''))
    const selectedFiat = supportedFiats[fiatTypeIndex]
    const currencyInfos = getCurrencyInfos(state.core.account)
    const currencyInfo = currencyInfos.find(info => info.currencyCode === currencyCode)
    if (!currencyInfo) throw new Error('CannotFindCurrencyInfo')
    const selectedWalletType = makeCreateWalletType(currencyInfo)
    const specialCurrencyInfo = getSpecialCurrencyInfo(pluginId)
    if (specialCurrencyInfo.skipAccountNameValidation) {
      Actions.push(CREATE_WALLET_ACCOUNT_SELECT, {
        selectedFiat: selectedFiat,
        selectedWalletType,
        accountName: walletName,
        existingWalletId: walletId
      })
    } else {
      const createWalletAccountSetupSceneProps = {
        accountHandle: '',
        selectedWalletType,
        selectedFiat,
        isReactivation: true,
        existingWalletId: walletId
      }
      Actions.push(CREATE_WALLET_ACCOUNT_SETUP, createWalletAccountSetupSceneProps)
    }

    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.create_wallet_account_unfinished_activation_title}
        message={sprintf(s.strings.create_wallet_account_unfinished_activation_message, currencyCode)}
        buttons={{ ok: { label: s.strings.string_ok } }}
      />
    ))
  }
}

export const selectWalletFromModal = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(selectWallet(walletId, currencyCode))
  dispatch(refreshReceiveAddressRequest(walletId))
}

function dispatchUpsertWallets(dispatch, wallets: EdgeCurrencyWallet[]) {
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
  const { currencyWallets } = state.core.account
  const wallet = currencyWallets[walletId]
  if (wallet) {
    const prefix = logPrefix(wallet)

    if (!refreshDetails.delayUpsert) {
      const now = Date.now()
      if (now - refreshDetails.lastUpsert > upsertFrequency) {
        dispatchUpsertWallets(dispatch, [wallet])
        refreshDetails.lastUpsert = Date.now()
      } else {
        console.log(`${prefix}: refreshWallets setTimeout delay upsert`)
        refreshDetails.delayUpsert = true
        refreshDetails.walletIds[walletId] = wallet
        setTimeout(() => {
          const wallets = []
          for (const wid of Object.keys(refreshDetails.walletIds)) {
            const w = refreshDetails.walletIds[wid]
            console.log(`${logPrefix(w)}: refreshWallets upserting now`)
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
      console.log(`${prefix}: refreshWallets delayUpsert`)
    }
  } else {
    console.log(`${walletId.slice(0, 2)} refreshWallets no wallet`)
  }
}

export const upsertWallets = (wallets: EdgeCurrencyWallet[]) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(updateExchangeRates())
  dispatch({
    type: 'UI/WALLETS/UPSERT_WALLETS',
    data: {
      wallets
    }
  })
}

export const setWalletEnabledTokens = (walletId: string, enabledTokens: string[], disabledTokens: string[]) => (dispatch: Dispatch, getState: GetState) => {
  // tell Redux that we are updating the enabledTokens list
  dispatch({ type: 'MANAGE_TOKENS_START' })
  // get a snapshot of the state
  const state = getState()
  const { currencyWallets } = state.core.account
  // get a copy of the relevant core wallet
  const wallet = currencyWallets[walletId]
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
  const { currencyWallets } = state.core.account

  // get the AbcWallet
  const wallet = currencyWallets[walletId]
  if (!wallet) return
  const guiWallet = state.ui.wallets.byId[walletId]

  // get token information from settings
  const { customTokens } = state.ui.settings
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
    const { customTokens } = state.ui.settings
    const guiWallet = state.ui.wallets.byId[walletId]
    const allTokens = mergeTokens(guiWallet.metaTokens, customTokens)
    const indexInAllTokens = allTokens.findIndex(token => token.currencyCode === currencyCode)
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

export async function deleteCustomTokenAsync(walletId: string, currencyCode: string, getState: GetState) {
  const state = getState()
  const { account } = state.core
  const { currencyWallets } = account
  const guiWallets = state.ui.wallets.byId
  const coreWalletsToUpdate = []
  const receivedSyncSettings = await getSyncedSettings(account)
  receivedSyncSettings[currencyCode].isVisible = false
  const syncedCustomTokens: CustomTokenInfo[] = [...receivedSyncSettings.customTokens]
  const indexOfSyncedToken: number = syncedCustomTokens.findIndex(item => item.currencyCode === currencyCode)
  syncedCustomTokens[indexOfSyncedToken].isVisible = false
  receivedSyncSettings.customTokens = syncedCustomTokens
  await setSyncedSettings(account, receivedSyncSettings)
  const walletPromises = Object.values(guiWallets).map(wallet => {
    // Flow is having issues here, need to fix
    // $FlowFixMe
    const temporaryWalletId = wallet.id
    const theCoreWallet = currencyWallets[temporaryWalletId]
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
  const { account } = state.core
  const { currencyWallets } = account
  const guiWallets = state.ui.wallets.byId
  const localSettings = {
    ...state.ui.settings
  }
  const coreWalletsToUpdate = []
  getSyncedSettings(account)
    .then(settings => {
      if (settings[currencyCode]) settings[currencyCode].isVisible = false // remove top-level property. We should migrate away from it eventually anyway
      if (localSettings[currencyCode]) localSettings[currencyCode].isVisible = false
      const customTokensOnFile = [...settings.customTokens] // should use '|| []' as catch-all or no?
      const customTokensOnLocal = [...localSettings.customTokens]
      const indexOfToken = customTokensOnFile.findIndex(item => item.currencyCode === currencyCode)
      const indexOfTokenOnLocal = customTokensOnLocal.findIndex(item => item.currencyCode === currencyCode)
      customTokensOnFile[indexOfToken].isVisible = false
      customTokensOnLocal[indexOfTokenOnLocal].isVisible = false
      settings.customTokens = customTokensOnFile
      localSettings.customTokens = customTokensOnLocal
      return settings
    })
    .then(adjustedSettings => {
      return setSyncedSettings(account, adjustedSettings)
    })
    .then(() => {
      const walletPromises = Object.values(guiWallets).map(wallet => {
        // Flow is having issues here, need to fix
        // $FlowFixMe
        const temporaryWalletId = wallet.id
        const theCoreWallet = currencyWallets[temporaryWalletId]
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
        dispatch({
          type: 'UPDATE_WALLET_ENABLED_TOKENS',
          data: {
            walletId: wallet.id,
            tokens: guiWallets[wallet.id].enabledTokens.filter(token => token !== currencyCode)
          }
        })
      })
    })
    .then(() => {
      dispatch({
        type: 'UI/SETTINGS/UPDATE_SETTINGS',
        data: { settings: localSettings }
      })
      dispatch({
        type: 'DELETE_CUSTOM_TOKEN_SUCCESS',
        data: { currencyCode }
      }) // need to remove modal and update settings
      Actions.pop()
    })
    .catch(error => {
      showError(error)
    })
}

export const updateWalletLoadingProgress = (walletId: string, newWalletProgress: number) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const currentWalletProgress = state.ui.wallets.walletLoadingProgress[walletId]
  const marginalProgress = newWalletProgress - currentWalletProgress
  if (newWalletProgress !== 1 && marginalProgress < 0.1) return

  dispatch({
    type: 'UPDATE_WALLET_LOADING_PROGRESS',
    data: { walletId, addressLoadingProgress: newWalletProgress }
  })
}

export const updateMostRecentWalletsSelected = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { mostRecentWallets } = state.ui.settings
  const currentMostRecentWallets = mostRecentWallets.filter(wallet => {
    return wallet.id !== walletId || wallet.currencyCode !== currencyCode
  })
  if (currentMostRecentWallets.length === 100) {
    currentMostRecentWallets.pop()
  }
  currentMostRecentWallets.unshift({ id: walletId, currencyCode })

  setMostRecentWalletsSelected(account, currentMostRecentWallets)
    .then(() => {
      dispatch({
        type: 'UI/SETTINGS/SET_MOST_RECENT_WALLETS',
        data: { mostRecentWallets: currentMostRecentWallets }
      })
    })
    .catch(showError)
}

export const removeMostRecentWallet = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { mostRecentWallets } = state.ui.settings
  const currentMostRecentWallets = mostRecentWallets.filter(wallet => wallet.id !== walletId || wallet.currencyCode !== currencyCode)
  setMostRecentWalletsSelected(account, currentMostRecentWallets)
    .then(() => {
      dispatch({
        type: 'UI/SETTINGS/SET_MOST_RECENT_WALLETS',
        data: { mostRecentWallets: currentMostRecentWallets }
      })
    })
    .catch(showError)
}

export const checkEnabledTokensArray = (walletId: string, newEnabledTokens: string[]) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = state.ui.wallets.byId[walletId]
  const oldEnabledTokens = wallet.enabledTokens

  oldEnabledTokens.forEach(oldToken => {
    const checkedToken = newEnabledTokens.find(newToken => newToken === oldToken)
    if (!checkedToken) {
      dispatch(removeMostRecentWallet(walletId, oldToken))
    }
  })
}

export const updateWalletsRequest = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { activeWalletIds, archivedWalletIds, currencyWallets } = account

  if (activeWalletIds.length === Object.keys(currencyWallets).length) {
    dispatch(registerNotifications())
  }

  const incomingWalletIds = activeWalletIds.filter(id => state.ui.wallets.byId[id] == null)
  const receiveAddresses = await getReceiveAddresses(currencyWallets)

  dispatch({
    type: 'CORE/WALLETS/UPDATE_WALLETS',
    data: {
      activeWalletIds,
      archivedWalletIds,
      currencyWallets,
      receiveAddresses
    }
  })
  const newState = getState()
  for (const walletId of incomingWalletIds) {
    if (newState.ui.wallets.byId[walletId] == null) continue
    await getEnabledTokens(walletId)(dispatch, getState)
  }
  refreshConnectedWallets(dispatch, getState, currencyWallets)
  updateWalletsEnabledTokens(getState)
}

export const updateWalletsEnabledTokens = (getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { currencyWallets } = account
  for (const walletId: string of Object.keys(currencyWallets)) {
    const edgeWallet: EdgeCurrencyWallet = currencyWallets[walletId]
    if (edgeWallet.type === 'wallet:ethereum' || edgeWallet.type === 'wallet:rsk' || edgeWallet.type === 'wallet:fantom') {
      if (state.ui.wallets && state.ui.wallets.byId && state.ui.wallets.byId[walletId]) {
        const enabledTokens = state.ui.wallets.byId[walletId].enabledTokens
        const customTokens = state.ui.settings.customTokens
        const enabledNotHiddenTokens = enabledTokens.filter(token => {
          let isVisible = true // assume we will enable token
          const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
          // if token is not supposed to be visible, not point in enabling it
          if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
          return isVisible
        })
        edgeWallet.changeEnabledTokens(enabledNotHiddenTokens)
      }
    }
  }
}
