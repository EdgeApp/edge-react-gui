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
import { parseDeepLink } from '../util/DeepLinkParser'
import { logActivity } from '../util/logger'
import { getUniqueWalletName } from './CreateWalletActions'
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
    writeWalletsSort(account, walletsSort).catch(error => showError(error))
  }
}

export function linkReferralWithCurrencies(navigation: NavigationBase, uri: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    // Fill in any addresses:
    const currencyCodeMatches = uri.match(/%([a-zA-Z]+)%/g)
    if (currencyCodeMatches != null) {
      for (const match of currencyCodeMatches) {
        const currencyCode = match.toUpperCase().replace(/%/g, '')
        const address = await getFirstCurrencyAddress({ currencyCode, getState })
        if (address == null) return
        uri = uri.replace(match, address)
      }
    }
    const pluginIdMatches = uri.match(/{{([a-zA-Z]+)}}/g)
    if (pluginIdMatches != null) {
      for (const match of pluginIdMatches) {
        const pluginId = match.replace(/{{/g, '').replace(/}}/g, '')
        const address = await getFirstCurrencyAddress({ pluginId, getState })
        if (address == null) return
        uri = uri.replace(match, address)
      }
    }

    const parsed = parseDeepLink(uri)
    if (parsed.type === 'other') await Linking.openURL(uri)
    else await dispatch(launchDeepLink(navigation, parsed))
  }
}

const getFirstCurrencyAddress = async (params: { pluginId?: string; currencyCode?: string; getState: GetState }): Promise<string | undefined> => {
  const { getState } = params
  const state = getState()
  const { account } = state.core
  const { currencyWallets, currencyConfig } = account
  let { pluginId, currencyCode } = params

  // If we have a plugin ID, use that
  try {
    if (pluginId != null) {
      currencyCode = currencyConfig[pluginId].currencyInfo.currencyCode
    } else if (currencyCode != null) {
      pluginId = Object.keys(currencyConfig).find(pluginId => currencyConfig[pluginId].currencyInfo.currencyCode === currencyCode)
    }
  } catch (e) {}

  if (pluginId == null || currencyCode == null) {
    throw new Error(lstrings.wallet_list_referral_link_currency_invalid)
  }

  // If we have a wallet, use that:
  const walletId = Object.keys(currencyWallets).find(walletId => currencyWallets[walletId].currencyInfo.pluginId === pluginId)
  if (walletId != null) {
    const wallet = currencyWallets[walletId]
    const address = await wallet.getReceiveAddress({ tokenId: null })
    return address.publicAddress
  }

  // Ask the user if they want a wallet:
  const result = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.fragment_create_wallet_create_wallet}
      message={sprintf(lstrings.wallet_list_referral_link_ask_wallet_creation_1s, currencyCode)}
      buttons={{
        ok: { label: lstrings.yes },
        cancel: { label: lstrings.no }
      }}
    />
  ))
  if (result !== 'ok') return

  // Create the wallet:
  const { walletType } = currencyConfig[pluginId].currencyInfo
  const { defaultIsoFiat } = state.ui.settings

  const walletPromise = account.createCurrencyWallet(walletType, {
    fiatCurrencyCode: defaultIsoFiat,
    name: getUniqueWalletName(account, pluginId)
  })
  const wallet = await showFullScreenSpinner(lstrings.wallet_list_referral_link_currency_loading, walletPromise)
  logActivity(`Create Wallet (wallet list): ${account.username} -- ${walletType} -- ${defaultIsoFiat ?? ''}`)

  const address = await wallet.getReceiveAddress({ tokenId: null })
  return address.publicAddress
}
