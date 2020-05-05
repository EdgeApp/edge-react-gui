// @flow
import { bns } from 'biggystring'
import { createSimpleConfirmModal } from 'edge-components'
import { type EdgeCurrencyWallet, type EdgeMetadata, type EdgeTransaction } from 'edge-core-js'
import React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { selectWalletForExchange } from '../actions/CryptoExchangeActions.js'
import { launchModal } from '../components/common/ModalProvider.js'
import { type AccountPaymentParams } from '../components/scenes/CreateWalletAccountSelectScene.js'
import { showError } from '../components/services/AirshipInstance.js'
import * as Constants from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import { getExchangeDenomination } from '../modules/Settings/selectors.js'
import { Icon } from '../modules/UI/components/Icon/Icon.ui.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { logEvent } from '../util/tracking.js'
import { selectWallet as selectWalletAction, updateMostRecentWalletsSelected } from './WalletActions.js'

export const createCurrencyWalletAndAddToSwap = (walletName: string, walletType: string, fiatCurrencyCode: string) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch({ type: 'UI/WALLETS/CREATE_WALLET_START' })
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  return account
    .createCurrencyWallet(type, {
      name: walletName,
      fiatCurrencyCode,
      keyOptions: format ? { format } : {}
    })
    .then(edgeWallet => {
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_SUCCESS' })
      dispatch(updateMostRecentWalletsSelected(edgeWallet.id, edgeWallet.currencyInfo.currencyCode))
      dispatch(selectWalletForExchange(edgeWallet.id, edgeWallet.currencyInfo.currencyCode))
    })
    .catch(async error => {
      const modal = createSimpleConfirmModal({
        title: s.strings.create_wallet_failed_header,
        message: s.strings.create_wallet_failed_message,
        icon: <Icon type={Constants.MATERIAL_COMMUNITY} name={Constants.EXCLAMATION} size={30} />,
        buttonText: s.strings.string_ok
      })
      await launchModal(modal)
      console.log(error)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_FAILURE' })
    })
}
export const createCurrencyWalletAndSelectForPlugins = (walletName: string, walletType: string, fiatCurrencyCode: string) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  // dispatch({ type: 'UI/WALLETS/CREATE_WALLET_START' })
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  const wallet = await account.createCurrencyWallet(type, {
    name: walletName,
    fiatCurrencyCode,
    keyOptions: format ? { format } : {}
  })
  return Promise.resolve(wallet)
}

export const createCurrencyWallet = (
  walletName: string,
  walletType: string,
  fiatCurrencyCode: string,
  popScene: boolean = true,
  selectWallet: boolean = false,
  importText?: string // for creating wallet from private seed / key
) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch({ type: 'UI/WALLETS/CREATE_WALLET_START' })
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  const opts = {
    name: walletName,
    fiatCurrencyCode,
    keyOptions: format ? { format } : {},
    importText
  }
  return account
    .createCurrencyWallet(type, opts)
    .then(edgeWallet => {
      if (popScene) Actions.popTo(Constants.WALLET_LIST_SCENE)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_SUCCESS' })
      if (selectWallet) {
        dispatch(selectWalletAction(edgeWallet.id, edgeWallet.currencyInfo.currencyCode))
      }
      return edgeWallet
    })
    .catch(async error => {
      showError(error)
      dispatch({ type: 'UI/WALLETS/CREATE_WALLET_FAILURE' })
    })
}

export const fetchAccountActivationInfo = (currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    const supportedCurrencies = currencyPlugin.otherMethods.getActivationSupportedCurrencies()
    const activationCost = currencyPlugin.otherMethods.getActivationCost()
    const activationInfo = await Promise.all([supportedCurrencies, activationCost])
    const modifiedSupportedCurrencies = { ...activationInfo[0], FTC: false }
    dispatch({
      type: 'ACCOUNT_ACTIVATION_INFO',
      data: {
        supportedCurrencies: modifiedSupportedCurrencies,
        activationCost: activationInfo[1]
      }
    })
  } catch (error) {
    showError(error)
  }
}

export const fetchWalletAccountActivationPaymentInfo = (paymentParams: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  try {
    const networkTimeout = setTimeout(() => {
      showError('Network Timeout')
      dispatch({
        type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR',
        data: 'Network Timeout'
      })
    }, 12000)
    createdCoreWallet.otherMethods
      .getAccountActivationQuote(paymentParams)
      .then(activationQuote => {
        dispatch({
          type: 'ACCOUNT_ACTIVATION_PAYMENT_INFO',
          data: {
            ...activationQuote,
            currencyCode: paymentParams.currencyCode
          }
        })
        clearTimeout(networkTimeout)
      })
      .catch(showError)
  } catch (error) {
    showError(error)
  }
}

export const checkHandleAvailability = (currencyCode: string, accountName: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'IS_CHECKING_HANDLE_AVAILABILITY', data: true })
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    const data = await currencyPlugin.otherMethods.validateAccount(accountName)
    if (data.result === 'AccountAvailable') {
      dispatch({ type: 'HANDLE_AVAILABLE_STATUS', data: 'AVAILABLE' })
    }
  } catch (e) {
    let data = 'UNKNOWN_ERROR'
    if (e.name === 'ErrorAccountUnavailable') {
      data = 'UNAVAILABLE'
    } else if (e.name === 'ErrorInvalidAccountName') {
      data = 'INVALID'
    }
    dispatch({ type: 'HANDLE_AVAILABLE_STATUS', data })
  }
}

export const createAccountTransaction = (createdWalletId: string, accountName: string, paymentWalletId: string) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  // check available funds
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const createdWallet = UI_SELECTORS.getWallet(state, createdWalletId)
  const paymentWallet = CORE_SELECTORS.getWallet(state, paymentWalletId)
  const createdWalletCurrencyCode = createdWallet.currencyCode
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[createdWalletCurrencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  const { paymentAddress, amount, currencyCode } = state.ui.scenes.createWallet.walletAccountActivationPaymentInfo
  const handleAvailability = await currencyPlugin.otherMethods.validateAccount(accountName)
  const paymentDenom = getExchangeDenomination(state, currencyCode)
  let nativeAmount = bns.mul(amount, paymentDenom.multiplier)
  nativeAmount = bns.toFixed(nativeAmount, 0, 0)
  if (handleAvailability.result === 'AccountAvailable') {
    const guiMakeSpendInfo = {
      currencyCode,
      nativeAmount,
      publicAddress: paymentAddress,
      lockInputs: true,
      onBack: () => {
        // Hack. Keyboard pops up for some reason. Close it
        logEvent('ActivateWalletCancel', {
          currencyCode: createdWalletCurrencyCode
        })
      },
      onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
        if (error) {
          console.log(error)
          setTimeout(() => {
            Alert.alert(s.strings.create_wallet_account_error_sending_transaction)
          }, 750)
        } else if (edgeTransaction) {
          logEvent('ActivateWalletSuccess', {
            currencyCode: createdWalletCurrencyCode
          })
          const edgeMetadata: EdgeMetadata = {
            name: sprintf(s.strings.create_wallet_account_metadata_name, createdWalletCurrencyCode),
            category: 'Expense:' + sprintf(s.strings.create_wallet_account_metadata_category, createdWalletCurrencyCode),
            notes: sprintf(s.strings.create_wallet_account_metadata_notes, createdWalletCurrencyCode, createdWalletCurrencyCode, 'support@edge.app')
          }
          paymentWallet.saveTxMetadata(edgeTransaction.txid, currencyCode, edgeMetadata).then(() => {
            Actions.popTo(Constants.WALLET_LIST_SCENE)
            setTimeout(() => {
              Alert.alert(s.strings.create_wallet_account_payment_sent_title, s.strings.create_wallet_account_payment_sent_message)
            }, 750)
          })
        }
      }
    }
    dispatch({
      type: 'UI/WALLETS/SELECT_WALLET',
      data: { currencyCode, walletId: paymentWalletId }
    })
    Actions[Constants.SEND_CONFIRMATION]({ guiMakeSpendInfo })
  } else {
    // if handle is now unavailable
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
  await launchModal(modal)
  Actions.pop()
}
