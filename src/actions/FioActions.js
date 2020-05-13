// @flow

import type { EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'

import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings'
import { getFioObtData, refreshConnectedWalletsForFioAddress } from '../modules/FioAddress/util'
import { getFioWallets, getWalletLoadingPercent } from '../modules/UI/selectors'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import type { FioObtRecord } from '../types/types'

export const refreshConnectedWallets = async (dispatch: Dispatch, currencyWallets: { [walletId: string]: EdgeCurrencyWallet }) => {
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
    const fioAddresses = await fioWallet.otherMethods.getFioAddressNames()
    for (const fioAddress: string of fioAddresses) {
      connectedWalletsByFioAddress[fioAddress] = await refreshConnectedWalletsForFioAddress(fioAddress, fioWallet, wallets)
    }
  }

  dispatch({
    type: 'FIO/UPDATE_CONNECTED_WALLETS',
    data: {
      connectedWalletsByFioAddress
    }
  })
}

export const checkFioObtData = (walletId: string, transactions: EdgeTransaction[]) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const progressPercentage = getWalletLoadingPercent(state)
  if (progressPercentage < 100) {
    setTimeout(() => {
      dispatch(checkFioObtData(walletId, transactions))
    }, 400)
    return
  }
  const wallets = state.core.account.currencyWallets
  const fioWallets = getFioWallets(state)

  const wallet = wallets[walletId]
  const obtDataRecords = await getFioObtData(fioWallets)
  dispatch({
    type: 'FIO/SET_OBT_DATA',
    data: obtDataRecords
  })

  for (const transaction: EdgeTransaction of transactions) {
    const edgeMetadata: EdgeMetadata = transaction.metadata || { notes: '' }
    const obtForTx: FioObtRecord | void = obtDataRecords.find(obtRecord => obtRecord.content.obt_id === transaction.txid)
    if (!obtForTx) return
    if (!edgeMetadata.notes) edgeMetadata.notes = ''
    edgeMetadata.notes += `${edgeMetadata.notes.length ? '\n' : ''}${s.strings.fragment_transaction_list_sent_prefix}${
      s.strings.word_to_in_convert_from_to_string
    } ${obtForTx.payee_fio_address}`
    if (obtForTx.content.memo) edgeMetadata.notes += `\n${obtForTx.content.memo}`
    edgeMetadata.name = obtForTx.payer_fio_address
    try {
      await wallet.saveTxMetadata(transaction.txid, transaction.currencyCode, edgeMetadata)
    } catch (e) {
      //
      console.log(e.message)
    }
  }
}

export const refreshFioObtData = () => async (dispatch: Dispatch, getState: GetState) => {
  try {
    const fioWallets = getFioWallets(getState())
    const obtDataRecords = await getFioObtData(fioWallets)
    dispatch({
      type: 'FIO/SET_OBT_DATA',
      data: obtDataRecords
    })
  } catch (e) {
    //
  }
}
