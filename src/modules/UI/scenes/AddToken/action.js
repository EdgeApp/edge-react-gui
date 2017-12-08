export const ADD_TOKEN = 'ADD_TOKEN'
export const ADD_TOKEN_START = 'ADD_TOKEN_START'
export const ADD_TOKEN_SUCCESS = 'ADD_TOKEN_SUCCESS'
export const SET_TOKEN_SETTINGS = 'SET_TOKEN_SETTINGS'

import {Actions} from 'react-native-router-flux'
import * as UTILS from '../../../utils.js'

import * as SETTINGS_ACTIONS from '../Settings/action.js'
import {setCustomTokens} from '../../Settings/action.js'
import * as SETTINGS_API from '../../../Core/Account/settings.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_ACTIONS from '../../Wallets/action.js'
import * as UI_WALLET_SELECTORS from '../../selectors.js'

// adding a token should only be done on the account level, while enabling will occur on the wallet level
export const addToken = (walletId, tokenObj) => (dispatch, getState) => {
  const state = getState()
  let newTokenObj = {
    ...tokenObj,
    denominations: [{
      name: tokenObj.currencyCode,
      multiplier: tokenObj.multiplier
    }]
  }
  const account = CORE_SELECTORS.getAccount(state)
  const wallet = UI_WALLET_SELECTORS.getWallet(state, walletId)
  dispatch(addTokenStart(walletId))
  SETTINGS_API.getSyncedSettings(account)
  .then((settings) => {
    const customTokens = settings.customTokens
    let newCustomTokens = []
    if (!customTokens || customTokens.length === 0) { // if custom tokens doesn't exist or is empty
      newCustomTokens = [newTokenObj] // then make an array from the one custom token
    } else {
      newCustomTokens = UTILS.mergeTokens([tokenObj], customTokens) // otherwise merge metaTokens and customTokens
    }
    settings.customTokens = newCustomTokens
    settings[tokenObj.currencyCode] = newTokenObj
    SETTINGS_API.setSyncedSettings(account, settings)
    .then(() => {
      dispatch(SETTINGS_ACTIONS.setDenominationKeyRequest(tokenObj.currencyCode, tokenObj.multiplier))
      .then(() => {
        dispatch(setTokenSettings(newTokenObj))
        if (wallet.enabledTokens.indexOf(newTokenObj.currencyCode) === -1) { // if not currently enabled
          const newEnabledTokens = wallet.enabledTokens
          newEnabledTokens.push(newTokenObj.currencyCode)
          dispatch(UI_ACTIONS.setEnabledTokens(walletId, newEnabledTokens)) // then enable it
        }
        dispatch(setCustomTokens(settings.customTokens))
        dispatch(addTokenSuccess())
        dispatch(UI_ACTIONS.refreshWallet(walletId))
        dispatch(UI_ACTIONS.getEnabledTokens(walletId)) // refresh wallet enabled tokens
        Actions.walletList()
      })
      .catch((e) => {
        console.log(e)
      })
    })
    .catch((e) => console.log(e))
  })
  .catch((e) => console.log(e))
}

export const addTokenStart = () => ({
  type: ADD_TOKEN_START
})

export const addTokenSuccess = () => ({
  type: ADD_TOKEN_SUCCESS
})

export function setTokenSettings (tokenObj) {
  const data = tokenObj
  return {
    type: SET_TOKEN_SETTINGS,
    data
  }
}