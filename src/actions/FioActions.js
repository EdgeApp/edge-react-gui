// @flow

import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import React from 'react'
import { Actions } from 'react-native-router-flux'

import { FioExpiredModal } from '../components/modals/FioExpiredModal'
import { Airship } from '../components/services/AirshipInstance'
import * as Constants from '../constants/indexConstants'
import { FIO_ADDRESS_DELIMITER } from '../constants/indexConstants'
import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import { addToFioAddressCache, getFioExpiredCheckFromDisklet, refreshConnectedWalletsForFioAddress } from '../modules/FioAddress/util'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import type { FioAddress, FioDomain } from '../types/types'

export const refreshConnectedWallets = async (dispatch: Dispatch, getState: GetState, currencyWallets: { [walletId: string]: EdgeCurrencyWallet }) => {
  const wallets: EdgeCurrencyWallet[] = []
  const fioWallets: EdgeCurrencyWallet[] = []
  for (const walletId of Object.keys(currencyWallets)) {
    if (currencyWallets[walletId] && currencyWallets[walletId].type === FIO_WALLET_TYPE) {
      fioWallets.push(currencyWallets[walletId])
    }
    wallets.push(currencyWallets[walletId])
  }
  const connectedWalletsByFioAddress = {}
  for (const fioWallet: EdgeCurrencyWallet of fioWallets) {
    if (!getState().core.account.id) break
    const fioAddresses = await fioWallet.otherMethods.getFioAddressNames()
    for (const fioAddress: string of fioAddresses) {
      if (!getState().core.account.id) break
      connectedWalletsByFioAddress[fioAddress] = await refreshConnectedWalletsForFioAddress(fioAddress, fioWallet, wallets)
      dispatch({
        type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
        data: {
          fioAddress,
          ccWalletMap: connectedWalletsByFioAddress[fioAddress]
        }
      })
    }
  }
}

export const checkFioObtData = (walletId: string, transactions: EdgeTransaction[]) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  if (!account || !account.currencyConfig) {
    setTimeout(() => {
      dispatch(checkFioObtData(walletId, transactions))
    }, 400)
  }
  try {
    const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]

    for (const transaction: EdgeTransaction of transactions) {
      if (transaction.metadata) {
        const { name } = transaction.metadata
        if (name && (await fioPlugin.otherMethods.isFioAddressValid(name))) {
          addToFioAddressCache(state.core.account, [name])
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}

export const expiredFioNamesCheckDates = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const lastChecks = await getFioExpiredCheckFromDisklet(state.core.disklet)
  dispatch({ type: 'FIO/SET_LAST_EXPIRED_CHECKS', data: lastChecks })
}

/* eslint-disable */
const showFioExpiredModal = async (fioWallet: EdgeCurrencyWallet, fioName: FioAddress | FioDomain) => {
  const isAddress = fioName.name.indexOf(FIO_ADDRESS_DELIMITER) > 0
  const answer = await Airship.show(bridge => <FioExpiredModal bridge={bridge} fioName={fioName.name} isAddress={isAddress} />)

  if (answer) {
    if (isAddress) {
      Actions[Constants.FIO_ADDRESS_SETTINGS]({
        showRenew: true,
        fioWallet,
        fioAddressName: fioName.name,
        expiration: fioName.expiration
      })
      return
    }

    Actions[Constants.FIO_DOMAIN_SETTINGS]({
      showRenew: true,
      fioWallet,
      fioDomainName: fioName.name,
      isPublic: fioName.isPublic || false,
      expiration: fioName.expiration
    })
  }
}
