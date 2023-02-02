import { mul, toFixed } from 'biggystring'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { AccountPaymentParams } from '../components/scenes/CreateWalletAccountSelectScene'
import { Airship, showError } from '../components/services/AirshipInstance'
import { WalletCreateItem } from '../components/themed/WalletList'
import { getPluginId, SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings'
import { HandleAvailableStatus } from '../reducers/scenes/CreateWalletReducer'
import { getExchangeDenomination } from '../selectors/DenominationSelectors'
import { config } from '../theme/appConfig'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { logActivity } from '../util/logger'
import { filterNull } from '../util/safeFilters'
import { logEvent, TrackingEventName } from '../util/tracking'

export interface CreateWalletOptions {
  walletType: string
  fiatCurrencyCode?: string
  importText?: string // for creating wallet from private seed / key
  trackingEventFailed?: TrackingEventName
  trackingEventSuccess?: TrackingEventName
  walletName?: string
}

export const createWallet = async (account: EdgeAccount, { walletType, walletName, fiatCurrencyCode, importText }: CreateWalletOptions) => {
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  const opts = {
    name: walletName,
    fiatCurrencyCode,
    keyOptions: format ? { format } : {},
    importText
  }
  const out = await account.createCurrencyWallet(type, opts)
  logActivity(`Create Wallet: ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${opts.name ?? ''}`)
  return out
}

export function createCurrencyWallet(
  walletName: string,
  walletType: string,
  fiatCurrencyCode?: string,
  importText?: string
): ThunkAction<Promise<EdgeCurrencyWallet>> {
  return async (dispatch, getState) => {
    const state = getState()
    fiatCurrencyCode = fiatCurrencyCode ?? state.ui.settings.defaultIsoFiat
    return createWallet(state.core.account, { walletName, walletType, fiatCurrencyCode, importText })
  }
}

// can move to component in the future, just account and currencyConfig, etc to component through connector
export function fetchAccountActivationInfo(walletType: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
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
    } catch (error: any) {
      showError(error)
    }
  }
}

export function fetchWalletAccountActivationPaymentInfo(paymentParams: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet): ThunkAction<void> {
  return (dispatch, getState) => {
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
        // @ts-expect-error
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
    } catch (error: any) {
      showError(error)
    }
  }
}

export function checkHandleAvailability(walletType: string, accountName: string): ThunkAction<void> {
  return async (dispatch, getState) => {
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
    } catch (error: any) {
      console.log('checkHandleAvailability error: ', error)
      let data: HandleAvailableStatus = 'UNKNOWN_ERROR'
      if (error.name === 'ErrorAccountUnavailable') {
        data = 'UNAVAILABLE'
      } else if (error.name === 'ErrorInvalidAccountName') {
        data = 'INVALID'
      }
      dispatch({ type: 'HANDLE_AVAILABLE_STATUS', data })
    }
  }
}

export function createAccountTransaction(
  navigation: NavigationBase,
  createdWalletId: string,
  accountName: string,
  paymentWalletId: string
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    // check available funds
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account
    const createdCurrencyWallet = currencyWallets[createdWalletId]
    const paymentWallet: EdgeCurrencyWallet = currencyWallets[paymentWalletId]
    const createdWalletCurrencyCode = createdCurrencyWallet.currencyInfo.currencyCode
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
          logEvent('Activate_Wallet_Cancel', {
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
            logEvent('Activate_Wallet_Done', {
              currencyCode: createdWalletCurrencyCode
            })
            const edgeMetadata: EdgeMetadata = {
              name: sprintf(s.strings.create_wallet_account_metadata_name, createdWalletCurrencyCode),
              category: 'Expense:' + sprintf(s.strings.create_wallet_account_metadata_category, createdWalletCurrencyCode),
              notes: sprintf(s.strings.create_wallet_account_metadata_notes, createdWalletCurrencyCode, createdWalletCurrencyCode, config.supportEmail)
            }
            paymentWallet.saveTxMetadata(edgeTransaction.txid, currencyCode, edgeMetadata).then(() => {
              navigation.navigate('walletList', {})
              setTimeout(() => {
                Alert.alert(s.strings.create_wallet_account_payment_sent_title, s.strings.create_wallet_account_payment_sent_message)
              }, 750)
            })
          }
        },
        alternateBroadcast:
          createdCurrencyWallet.otherMethods.submitActivationPayment != null ? createdCurrencyWallet.otherMethods.submitActivationPayment : undefined
      }
      navigation.push('send', {
        guiMakeSpendInfo,
        selectedWalletId: paymentWalletId,
        selectedCurrencyCode: currencyCode
      })
    } else {
      // if handle is now unavailable
      dispatch(createHandleUnavailableModal(navigation, createdWalletId, accountName))
    }
  }
}

export function createHandleUnavailableModal(navigation: NavigationBase, newWalletId: string, accountName: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    account.changeWalletStates({
      [newWalletId]: {
        deleted: true
      }
    })
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.create_wallet_account_handle_unavailable_modal_title}
        message={sprintf(s.strings.create_wallet_account_handle_unavailable_modal_message, accountName)}
        buttons={{ ok: { label: s.strings.string_ok } }}
      />
    ))
    navigation.pop()
  }
}

export const PLACEHOLDER_WALLET_ID = 'NEW_WALLET_UNIQUE_STRING'
export interface MainWalletCreateItem extends WalletCreateItem {
  walletType: string
}
interface TokenWalletCreateItem extends WalletCreateItem {
  tokenId: string
  createWalletIds: string[]
}

export const splitCreateWalletItems = (createItems: WalletCreateItem[]): { newWalletItems: MainWalletCreateItem[]; newTokenItems: TokenWalletCreateItem[] } => {
  const newWalletItems: MainWalletCreateItem[] = []
  const newTokenItems: TokenWalletCreateItem[] = []
  createItems.forEach(item => {
    if (item.walletType != null) {
      newWalletItems.push(item as MainWalletCreateItem)
    } else if (item.tokenId != null) {
      if (item.createWalletIds == null) item.createWalletIds = []
      newTokenItems.push(item as TokenWalletCreateItem)
    }
  })
  return { newWalletItems, newTokenItems }
}

export function enableTokensAcrossWallets(newTokenItems: TokenWalletCreateItem[]): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { currencyWallets } = state.core.account

    const walletIdTokenMap = newTokenItems.reduce((map: { [walletId: string]: string[] }, item) => {
      const { createWalletIds, tokenId } = item

      const walletId = createWalletIds[0]
      if (map[walletId] == null) map[walletId] = []
      map[walletId].push(tokenId)

      return map
    }, {})

    // Create the enableToken promises to be promise.all'd later
    const promises: Array<Promise<void>> = Object.keys(walletIdTokenMap).map(async walletId => {
      const wallet = currencyWallets[walletId]
      if (wallet == null) return
      return wallet.changeEnabledTokenIds([...wallet.enabledTokenIds, ...walletIdTokenMap[walletId]])
    })

    await Promise.all(promises)
  }
}

export const getUniqueWalletName = (account: EdgeAccount, pluginId: string): string => {
  const { currencyWallets, currencyConfig } = account
  const { displayName } = currencyConfig[pluginId].currencyInfo
  const defaultName = SPECIAL_CURRENCY_INFO[pluginId]?.initWalletName ?? sprintf(s.strings.my_crypto_wallet_name, displayName)

  const existingWalletNames = Object.keys(currencyWallets)
    .filter(walletId => currencyWallets[walletId].currencyInfo.pluginId === pluginId)
    .map(walletId => currencyWallets[walletId].name)
  const filteredWalletNames = filterNull(existingWalletNames).filter((name: string) => name.startsWith(defaultName))

  let newWalletName = defaultName
  let count = 2

  while (true) {
    if (filteredWalletNames.includes(newWalletName)) {
      newWalletName = `${defaultName} ${count++}`
    } else {
      return newWalletName
    }
  }
}
