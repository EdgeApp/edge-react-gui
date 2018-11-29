import { createSimpleConfirmModal, showModal } from 'edge-components'
// @flow
import React from 'react'
import { Image } from 'react-native'
import { Actions } from 'react-native-router-flux'

import walletIcon from '../assets/images/tabbar/wallets.png'
import * as Constants from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as ACCOUNT_API from '../modules/Core/Account/api.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import { makeSpend } from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import { errorModal } from '../modules/UI/components/Modals/ErrorModal.js'
import { getAuthRequired, getSpendInfo } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import { newSpendInfo, updateTransaction } from './SendConfirmationActions.js'
import { selectWallet as selectWalletAction } from './WalletActions.js'
import { PluginBridge } from '../modules/UI/scenes/Plugins/api.js'

export const updateWalletName = (walletName: string) => ({
  type: 'UPDATE_WALLET_NAME',
  data: { walletName }
})

export const selectWalletType = (walletType: string) => ({
  type: 'SELECT_WALLET_TYPE',
  data: { walletType }
})

export const selectFiat = (fiat: string) => ({
  type: 'SELECT_FIAT',
  data: { fiat }
})

export const createCurrencyWallet = (
  walletName: string,
  walletType: string,
  fiatCurrencyCode: string,
  popScene: boolean = true,
  selectWallet: boolean = false
) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch({ type: 'UI/WALLETS/CREATE_WALLET_START' })
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  return ACCOUNT_API.createCurrencyWalletRequest(account, type, {
    name: walletName,
    fiatCurrencyCode,
    keyOptions: format ? { format } : {}
  })
    .then(edgeWallet => {
      Actions.popTo(Constants.WALLET_LIST_SCENE)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_SUCCESS' })
      if (selectWallet) {
        dispatch(selectWalletAction(edgeWallet.id, edgeWallet.currencyInfo.currencyCode))
      }
    })
    .catch(async error => {
      await showModal(errorModal(s.strings.create_wallet_failed, error))
      Actions.popTo(Constants.WALLET_LIST_SCENE)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_FAILURE' })
    })
}

export const checkHandleAvailability = (handle: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'IS_CHECKING_HANDLE_AVAILABILITY', data: true })
  try {
    let isAvailable = false
    const random = Math.random()
    if (random > 0.3) {
      isAvailable = true
    } else {
      isAvailable = false
    }
    setTimeout(() => {
      dispatch({ type: 'IS_HANDLE_AVAILABLE', data: isAvailable })
    }, 1000 * Math.random())
  } catch (e) {

  }
}

export const createAccountTransaction = (walletId: string, data: string) => async (dispatch: Dispatch, getState: GetState) => {
  // check available funds
  const currencyCode = data.currencyCode || 'BTC'
  const nativeAmount = data.nativeAmount || '10000000'
  const publicAddress = '1ABJbqWtYKiuPBGA8NNkYVJsfGrbf6hiB8'
  const makeSpendInfo = {
    currencyCode,
    nativeAmount,
    publicAddress,
    lockInputs: true,
    onSuccess: () => Actions[Constants.WALLET_LIST_SCENE]()
  }
  dispatch({type: 'UI/WALLETS/SELECT_WALLET', data: {currencyCode, walletId}})
  const pluginBridge = new PluginBridge()
  pluginBridge.makeSpendRequest(makeSpendInfo)
}
