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
  // create modified object structure to match metaTokens
  let newTokenObj = {
    ...tokenObj,
    denomination: tokenObj.multiplier,
    denominations: [{
      name: tokenObj.currencyCode,
      multiplier: tokenObj.multiplier
    }]
  }
  // get the account so that we can save the customTokens in the settings
  const account = CORE_SELECTORS.getAccount(state)
  // get the wallet that we will be using
  const wallet = UI_WALLET_SELECTORS.getWallet(state, walletId)
  // tell the GUI to that we are attempting to add a new token
  dispatch(addTokenStart(walletId))
  // add the new custom token to the core so it can scan blockchain, etc
  dispatch(UI_ACTIONS.addCustomToken(walletId, tokenObj))
  // get the account synced settings so that we can also add the custom token info there
  SETTINGS_API.getSyncedSettings(account)
  .then((settings) => {
    // get ready to modify the customTokens property in the settings
    const customTokens = settings.customTokens
    // start with a fresh array
    let newCustomTokens = []
    // if custom tokens doesn't exist or is empty
    if (!customTokens || customTokens.length === 0) {
      // then make an array from the one custom token
      newCustomTokens = [newTokenObj]
    } else {
      // otherwise upsert with the existing custom token and set the fresh array to it
      newCustomTokens = UTILS.mergeTokens([tokenObj], customTokens) // otherwise merge metaTokens and customTokens
    }
    // now replace the customTokens property on the synced settings object
    settings.customTokens = newCustomTokens
    // and also set the top-level property in the settings (this will eventually need to be changed)
    settings[tokenObj.currencyCode] = newTokenObj
    // set the synced settings to reflect the changes
    SETTINGS_API.setSyncedSettings(account, settings)
    .then(() => {
      // if that is successful then set the default denomination for the new token
      dispatch(SETTINGS_ACTIONS.setDenominationKeyRequest(tokenObj.currencyCode, tokenObj.multiplier))
      .then(() => {
        // now actually update Redux with the new settings
        dispatch(setTokenSettings(newTokenObj))
        // if the token is not already in the enabledTokens array on the wallet
        if (wallet.enabledTokens.indexOf(newTokenObj.currencyCode) === -1) {
          // the createa  new enabledTokens array
          let newEnabledTokens = wallet.enabledTokens
          // and add the new token to that array
          newEnabledTokens.push(newTokenObj.currencyCode)
          // now send that new array over to be enabled in the core and on the wallet
          dispatch(UI_ACTIONS.setEnabledTokens(walletId, newEnabledTokens, null))
        }
        // update customTokens object in Redux store
        dispatch(setCustomTokens(settings.customTokens))
        // refresh wallet enabled tokens
        dispatch(UI_ACTIONS.getEnabledTokens(walletId))
        // now refresh the wallet to make sure token data is present on wallet object
        dispatch(UI_ACTIONS.refreshWallet(walletId))
        // congrats, adding the custom token has been a success
        dispatch(addTokenSuccess())
        // now remove the ManageToknens scene and head to the walletList scene
        Actions.walletList()
      })
      .catch((e) => console.log(e))
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