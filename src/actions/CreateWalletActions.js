// @flow
import { bns } from 'biggystring'
import { type EdgeCurrencyWallet, type EdgeMetadata, type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { type AccountPaymentParams } from '../components/scenes/CreateWalletAccountSelectScene.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { SEND, WALLET_LIST_SCENE } from '../constants/SceneKeys.js'
import { CURRENCY_PLUGIN_NAMES } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { getExchangeDenomination } from '../selectors/DenominationSelectors.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { logEvent } from '../util/tracking.js'
import { selectWallet as selectWalletAction } from './WalletActions.js'

export const createCurrencyWallet =
  (
    walletName: string,
    walletType: string,
    fiatCurrencyCode: string,
    popScene: boolean = true,
    selectWallet: boolean = false,
    importText?: string // for creating wallet from private seed / key
  ) =>
  async (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core

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
        const { currencyCode } = edgeWallet.currencyInfo
        if (popScene) Actions.popTo(WALLET_LIST_SCENE)
        dispatch({ type: 'UI/WALLETS/CREATE_WALLET_SUCCESS' })
        if (selectWallet) {
          dispatch(selectWalletAction(edgeWallet.id, currencyCode))
        }
        return edgeWallet
      })
      .catch(error => {
        showError(error)
        dispatch({ type: 'UI/WALLETS/CREATE_WALLET_FAILURE' })
      })
  }

// can move to component in the future, just account and currencyConfig, etc to component through connector
export const fetchAccountActivationInfo = (currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    const supportedCurrencies = currencyPlugin.otherMethods.getActivationSupportedCurrencies()
    const activationCost = currencyPlugin.otherMethods.getActivationCost(currencyCode)
    const activationInfo = await Promise.all([supportedCurrencies, activationCost])
    const modifiedSupportedCurrencies = { ...activationInfo[0].result, FTC: false }
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

export const fetchWalletAccountActivationPaymentInfo =
  (paymentParams: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet) => (dispatch: Dispatch, getState: GetState) => {
    try {
      const networkTimeout = setTimeout(() => {
        showError('Network Timeout')
        dispatch({
          type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR',
          data: 'Network Timeout'
        })
      }, 26000)
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
  const { account } = state.core
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    const data = await currencyPlugin.otherMethods.validateAccount(accountName)
    if (data.result === 'AccountAvailable') {
      dispatch({ type: 'HANDLE_AVAILABLE_STATUS', data: 'AVAILABLE' })
    }
  } catch (error) {
    console.log('checkHandleAvailability error: ', error)
    let data = 'UNKNOWN_ERROR'
    if (error.name === 'ErrorAccountUnavailable') {
      data = 'UNAVAILABLE'
    } else if (error.name === 'ErrorInvalidAccountName') {
      data = 'INVALID'
    }
    dispatch({ type: 'HANDLE_AVAILABLE_STATUS', data })
  }
}

export const createAccountTransaction =
  (createdWalletId: string, accountName: string, paymentWalletId: string) => async (dispatch: Dispatch, getState: GetState) => {
    // check available funds
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account
    const createdWallet = state.ui.wallets.byId[createdWalletId]
    const paymentWallet = currencyWallets[paymentWalletId]
    const createdWalletCurrencyCode = createdWallet.currencyCode
    const currencyPluginName = CURRENCY_PLUGIN_NAMES[createdWalletCurrencyCode]
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
              Actions.popTo(WALLET_LIST_SCENE)
              setTimeout(() => {
                Alert.alert(s.strings.create_wallet_account_payment_sent_title, s.strings.create_wallet_account_payment_sent_message)
              }, 750)
            })
          }
        }
      }
      Actions.push(SEND, {
        guiMakeSpendInfo,
        selectedWalletId: paymentWalletId,
        selectedCurrencyCode: currencyCode
      })
    } else {
      // if handle is now unavailable
      dispatch(createHandleUnavailableModal(createdWalletId, accountName))
    }
  }

export const createHandleUnavailableModal = (newWalletId: string, accountName: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  account.changeWalletStates({
    [newWalletId]: {
      deleted: true
    }
  })
  await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.create_wallet_account_handle_unavailable_modal_title}
      message={sprintf(s.strings.create_wallet_account_handle_unavailable_modal_message, accountName)}
      buttons={{ ok: { label: s.strings.string_ok } }}
    />
  ))
  Actions.pop()
}
