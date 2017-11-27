export const ADD_TOKEN = 'ADD_TOKEN'
export const ADD_TOKEN_START = 'ADD_TOKEN_START'
export const ADD_TOKEN_SUCCESS = 'ADD_TOKEN_SUCCESS'

import {Actions} from 'react-native-router-flux'

import * as WALLET_API from '../../../Core/Wallets/api.js'

import * as CORE_SELECTORS from '../../../Core/selectors.js'

export const addToken = (walletId, tokenName, tokenCode, tokenDenomination) => (dispatch, getState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  dispatch(addTokenStart(walletId))

  WALLET_API.addCustomToken(wallet, tokenName, tokenCode, tokenDenomination)
    .then(() => {
      dispatch(addTokenSuccess())
      Actions.pop()
      // dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch((e) => console.log(e))
}

export const addTokenStart = () => ({
  type: ADD_TOKEN_START
})

export const addTokenSuccess = () => ({
  type: ADD_TOKEN_SUCCESS
})