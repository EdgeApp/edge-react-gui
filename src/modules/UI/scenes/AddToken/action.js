export const ADD_TOKEN = 'ADD_TOKEN'
export const ADD_TOKEN_START = 'ADD_TOKEN_START'
export const ADD_TOKEN_SUCCESS = 'ADD_TOKEN_SUCCESS'
export const SET_TOKEN_SETTINGS = 'SET_TOKEN_SETTINGS'

import {Actions} from 'react-native-router-flux'

import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as SETTINGS_ACTIONS from '../Settings/action.js'
import * as SETTINGS_API from '../../../Core/Account/settings.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_ACTIONS from '../../Wallets/action.js'

export const addToken = (walletId, tokenObj) => (dispatch, getState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  dispatch(addTokenStart(walletId))

  WALLET_API.addCustomToken(wallet, tokenObj)
    .then(() => {
      SETTINGS_API.getSyncedSettings(account)
      .then((settings) => {
        settings[tokenObj.currencyCode] = {denomination: tokenObj.multiplier}
        SETTINGS_API.setSyncedSettings(account, settings)
        .then(() => {
          dispatch(SETTINGS_ACTIONS.setDenominationKeyRequest(tokenObj.currencyCode, tokenObj.multiplier))
          .then(() => {
            dispatch(setTokenSettings(tokenObj))
            dispatch(addTokenSuccess())
            dispatch(UI_ACTIONS.refreshWallet(walletId))
            Actions.walletList()
          })
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
  const data = {
    denomination: tokenObj.multiplier,
    currencyName: tokenObj.currencyName,
    currencyCode: tokenObj.currencyCode,
    denominations: [{
      name: tokenObj.currencyCode,
      multiplier: tokenObj.multiplier
    }]
  }
  return {
    type: SET_TOKEN_SETTINGS,
    data
  }
}