import { EdgeCurrencyWallet } from 'edge-core-js'

import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { refreshConnectedWalletsForFioAddress, refreshFioNames } from '../util/FioAddressUtils'
import { createCurrencyWallet } from './CreateWalletActions'

export function createFioWallet(): ThunkAction<Promise<EdgeCurrencyWallet>> {
  return async (dispatch, getState) => {
    const state = getState()
    const fiatCurrencyCode = state.ui.settings.defaultIsoFiat
    return await dispatch(createCurrencyWallet(lstrings.fio_address_register_default_fio_wallet_name, FIO_WALLET_TYPE, fiatCurrencyCode))
  }
}

export function refreshAllFioAddresses(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    dispatch({
      type: 'FIO/SET_FIO_ADDRESSES_PROGRESS'
    })
    const state = getState()
    const { currencyWallets } = state.core.account
    const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets

    const { fioAddresses, fioDomains, fioWalletsById } = await refreshFioNames(fioWallets)

    global.requestAnimationFrame(() => {
      dispatch({
        type: 'FIO/SET_FIO_ADDRESSES',
        data: { fioAddresses }
      })
      dispatch({
        type: 'FIO/SET_FIO_DOMAINS',
        data: { fioDomains }
      })
    })

    const { connectedWalletsByFioAddress } = state.ui.fio
    const wallets = Object.keys(currencyWallets).map(walletKey => currencyWallets[walletKey])
    for (const { name, walletId } of fioAddresses) {
      if (!connectedWalletsByFioAddress[name]) {
        const fioWallet = fioWalletsById[walletId]
        if (!fioWallet) continue
        const ccWalletMap = await refreshConnectedWalletsForFioAddress(name, fioWallet, wallets)
        dispatch({
          type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
          data: {
            fioAddress: name,
            ccWalletMap
          }
        })
      }
    }
  }
}
