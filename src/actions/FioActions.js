// @flow

import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import React from 'react'
import { Actions } from 'react-native-router-flux'

import { FioExpiredModal } from '../components/modals/FioExpiredModal'
import { Airship } from '../components/services/AirshipInstance'
import * as Constants from '../constants/indexConstants'
import { FIO_ADDRESS_DELIMITER } from '../constants/indexConstants'
import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import {
  addToFioAddressCache,
  getExpiredSoonFioNames,
  getFioExpiredCheckFromDisklet,
  needToCheckExpired,
  refreshConnectedWalletsForFioAddress,
  refreshFioNames,
  setFioExpiredCheckToDisklet
} from '../modules/FioAddress/util'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import type { FioAddress, FioDomain } from '../types/types'

const EXPIRE_CHECK_TIMEOUT = 5000

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
  dispatch(refreshNamesToCheckExpired())
}

export const refreshNamesToCheckExpired = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  if (!account) return

  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
  if (fioWallets.length === 0) {
    return setTimeout(() => dispatch(refreshNamesToCheckExpired()), EXPIRE_CHECK_TIMEOUT)
  }

  const { expiredLastChecks, expiredChecking } = state.ui.fio
  const checkExpireWallets = []
  for (const fioWallet of fioWallets) {
    if (!expiredChecking[fioWallet.id] && needToCheckExpired(expiredLastChecks, fioWallet.id)) {
      dispatch({ type: 'FIO/CHECKING_EXPIRED', data: { [fioWallet.id]: true } })
      checkExpireWallets.push(fioWallet)
    }
  }

  if (checkExpireWallets.length !== 0) {
    dispatch(checkExpiredFioNames(checkExpireWallets))
  }

  return setTimeout(() => dispatch(refreshNamesToCheckExpired()), EXPIRE_CHECK_TIMEOUT)
}

export const checkExpiredFioNames = (fioWallets: EdgeCurrencyWallet[]) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  if (!account) return

  const { fioAddresses, fioDomains, fioWalletsById } = await refreshFioNames(fioWallets)
  const fioNames = [...fioAddresses, ...fioDomains]

  const expired: Array<FioAddress | FioDomain> = getExpiredSoonFioNames(fioNames)

  for (const item: FioAddress | FioDomain of expired) {
    const fioWallet: EdgeCurrencyWallet | void = fioWalletsById[item.walletId]
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

  const expiredLastChecks = { ...state.ui.fio.expiredLastChecks }
  const expireLoadingByWallet = {}
  let updateDisklet = false
  for (const fioWalletId in fioWalletsById) {
    if (fioNames.findIndex(({ walletId }) => walletId === fioWalletId) > -1) {
      expiredLastChecks[fioWalletId] = new Date()
      updateDisklet = true
    }
    expireLoadingByWallet[fioWalletId] = false
  }
  dispatch({ type: 'FIO/CHECKING_EXPIRED', data: expireLoadingByWallet })

  if (updateDisklet) {
    dispatch({ type: 'FIO/SET_LAST_EXPIRED_CHECKS', data: expiredLastChecks })
    setFioExpiredCheckToDisklet(expiredLastChecks, state.core.disklet)
  }
}
