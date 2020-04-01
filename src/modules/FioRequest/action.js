// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showError } from '../../components/services/AirshipInstance'
import { LIMIT } from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes.js'
import { findWalletByFioAddress, getFioWallets } from '../UI/selectors'

const requestListPending = (fioRequestsPending: any, more = 0, page = 1) => ({
  type: 'FIO/FIO_REQUEST_LIST_PENDING',
  data: { fioRequestsPending, more, page }
})

const requestListSent = (fioRequestsSent: any, more = 0, page = 1) => ({
  type: 'FIO/FIO_REQUEST_LIST_SENT',
  data: { fioRequestsSent, more, page }
})

export const getFioRequestsPending = (page: number = 1) => (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState())
  dispatch(requestListPending([]))
  if (wallets != null) {
    wallets.forEach(wallet => {
      const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
      wallet.otherMethods.getFioAddresses().then(fioAddresses => {
        if (fioAddresses.length > 0) {
          wallet.otherMethods
            .fioAction('getPendingFioRequests', {
              fioPublicKey,
              limit: LIMIT,
              offset: (page - 1) * LIMIT
            })
            .then(({ requests, more }) => {
              if (requests) {
                dispatch(requestListPending(requests, more, page))
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            })
            .catch(() => {
              //
            })
        }
      })
    })
  }
}

export const getFioRequestsSent = (page: number = 1) => (dispatch: Dispatch, getState: GetState) => {
  const wallets = getFioWallets(getState())
  dispatch(requestListSent([]))
  if (wallets != null) {
    wallets.forEach(wallet => {
      const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
      wallet.otherMethods.getFioAddresses().then(fioAddresses => {
        if (fioAddresses.length > 0) {
          wallet.otherMethods
            .fioAction('getSentFioRequests', {
              fioPublicKey,
              limit: LIMIT,
              offset: (page - 1) * LIMIT
            })
            .then(fioRequestsSentRes => {
              if (fioRequestsSentRes) {
                dispatch(requestListSent(fioRequestsSentRes.requests, fioRequestsSentRes.more, page))
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            })
            .catch(() => {
              //
            })
        }
      })
    })
  }
}

export const confirmRequest = (
  fioWalletByAddress: EdgeCurrencyWallet,
  pendingRequest: Object,
  payerPublicAddress: string,
  txId: string,
  notes?: string = '',
  fee: number = 0,
  cb: Function
) => async () => {
  try {
    await fioWalletByAddress.otherMethods.fioAction('recordObtData', {
      fioRequestId: pendingRequest.fio_request_id,
      payerFioAddress: pendingRequest.payer_fio_address,
      payeeFioAddress: pendingRequest.payee_fio_address,
      payerPublicAddress: pendingRequest.payer_fio_public_key,
      payeePublicAddress: pendingRequest.content.payee_public_address,
      amount: pendingRequest.content.amount,
      tokenCode: pendingRequest.content.token_code,
      chainCode: pendingRequest.content.chain_code,
      obtId: txId,
      memo: pendingRequest.content.memo,
      maxFee: fee,
      tpid: '',
      status: 'sent_to_blockchain'
    })
    cb()
  } catch (e) {
    console.log(e)
    console.log(e.json)
    showError(s.strings.fio_confirm_request_error)
  }
}

export const rejectRequest = (fioRequestId: string, payerFioAddress: string, cb: Function) => async (dispatch: Dispatch, getState: GetState) => {
  const wallet = await findWalletByFioAddress(getState(), payerFioAddress)
  if (wallet != null) {
    try {
      const { fee } = await wallet.otherMethods.fioAction('getFeeForRejectFundsRequest', { payerFioAddress })
      if (fee) {
        return showError(`${s.strings.fio_no_bundled_err_title}. ${s.strings.fio_no_bundled_err_msg}`)
      }
      await wallet.otherMethods.fioAction('rejectFundsRequest', { fioRequestId: fioRequestId, payerFioAddress })
      cb()
    } catch (e) {
      showError(s.strings.fio_reject_request_error)
      cb(e)
    }
  } else {
    showError(s.strings.err_no_address_title)
    cb(s.strings.err_no_address_title)
  }
}
