// @flow
import { createSimpleConfirmModal, showModal } from 'edge-components'
import React from 'react'
import { sprintf } from 'sprintf-js'
import { Icon } from '../modules/UI/components/Icon/Icon.ui.js'
import { Actions } from 'react-native-router-flux'
import * as Constants from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as ACCOUNT_API from '../modules/Core/Account/api.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import { errorModal } from '../modules/UI/components/Modals/ErrorModal.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import { selectWallet as selectWalletAction } from './WalletActions.js'
import { PluginBridge } from '../modules/UI/scenes/Plugins/api.js'
import { type AccountPaymentParams } from '../components/scenes/CreateWalletAccountSelectScene.js'

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
      if (popScene) Actions.popTo(Constants.WALLET_LIST_SCENE)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_SUCCESS' })
      if (selectWallet) {
        dispatch(selectWalletAction(edgeWallet.id, edgeWallet.currencyInfo.currencyCode))
      }
      return edgeWallet
    })
    .catch(async error => {
      await showModal(errorModal(s.strings.create_wallet_failed, error))
      Actions.popTo(Constants.WALLET_LIST_SCENE)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_FAILURE' })
    })
}

export const fetchAccountActivationInfo = (currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    // $FlowFixMe
    const supportedCurrencies = currencyPlugin.otherMethods.getActivationSupportedCurrencies()
    // $FlowFixMe
    const activationCost = currencyPlugin.otherMethods.getActivationCost()
    const activationInfo = await Promise.all([supportedCurrencies, activationCost])
    // $FlowFixMe
    dispatch({
      type: 'ACCOUNT_ACTIVATION_INFO',
      data: {
        supportedCurrencies: activationInfo[0],
        activationCost: activationInfo[1]
      }
    })
  } catch (e) {
    console.log('fetchAccountActivationInfo error: ', e)
  }
}

export const fetchWalletAccountActivationPaymentInfo = (paymentParams: AccountPaymentParams) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, walletId)
  try {
    // $FlowFixMe
    const activationQuote = await coreWallet.otherMethods.getAccountActivationQuote(paymentParams)
    dispatch({
      type: 'ACCOUNT_ACTIVATION_PAYMENT_INFO',
      data: {
        ...activationQuote,
        currencyCode: paymentParams.paymentCurrencyCode
      }
    })
  } catch (e) {
    console.log(e)
  }
}

export const checkHandleAvailability = (currencyCode: string, accountName: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'IS_CHECKING_HANDLE_AVAILABILITY', data: true })
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    // $FlowFixMe
    const data = await currencyPlugin.otherMethods.validateAccount(accountName)
    dispatch({ type: 'IS_HANDLE_AVAILABLE', data })
  } catch (e) {
    console.log(e)
    dispatch({ type: 'IS_HANDLE_AVAILABLE', data: true })
  }
}

export const createAccountTransaction = (createdWalletId: string, accountName: string, paymentWalletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  // check available funds
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const createdWallet = UI_SELECTORS.getWallet(state, createdWalletId)
  const createdWalletCurrencyCode = createdWallet.currencyCode
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[createdWalletCurrencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  const { paymentAddress, nativeAmount, currencyCode } = state.ui.scenes.createWallet.walletAccountActivationPaymentInfo
  // $FlowFixMe
  const handleAvailability = await currencyPlugin.otherMethods.validateAccount(accountName)
  if (handleAvailability) {
    const makeSpendInfo = {
      currencyCode,
      nativeAmount,
      publicAddress: paymentAddress,
      lockInputs: true,
      onSuccess: () => Actions[Constants.WALLET_LIST_SCENE]()
    }
    dispatch({type: 'UI/WALLETS/SELECT_WALLET', data: {currencyCode, walletId: paymentWalletId}})
    const pluginBridge = new PluginBridge()
    pluginBridge.makeSpendRequest(makeSpendInfo)
  } else { // if handle is now unavailable
    dispatch(createHandleUnavailableModal(createdWalletId, accountName))
  }
}

export const createHandleUnavailableModal = (newWalletId: string, accountName: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  account.changeWalletStates({
    [newWalletId]: {
      deleted: true
    }
  })
  const modal = createSimpleConfirmModal({
    title: s.strings.create_wallet_account_handle_unavailable_modal_title,
    message: sprintf(s.strings.create_wallet_account_handle_unavailable_modal_message, accountName),
    icon: <Icon type={Constants.MATERIAL_COMMUNITY} name={Constants.CLOSE_ICON} size={30} />,
    buttonText: s.strings.string_ok
  })
  await showModal(modal)
  Actions.pop()
}
