// @flow

import React from 'react'
import { Linking } from 'react-native'
import { sprintf } from 'sprintf-js'

import { TwoButtonSimpleConfirmationModal } from '../components/modals/TwoButtonSimpleConfirmationModal.js'
import { Airship, showError, showFullScreenSpinner } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import * as ACCOUNT_SETTINGS from '../modules/Core/Account/settings.js'
import { getSettings } from '../modules/Settings/selectors.js'
import { setAccountBalanceVisibility } from '../modules/Settings/SettingsActions.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { getCreateWalletType } from '../util/CurrencyInfoHelpers.js'

export const updateActiveWalletsOrder = (activeWalletIds: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  const newKeyStates = activeWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = { sortIndex: index }
    return keyStates
  }, {})

  return account.changeWalletStates(newKeyStates).catch(showError)
}

export const toggleAccountBalanceVisibility = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const currentAccountBalanceVisibility = state.ui.settings.isAccountBalanceVisible
  ACCOUNT_SETTINGS.setAccountBalanceVisibility(account, !currentAccountBalanceVisibility)
    .then(() => {
      dispatch(setAccountBalanceVisibility(!currentAccountBalanceVisibility))
    })
    .catch(showError)
}

export const linkReferralWithCurrencies = (uri: string) => async (dispatch: Dispatch, getState: GetState) => {
  const currencyCodeMatches = uri.match(/%([a-zA-Z]+)%/g)
  if (currencyCodeMatches) {
    try {
      for (const match of currencyCodeMatches) {
        const currencyCode = match.toUpperCase().replace(/%/g, '')
        const address = await getCurrencyAddress(currencyCode, getState)
        if (!address) continue
        uri = uri.replace(match, address)
      }
      Linking.openURL(uri)
    } catch (error) {
      showError(error)
    }
  } else {
    Linking.openURL(uri)
  }
}

const getCurrencyAddress = async (currencyCode, getState) => {
  // Wallet Check
  const state = getState()
  const { account } = state.core
  const wallets = state.ui.wallets.byId
  const walletIds = Object.keys(wallets)
  const walletId = walletIds.find(id => {
    const wallet = wallets[id]
    const walletCurrency = wallet.currencyCode.toUpperCase()
    return walletCurrency === currencyCode
  })
  if (walletId) {
    const wallet = wallets[walletId]
    return wallet.receiveAddress.publicAddress
  }

  // Wallet Creation
  const settings = getSettings(state)
  const { defaultIsoFiat } = settings

  const createWalletTypes = getCreateWalletType(account, currencyCode)
  if (!createWalletTypes) throw new Error(s.strings.wallet_list_referral_link_currency_invalid)

  const askUserToCreateWallet = await createWalletCheckModal(currencyCode)
  if (!askUserToCreateWallet) throw new Error(s.strings.wallet_list_referral_link_cancelled_wallet_creation)

  const createWallet = account.createCurrencyWallet(createWalletTypes.value, {
    name: createWalletTypes.label,
    fiatCurrencyCode: defaultIsoFiat
  })
  const wallet = await showFullScreenSpinner(s.strings.wallet_list_referral_link_currency_loading, createWallet)
  const receiveAddress = await wallet.getReceiveAddress()
  return receiveAddress.publicAddress
}

const createWalletCheckModal = async (currencyCode: string) => {
  return Airship.show(bridge => (
    <TwoButtonSimpleConfirmationModal
      bridge={bridge}
      title={s.strings.fragment_create_wallet_create_wallet}
      subTitle={sprintf(s.strings.wallet_list_referral_link_ask_wallet_creation, currencyCode)}
      cancelText={s.strings.no}
      doneText={s.strings.yes}
    />
  ))
}
