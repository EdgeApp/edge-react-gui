import { EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import React from 'react'

import { FioExpiredModal } from '../components/modals/FioExpiredModal'
import { Airship } from '../components/services/AirshipInstance'
import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings'
import {
  addToFioAddressCache,
  getExpiredSoonFioDomains,
  getFioExpiredCheckFromDisklet,
  getFioObtData,
  needToCheckExpired,
  refreshConnectedWalletsForFioAddress,
  refreshFioNames,
  setFioExpiredCheckToDisklet
} from '../modules/FioAddress/util'
import { Dispatch, GetState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { FioDomain, FioObtRecord } from '../types/types'

const EXPIRE_CHECK_TIMEOUT = 30000
const INIT_EXPIRE_CHECK_TIMEOUT = 5000
const MAX_OBT_DATA_CHECKS = 15
let checkFioObtDataCounter = 0

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
  for (const fioWallet of fioWallets) {
    if (!getState().core.account.id) break
    const fioAddresses = await fioWallet.otherMethods.getFioAddressNames()
    for (const fioAddress of fioAddresses) {
      if (!getState().core.account.id) break
      // @ts-expect-error
      connectedWalletsByFioAddress[fioAddress] = await refreshConnectedWalletsForFioAddress(fioAddress, fioWallet, wallets)
      dispatch({
        type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
        data: {
          fioAddress,
          // @ts-expect-error
          ccWalletMap: connectedWalletsByFioAddress[fioAddress]
        }
      })
    }
  }
}

export function checkFioObtData(walletId: string, transactions: EdgeTransaction[]): ThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    if (checkFioObtDataCounter > MAX_OBT_DATA_CHECKS) return // to prevent loop if account does not have fio wallets
    const state = getState()
    const { account } = state.core
    const fioWallets = state.ui.wallets.fioWallets
    if (account == null || account.currencyConfig == null || fioWallets.length === 0) {
      checkFioObtDataCounter++
      return setTimeout(() => {
        dispatch(checkFioObtData(walletId, transactions))
      }, 400)
    }
    try {
      const fioPlugin = account.currencyConfig.fio
      const wallet = account.currencyWallets[walletId]

      const obtDataRecords = await getFioObtData(fioWallets)

      for (const transaction of transactions) {
        const edgeMetadata: EdgeMetadata = transaction.metadata != null ? transaction.metadata : { notes: '' }
        try {
          const { name } = edgeMetadata
          if (name && (await fioPlugin.otherMethods.isFioAddressValid(name))) {
            addToFioAddressCache(state.core.account, [name])
          }
        } catch (e: any) {
          //
        }
        const obtForTx: FioObtRecord | undefined = obtDataRecords.find(obtRecord => obtRecord.content.obt_id === transaction.txid)
        if (obtForTx == null) return

        if (edgeMetadata.notes == null) edgeMetadata.notes = ''
        let fioNotes = `${s.strings.fragment_transaction_list_sent_prefix}${s.strings.word_to_in_convert_from_to_string} ${obtForTx.payee_fio_address}`
        if (obtForTx.content.memo != null && obtForTx.content.memo !== '') fioNotes += `\n${s.strings.fio_sender_memo_label}: ${obtForTx.content.memo}`
        edgeMetadata.notes = `${fioNotes}\n${edgeMetadata.notes || ''}`
        edgeMetadata.name = obtForTx.payer_fio_address

        addToFioAddressCache(state.core.account, [obtForTx.payer_fio_address])

        try {
          await wallet.saveTxMetadata(transaction.txid, transaction.currencyCode, edgeMetadata)
        } catch (e: any) {
          console.log(e.message)
        }
      }
    } catch (e: any) {
      console.log(e)
    }
  }
}

export function expiredFioNamesCheckDates(navigation: NavigationBase): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const lastChecks = await getFioExpiredCheckFromDisklet(state.core.disklet)
    dispatch({ type: 'FIO/SET_LAST_EXPIRED_CHECKS', data: lastChecks })
    setTimeout(async () => dispatch(refreshNamesToCheckExpired(navigation)), INIT_EXPIRE_CHECK_TIMEOUT)
  }
}

function refreshNamesToCheckExpired(navigation: NavigationBase): ThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    if (!account) return
    if (state.ui.fio.expireReminderShown) return

    const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
    if (fioWallets.length === 0) {
      return setTimeout(async () => dispatch(refreshNamesToCheckExpired(navigation)), EXPIRE_CHECK_TIMEOUT)
    }

    const { expiredLastChecks, expiredChecking, walletsCheckedForExpired } = state.ui.fio
    if (expiredChecking) return setTimeout(async () => dispatch(refreshNamesToCheckExpired(navigation)), EXPIRE_CHECK_TIMEOUT)

    const walletsToCheck: EdgeCurrencyWallet[] = []
    for (const fioWallet of fioWallets) {
      if (!walletsCheckedForExpired[fioWallet.id]) {
        walletsToCheck.push(fioWallet)
      }
    }

    const namesToCheck: FioDomain[] = []
    const { fioDomains, fioWalletsById } = await refreshFioNames(walletsToCheck)
    for (const fioDomain of fioDomains) {
      if (needToCheckExpired(expiredLastChecks, fioDomain.name)) {
        namesToCheck.push(fioDomain)
      }
    }

    if (namesToCheck.length !== 0) {
      dispatch({ type: 'FIO/CHECKING_EXPIRED', data: true })
      dispatch(checkExpiredFioDomains(navigation, namesToCheck, fioWalletsById))
    }

    return setTimeout(async () => dispatch(refreshNamesToCheckExpired(navigation)), EXPIRE_CHECK_TIMEOUT)
  }
}

export function checkExpiredFioDomains(
  navigation: NavigationBase,
  fioDomains: FioDomain[],
  fioWalletsById: { [key: string]: EdgeCurrencyWallet }
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    if (!account) return

    const expired: FioDomain[] = getExpiredSoonFioDomains(fioDomains)
    if (expired.length > 0) {
      const first: FioDomain = expired[0]
      const fioWallet: EdgeCurrencyWallet = fioWalletsById[first.walletId]
      await showFioExpiredModal(navigation, fioWallet, first)

      const expiredLastChecks = { ...state.ui.fio.expiredLastChecks }
      expiredLastChecks[first.name] = new Date()
      dispatch({ type: 'FIO/SET_LAST_EXPIRED_CHECKS', data: expiredLastChecks })
      // @ts-expect-error
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
}

const showFioExpiredModal = async (navigation: NavigationBase, fioWallet: EdgeCurrencyWallet, fioDomain: FioDomain) => {
  const answer = await Airship.show<boolean>(bridge => <FioExpiredModal bridge={bridge} fioName={fioDomain.name} />)

  if (answer) {
    const { isPublic = false } = fioDomain
    navigation.push('fioDomainSettings', {
      showRenew: true,
      fioWallet,
      fioDomainName: fioDomain.name,
      isPublic,
      expiration: fioDomain.expiration
    })
  }
}
