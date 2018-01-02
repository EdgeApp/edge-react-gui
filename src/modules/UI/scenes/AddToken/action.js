export const ADD_TOKEN = 'ADD_TOKEN'
export const ADD_TOKEN_START = 'ADD_TOKEN_START'
export const ADD_TOKEN_SUCCESS = 'ADD_TOKEN_SUCCESS'
export const SET_TOKEN_SETTINGS = 'SET_TOKEN_SETTINGS'
export const ADD_NEW_CUSTOM_TOKEN_SUCCESS = 'ADD_NEW_CUSTOM_TOKEN_SUCCESS'
export const ADD_NEW_CUSTOM_TOKEN_FAILURE = 'ADD_NEW_CUSTOM_TOKEN_FAILURE'

import {Actions} from 'react-native-router-flux'
import * as UTILS from '../../../utils.js'
import * as SETTINGS_API from '../../../Core/Account/settings.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as WALLET_ACTIONS from '../../Wallets/action.js'
import * as UI_WALLET_SELECTORS from '../../selectors.js'
import * as CONSTANTS from '../../../../constants/indexConstants'

import {displayErrorAlert} from '../../components/ErrorAlert/actions'

export const addNewToken = (walletId, tokenObj) => {
  return (dispatch, getState) => {
    dispatch(addTokenStart(walletId))
    const state = getState()
    addTokenAsync(walletId, tokenObj, state)
    .then((addedWalletInfo) => {
      const {walletId, newTokenObj, setSettings, enabledTokensOnWallet} = addedWalletInfo
      dispatch(addNewTokenSuccess(walletId, newTokenObj, setSettings, enabledTokensOnWallet))
      dispatch(WALLET_ACTIONS.refreshWallet(walletId))
      Actions.popTo(CONSTANTS.WALLET_LIST_SCENE)
    })
    .catch((e) => {
      dispatch(addNewTokenFailure(e.message))
      dispatch(displayErrorAlert(e.message))
    })
  }
}

export async function addTokenAsync (walletId, tokenObj, state) {
  let setSettings
  // create modified object structure to match metaTokens
  let newTokenObj = {
    ...tokenObj,
    denomination: tokenObj.multiplier,
    denominations: [{
      name: tokenObj.currencyCode,
      multiplier: tokenObj.multiplier,
      symbol: ''
    }],
    isVisible: true
  }
  const account = CORE_SELECTORS.getAccount(state)
  const uiWallet = UI_WALLET_SELECTORS.getWallet(state, walletId)
  const coreWallet = CORE_SELECTORS.getWallet(state, walletId)
  await coreWallet.addCustomToken(newTokenObj)
  coreWallet.enableTokens([tokenObj.currencyCode])
  const settingsOnFile = await SETTINGS_API.getSyncedSettingsAsync(account)

  setSettings = settingsOnFile
  const customTokens = settingsOnFile.customTokens
  let newCustomTokens = []
  if (!customTokens || customTokens.length === 0) {
    newCustomTokens = [newTokenObj]
  } else {
    newCustomTokens = UTILS.mergeTokens([tokenObj], customTokens) // otherwise merge metaTokens and customTokens
  }
  settingsOnFile.customTokens = newCustomTokens
  settingsOnFile[tokenObj.currencyCode] = newTokenObj
  await SETTINGS_API.setSyncedSettingsAsync(account, settingsOnFile)
  let newEnabledTokens = uiWallet.enabledTokens
  if (uiWallet.enabledTokens.indexOf(newTokenObj.currencyCode) === -1) {
    newEnabledTokens.push(newTokenObj.currencyCode)
  }
  await WALLET_API.updateEnabledTokens(coreWallet, newEnabledTokens)
  return {walletId, newTokenObj, setSettings, newEnabledTokens}
}

export const addTokenStart = () => ({
  type: ADD_TOKEN_START
})

export const addTokenSuccess = () => ({
  type: ADD_TOKEN_SUCCESS
})

export function addNewTokenSuccess (walletId, tokenObj, settings, enabledTokens) {
  const data = {walletId, tokenObj, settings, enabledTokens, newCurrencyCode: tokenObj.currencyCode}
  return {
    type: ADD_NEW_CUSTOM_TOKEN_SUCCESS,
    data
  }
}

export function addNewTokenFailure (errorMessage) {
  const data = {errorMessage}
  return {
    type: ADD_NEW_CUSTOM_TOKEN_FAILURE,
    data
  }
}

export function setTokenSettings (tokenObj) {
  const data = tokenObj
  return {
    type: SET_TOKEN_SETTINGS,
    data
  }
}
