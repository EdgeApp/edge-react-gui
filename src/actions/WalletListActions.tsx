import * as React from 'react'
import { Linking } from 'react-native'
import { sprintf } from 'sprintf-js'

import { writeWalletsSort } from '../actions/SettingsActions'
import { showFullScreenSpinner } from '../components/modals/AirshipFullScreenSpinner'
import { ButtonsModal } from '../components/modals/ButtonsModal'
import { SortOption } from '../components/modals/WalletListSortModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { GetState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { getCreateWalletType } from '../util/CurrencyInfoHelpers'
import { parseDeepLink } from '../util/DeepLinkParser'
import { logActivity } from '../util/logger'
import { launchDeepLink } from './DeepLinkingActions'

export function updateWalletsSort(walletsSort: SortOption): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    // For speed efficiency, dispatch is independent of persistence
    dispatch({
      type: 'UI/SETTINGS/SET_WALLETS_SORT',
      data: { walletsSort }
    })
    writeWalletsSort(account, walletsSort).catch(showError)
  }
}

export function linkReferralWithCurrencies(navigation: NavigationBase, uri: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    // Fill in any addresses:
    const currencyCodeMatches = uri.match(/%([a-zA-Z]+)%/g)
    if (currencyCodeMatches != null) {
      for (const match of currencyCodeMatches) {
        const currencyCode = match.toUpperCase().replace(/%/g, '')
        const address = await getFirstCurrencyAddress(currencyCode, getState)
        if (address == null) continue
        uri = uri.replace(match, address)
      }
    }

    const parsed = parseDeepLink(uri)
    if (parsed.type === 'other') await Linking.openURL(uri)
    else await dispatch(launchDeepLink(navigation, parsed))
  }
}

const getFirstCurrencyAddress = async (currencyCode: string, getState: GetState) => {
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
  if (!createWalletTypes) throw new Error(lstrings.wallet_list_referral_link_currency_invalid)

  const askUserToCreateWallet = await createWalletCheckModal(currencyCode)
  if (!askUserToCreateWallet) throw new Error(lstrings.wallet_list_referral_link_cancelled_wallet_creation)

  const createWallet = account.createCurrencyWallet(createWalletTypes.walletType, {
    name: createWalletTypes.currencyName,
    fiatCurrencyCode: defaultIsoFiat
  })
  const wallet = await showFullScreenSpinner(lstrings.wallet_list_referral_link_currency_loading, createWallet)
  logActivity(`Create Wallet (wallet list): ${account.username} -- ${createWalletTypes.walletType} -- ${defaultIsoFiat ?? ''}`)

  const receiveAddress = await wallet.getReceiveAddress()
  return receiveAddress.publicAddress
}

const createWalletCheckModal = async (currencyCode: string): Promise<boolean> => {
  const result = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.fragment_create_wallet_create_wallet}
      message={sprintf(lstrings.wallet_list_referral_link_ask_wallet_creation, currencyCode)}
      buttons={{
        ok: { label: lstrings.yes },
        cancel: { label: lstrings.no }
      }}
    />
  ))
  return result === 'ok'
}
