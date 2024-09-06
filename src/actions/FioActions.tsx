import { EdgeAccount, EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import React from 'react'
import { sprintf } from 'sprintf-js'

import { FioExpiredModal } from '../components/modals/FioExpiredModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { Dispatch, GetState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { FioAddress, FioDomain, FioObtRecord } from '../types/types'
import { addToFioAddressCache, getFioObtData, refreshConnectedWalletsForFioAddress } from '../util/FioAddressUtils'
import { snooze } from '../util/utils'

const MAX_OBT_DATA_CHECKS = 15

export const refreshConnectedWallets = async (dispatch: Dispatch, getState: GetState) => {
  const wallets: EdgeCurrencyWallet[] = []
  const fioWallets: EdgeCurrencyWallet[] = getState().ui.wallets.fioWallets
  const currencyWallets = getState().core.account.currencyWallets
  for (const walletId of Object.keys(currencyWallets)) {
    wallets.push(currencyWallets[walletId])
  }

  for (const fioWallet of fioWallets) {
    if (!getState().core.account.id) break
    const fioAddresses: FioAddress[] = await fioWallet.otherMethods.fetchFioAddresses()
    const fioAddressNames = fioAddresses.map(fioAddress => fioAddress.name)
    for (const fioAddressName of fioAddressNames) {
      if (!getState().core.account.id) break
      const ccWalletMap = await refreshConnectedWalletsForFioAddress(fioAddressName, fioWallet, wallets)
      dispatch({
        type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
        data: {
          fioAddress: fioAddressName,
          ccWalletMap
        }
      })
    }
  }
}

export function checkFioObtData(wallet: EdgeCurrencyWallet, transactions: EdgeTransaction[]): ThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    const state = getState()
    let account: EdgeAccount
    let fioWallets: EdgeCurrencyWallet[]

    // Loop until the account and wallets appear (the app may not have loaded them yet):
    let loopCount = 0
    while (true) {
      account = state.core.account
      fioWallets = state.ui.wallets.fioWallets
      if (account != null && account.currencyConfig != null && fioWallets.length > 0) break
      if (loopCount++ > MAX_OBT_DATA_CHECKS) return
      await snooze(400)
    }

    try {
      const fioPlugin = account.currencyConfig.fio

      const obtDataRecords = await getFioObtData(fioWallets)

      for (const transaction of transactions) {
        const { tokenId } = transaction
        const edgeMetadata: EdgeMetadata = transaction.metadata != null ? transaction.metadata : { notes: '' }
        try {
          const { name } = edgeMetadata
          if (name && (await fioPlugin.otherMethods.isFioAddressValid(name))) {
            await addToFioAddressCache(state.core.account, [name])
          }
        } catch (err: any) {
          console.warn(err)
        }
        const obtForTx: FioObtRecord | undefined = obtDataRecords.find(obtRecord => obtRecord.content.obt_id === transaction.txid)
        if (obtForTx == null) return

        if (edgeMetadata.notes == null) edgeMetadata.notes = ''
        let fioNotes = sprintf(lstrings.transaction_sent_1s, `${lstrings.word_to_in_convert_from_to_string} ${obtForTx.payee_fio_address}`)
        if (obtForTx.content.memo != null && obtForTx.content.memo !== '') fioNotes += `\n${lstrings.fio_sender_memo_label}: ${obtForTx.content.memo}`
        edgeMetadata.notes = `${fioNotes}\n${edgeMetadata.notes || ''}`
        edgeMetadata.name = obtForTx.payer_fio_address

        await addToFioAddressCache(state.core.account, [obtForTx.payer_fio_address])

        try {
          await wallet.saveTxMetadata({ txid: transaction.txid, tokenId, metadata: edgeMetadata })
        } catch (err: any) {
          console.warn(err)
        }
      }
    } catch (err: any) {
      console.warn(err)
    }
  }
}

export const showFioExpiredModal = async (navigation: NavigationBase, fioWallet: EdgeCurrencyWallet, fioDomain: FioDomain) => {
  const answer = await Airship.show<boolean>(bridge => <FioExpiredModal bridge={bridge} fioName={fioDomain.name} />)

  if (answer) {
    const { isPublic = false } = fioDomain
    navigation.push('fioDomainSettings', {
      showRenew: true,
      walletId: fioWallet.id,
      fioDomainName: fioDomain.name,
      isPublic,
      expiration: fioDomain.expiration
    })
  }
}
