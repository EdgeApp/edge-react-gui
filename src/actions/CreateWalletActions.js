// @flow
import { mul, toFixed } from 'biggystring'
import { type EdgeAccount, type EdgeCurrencyConfig, type EdgeCurrencyWallet, type EdgeMetadata, type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { showFullScreenSpinner } from '../components/modals/AirshipFullScreenSpinner.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { type AccountPaymentParams } from '../components/scenes/CreateWalletAccountSelectScene.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { SEND, WALLET_LIST_SCENE } from '../constants/SceneKeys.js'
import { getPluginId, getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { setEnabledTokens } from '../modules/Core/Wallets/EnabledTokens.js'
import { getExchangeDenomination } from '../selectors/DenominationSelectors.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import type { CreateTokenType } from '../types/types.js'
import { getCreateWalletType } from '../util/CurrencyInfoHelpers.js'
import { logEvent } from '../util/tracking.js'
import { approveTokenTerms } from './TokenTermsActions.js'
import { refreshWallet, selectWallet } from './WalletActions.js'

export type CreateWalletOptions = {
  walletName?: string,
  walletType: string,
  fiatCurrencyCode?: string,
  importText?: string // for creating wallet from private seed / key
}

const createWallet = async (account, { walletType, walletName, fiatCurrencyCode, importText }: CreateWalletOptions) => {
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  const opts = {
    name: walletName,
    fiatCurrencyCode: fiatCurrencyCode,
    keyOptions: format ? { format } : {},
    importText
  }
  return await account.createCurrencyWallet(type, opts)
}

const getParentWallet = async (account: EdgeAccount, currencyCode: string, fiatCurrencyCode: string): Promise<EdgeCurrencyWallet> => {
  const { currencyWallets } = account
  const walletId = Object.keys(currencyWallets).find(walletId => currencyWallets[walletId].currencyInfo.currencyCode === currencyCode)
  if (walletId != null) return currencyWallets[walletId]

  const { walletType } = getCreateWalletType(account, currencyCode) ?? {}
  if (walletType == null) throw new Error(s.strings.create_wallet_failed_message)
  return await createWallet(account, { walletType, fiatCurrencyCode })
}

export const createAndSelectToken =
  (createTokenType: CreateTokenType) =>
  async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const state = getState()
    const { account, disklet } = state.core
    // const { wallets } = state.ui.wallets.byId
    const { defaultIsoFiat } = state.ui.settings

    try {
      const { currencyCode, parentCurrencyCode } = createTokenType
      // Show the user the token terms modal only once
      await approveTokenTerms(disklet, parentCurrencyCode)
      // Find existing EdgeCurrencyWallet

      const wallet = await getParentWallet(account, parentCurrencyCode, defaultIsoFiat)

      const addToken = async () => {
        const enabledTokens = (await wallet.getEnabledTokens()) ?? []
        const tokens = enabledTokens.filter(tokenId => tokenId !== wallet.currencyInfo.pluginId)
        await setEnabledTokens(wallet, [...tokens, currencyCode], [])
        return [...enabledTokens, currencyCode]
      }

      const enabledTokens = await showFullScreenSpinner(s.strings.wallet_list_modal_enabling_token, addToken())

      dispatch({
        type: 'UPDATE_WALLET_ENABLED_TOKENS',
        data: { walletId: wallet.id, tokens: enabledTokens }
      })
      dispatch(refreshWallet(wallet.id))
      dispatch(selectWallet(wallet.id, currencyCode))
    } catch (error) {
      showError(error)
    }
  }

export const createCurrencyWallet = (opts: CreateWalletOptions) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { fiatCurrencyCode = state.ui.settings.defaultIsoFiat } = opts
  return createWallet(state.core.account, { ...opts, fiatCurrencyCode })
}

export const createAndSelectWallet = ({ walletType, fiatCurrencyCode, walletName: name }: CreateWalletOptions) => {
  const walletName = name ?? getSpecialCurrencyInfo(walletType).initWalletName
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core
    try {
      const wallet = await showFullScreenSpinner(
        s.strings.wallet_list_modal_creating_wallet,
        createWallet(account, { walletName, walletType, fiatCurrencyCode })
      )
      dispatch(selectWallet(wallet.id, wallet.currencyInfo.currencyCode))
    } catch (error) {
      showError(error)
    }
  }
}

// can move to component in the future, just account and currencyConfig, etc to component through connector
export const fetchAccountActivationInfo = (walletType: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const currencyPluginName = getPluginId(walletType)
  const currencyPlugin: EdgeCurrencyConfig = account.currencyConfig[currencyPluginName]
  try {
    const supportedCurrencies = currencyPlugin.otherMethods.getActivationSupportedCurrencies()
    const activationCost = currencyPlugin.otherMethods.getActivationCost(currencyPlugin.currencyInfo.currencyCode)
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

export const checkHandleAvailability = (walletType: string, accountName: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'IS_CHECKING_HANDLE_AVAILABILITY', data: true })
  const state = getState()
  const { account } = state.core
  const currencyPluginName = getPluginId(walletType)
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
    const createdCurrencyWallet = currencyWallets[createdWalletId]
    const paymentWallet: EdgeCurrencyWallet = currencyWallets[paymentWalletId]
    const createdWalletCurrencyCode = createdWallet.currencyCode
    const currencyPlugin = account.currencyConfig[createdCurrencyWallet.currencyInfo.pluginId]
    const { paymentAddress, amount, currencyCode } = state.ui.scenes.createWallet.walletAccountActivationPaymentInfo
    const handleAvailability = await currencyPlugin.otherMethods.validateAccount(accountName)
    const paymentDenom = getExchangeDenomination(state, paymentWallet.currencyInfo.pluginId, currencyCode)
    let nativeAmount = mul(amount, paymentDenom.multiplier)
    nativeAmount = toFixed(nativeAmount, 0, 0)
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
        },
        alternateBroadcast:
          createdCurrencyWallet.otherMethods.submitActivationPayment != null ? createdCurrencyWallet.otherMethods.submitActivationPayment : undefined
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
