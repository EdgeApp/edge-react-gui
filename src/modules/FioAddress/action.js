// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React from 'react'
import { Actions } from 'react-native-router-flux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions'
import { FioExpiredModal } from '../../components/modals/FioExpiredModal'
import { Airship } from '../../components/services/AirshipInstance'
import * as Constants from '../../constants/indexConstants'
import { FIO_ADDRESS_DELIMITER } from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes'
import type { FioAddress, FioDomain } from '../../types/types'
import { getDefaultIsoFiat } from '../Settings/selectors'
import { findWalletByFioAddress, getExpiredSoonFioNames, refreshConnectedWalletsForFioAddress } from './util'

export const createFioWallet =
  () =>
  (dispatch: Dispatch, getState: GetState): Promise<EdgeCurrencyWallet | any> => {
    const fiatCurrencyCode = getDefaultIsoFiat(getState())
    return dispatch(createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, Constants.FIO_WALLET_TYPE, fiatCurrencyCode, false, false))
  }

export const refreshAllFioAddresses =
  (checkExpired: boolean = false) =>
  async (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: 'FIO/SET_FIO_ADDRESSES_PROGRESS'
    })
    const state = getState()
    const { currencyWallets } = state.core.account
    const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
    let fioAddresses: FioAddress[] = []
    let fioDomains: FioDomain[] = []

    if (fioWallets != null) {
      for (const wallet of fioWallets) {
        const walletId = wallet.id
        const walletFioAddresses = await wallet.otherMethods.getFioAddresses()
        fioAddresses = [...fioAddresses, ...walletFioAddresses.map(({ name, expiration }) => ({ name, expiration, walletId }))]
        const walletFioDomains = await wallet.otherMethods.getFioDomains()
        fioDomains = [...fioDomains, ...walletFioDomains.map(({ name, expiration, isPublic }) => ({ name, expiration, isPublic, walletId }))]
      }
    }

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
    for (const { name } of fioAddresses) {
      if (!connectedWalletsByFioAddress[name]) {
        const fioWallet = await findWalletByFioAddress(fioWallets, name)
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

    if (checkExpired) {
      const expired: Array<FioAddress | FioDomain> = getExpiredSoonFioNames(fioAddresses, fioDomains)

      for (const item: FioAddress | FioDomain of expired) {
        const fioWallet: EdgeCurrencyWallet | void = fioWallets.find((walletItem: EdgeCurrencyWallet) => walletItem.id === item.walletId)
        if (!fioWallet) continue

        const isAddress = item.name.indexOf(FIO_ADDRESS_DELIMITER) > 0

        const answer = await Airship.show(bridge => <FioExpiredModal bridge={bridge} fioName={item.name} isAddress={isAddress} />)

        if (answer) {
          if (isAddress) {
            Actions[Constants.FIO_ADDRESS_SETTINGS]({
              showRenew: true,
              fioWallet,
              fioAddressName: item.name,
              expiration: item.expiration
            })
            continue
          }

          Actions[Constants.FIO_DOMAIN_SETTINGS]({
            showRenew: true,
            fioWallet,
            fioDomainName: item.name,
            isPublic: item.isPublic || false,
            expiration: item.expiration
          })
        }
      }
    }
  }
