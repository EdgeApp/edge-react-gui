// @flow

import * as React from 'react'
import { Linking } from 'react-native'
import { sprintf } from 'sprintf-js'

import { showFullScreenSpinner } from '../components/modals/AirshipFullScreenSpinner.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import type { SortOption } from '../components/modals/WalletListSortModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import { setAccountBalanceVisibility, setWalletsSort } from '../modules/Core/Account/settings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { getCreateWalletType } from '../util/CurrencyInfoHelpers.js'

export const toggleAccountBalanceVisibility = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const currentAccountBalanceVisibility = state.ui.settings.isAccountBalanceVisible
  setAccountBalanceVisibility(account, !currentAccountBalanceVisibility)
    .then(() => {
      dispatch({
        type: 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY',
        data: { isAccountBalanceVisible: !currentAccountBalanceVisibility }
      })
    })
    .catch(showError)
}

export const updateWalletsSort = (walletsSort: SortOption) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  // For speed efficiency, dispatch is independent of persistence
  dispatch({
    type: 'UI/SETTINGS/SET_WALLETS_SORT',
    data: { walletsSort }
  })
  setWalletsSort(account, walletsSort).catch(showError)
}

export const linkReferralWithCurrencies = (uri: string) => async (dispatch: Dispatch, getState: GetState) => {
  const currencyCodeMatches = uri.match(/%([a-zA-Z]+)%/g)
  if (currencyCodeMatches) {
    try {
      for (const match of currencyCodeMatches) {
        const currencyCode = match.toUpperCase().replace(/%/g, '')
        const address = await getFirstCurrencyAddress(currencyCode, getState)
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

const getFirstCurrencyAddress = async (currencyCode, getState) => {
  // Wallet Check
  const state = getState()
  const { account } = state.core
  const edgeWallets = state.core.account.currencyWallets
  const walletIds = Object.keys(edgeWallets)
  const walletId = walletIds.find(id => {
    const edgeWallet = edgeWallets[id]
    const walletCurrency = edgeWallet.currencyInfo.currencyCode.toUpperCase()
    return walletCurrency === currencyCode
  })
  if (walletId) {
    const wallet = edgeWallets[walletId]
    return (await wallet.getReceiveAddress()).publicAddress
  }

  // Wallet Creation
  const { defaultIsoFiat } = state.ui.settings

  const createWalletTypes = getCreateWalletType(account, currencyCode)
  if (!createWalletTypes) throw new Error(s.strings.wallet_list_referral_link_currency_invalid)

  const askUserToCreateWallet = await createWalletCheckModal(currencyCode)
  if (!askUserToCreateWallet) throw new Error(s.strings.wallet_list_referral_link_cancelled_wallet_creation)

  const createWallet = account.createCurrencyWallet(createWalletTypes.walletType, {
    name: createWalletTypes.currencyName,
    fiatCurrencyCode: defaultIsoFiat
  })
  const wallet = await showFullScreenSpinner(s.strings.wallet_list_referral_link_currency_loading, createWallet)
  global.logActivity(`Create Wallet (wallet list): ${account.username} -- ${createWalletTypes.walletType} -- ${defaultIsoFiat ?? ''}`)

  const receiveAddress = await wallet.getReceiveAddress()
  return receiveAddress.publicAddress
}

const createWalletCheckModal = async (currencyCode: string): Promise<boolean> => {
  const result = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.fragment_create_wallet_create_wallet}
      message={sprintf(s.strings.wallet_list_referral_link_ask_wallet_creation, currencyCode)}
      buttons={{
        ok: { label: s.strings.yes },
        cancel: { label: s.strings.no }
      }}
    />
  ))
  return result === 'ok'
}
