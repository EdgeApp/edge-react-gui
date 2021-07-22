// @flow

import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import React from 'react'

import { FioExpiredModal } from '../components/modals/FioExpiredModal'
import { Airship } from '../components/services/AirshipInstance'
import { FIO_ADDRESS_SETTINGS, FIO_DOMAIN_SETTINGS } from '../constants/SceneKeys.js'
import { CURRENCY_PLUGIN_NAMES, FIO_ADDRESS_DELIMITER, FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants.js'
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
import { Actions } from '../types/routerTypes.js'
import type { FioAddress, FioDomain } from '../types/types'

const EXPIRE_CHECK_TIMEOUT = 30000
const INIT_EXPIRE_CHECK_TIMEOUT = 5000

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
    const fioPlugin = account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO]

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
  setTimeout(() => dispatch(refreshNamesToCheckExpired()), INIT_EXPIRE_CHECK_TIMEOUT)
}

export const refreshNamesToCheckExpired = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  if (!account) return
  if (state.ui.fio.expireReminderShown) return

  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
  if (fioWallets.length === 0) {
    return setTimeout(() => dispatch(refreshNamesToCheckExpired()), EXPIRE_CHECK_TIMEOUT)
  }

  const { expiredLastChecks, expiredChecking, walletsCheckedForExpired } = state.ui.fio
  if (expiredChecking) return setTimeout(() => dispatch(refreshNamesToCheckExpired()), EXPIRE_CHECK_TIMEOUT)

  const walletsToCheck: EdgeCurrencyWallet[] = []
  for (const fioWallet of fioWallets) {
    if (!walletsCheckedForExpired[fioWallet.id]) {
      walletsToCheck.push(fioWallet)
    }
  }

  const namesToCheck: Array<FioAddress | FioDomain> = []
  const { fioAddresses, fioDomains, fioWalletsById } = await refreshFioNames(walletsToCheck)
  const fioNames = [...fioAddresses, ...fioDomains]
  for (const fioName of fioNames) {
    if (needToCheckExpired(expiredLastChecks, fioName.name)) {
      namesToCheck.push(fioName)
    }
  }

  if (namesToCheck.length !== 0) {
    dispatch({ type: 'FIO/CHECKING_EXPIRED', data: true })
    dispatch(checkExpiredFioNames(namesToCheck, fioWalletsById))
  }

  return setTimeout(() => dispatch(refreshNamesToCheckExpired()), EXPIRE_CHECK_TIMEOUT)
}

export const checkExpiredFioNames =
  (fioNames: Array<FioAddress | FioDomain>, fioWalletsById: { string: EdgeCurrencyWallet }) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core
    if (!account) return

    const expired: Array<FioAddress | FioDomain> = getExpiredSoonFioNames(fioNames)
    if (expired.length > 0) {
      const first: FioAddress | FioDomain = expired[0]
      const fioWallet: EdgeCurrencyWallet = fioWalletsById[first.walletId]
      await showFioExpiredModal(fioWallet, first)

      const expiredLastChecks = { ...state.ui.fio.expiredLastChecks }
      expiredLastChecks[first.name] = new Date()
      dispatch({ type: 'FIO/SET_LAST_EXPIRED_CHECKS', data: expiredLastChecks })
      dispatch({ type: 'FIO/EXPIRED_REMINDER_SHOWN', data: true })
      setFioExpiredCheckToDisklet(expiredLastChecks, state.core.disklet)
    }

    const walletsCheckedForExpired = { ...state.ui.fio.walletsCheckedForExpired }
    for (const walletId in fioWalletsById) {
      walletsCheckedForExpired[walletId] = true
    }
    dispatch({ type: 'FIO/WALLETS_CHECKED_FOR_EXPIRED', data: walletsCheckedForExpired })

    dispatch({ type: 'FIO/CHECKING_EXPIRED', data: false })
  }

const showFioExpiredModal = async (fioWallet: EdgeCurrencyWallet, fioName: FioAddress | FioDomain) => {
  const isAddress = fioName.name.indexOf(FIO_ADDRESS_DELIMITER) > 0
  const answer = await Airship.show(bridge => <FioExpiredModal bridge={bridge} fioName={fioName.name} isAddress={isAddress} />)

  if (answer) {
    if (isAddress) {
      Actions.push(FIO_ADDRESS_SETTINGS, {
        showRenew: true,
        fioWallet,
        fioAddressName: fioName.name,
        expiration: fioName.expiration
      })
      return
    }

    const typeHack: any = fioName
    Actions.push(FIO_DOMAIN_SETTINGS, {
      showRenew: true,
      fioWallet,
      fioDomainName: fioName.name,
      isPublic: typeHack.isPublic || false,
      expiration: fioName.expiration
    })
  }
}
