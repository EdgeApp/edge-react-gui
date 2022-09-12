import { EdgeCurrencyWallet } from 'edge-core-js'

import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings'
import { refreshConnectedWalletsForFioAddress, refreshFioNames } from '../modules/FioAddress/util'
import { Dispatch, GetState } from '../types/reduxTypes'
import { createCurrencyWallet } from './CreateWalletActions'

export const createFioWallet =
  () =>
  async (dispatch: Dispatch, getState: GetState): Promise<EdgeCurrencyWallet | any> => {
    const state = getState()
    const fiatCurrencyCode = state.ui.settings.defaultIsoFiat
    return await dispatch(createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, FIO_WALLET_TYPE, fiatCurrencyCode))
  }

export const refreshAllFioAddresses = () => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({
    type: 'FIO/SET_FIO_ADDRESSES_PROGRESS'
  })
  const state = getState()
  const { currencyWallets } = state.core.account
  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets

  const { fioAddresses, fioDomains, fioWalletsById } = await refreshFioNames(fioWallets)

  window.requestAnimationFrame(() => {
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
