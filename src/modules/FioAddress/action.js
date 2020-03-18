// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { Dispatch, GetState } from '../../types/reduxTypes'
import { getFioWallets } from '../UI/selectors'

export const refreshAllFioAddresses = (cb?: Function) => async (dispatch: Dispatch, getState: GetState) => {
  const wallets: EdgeCurrencyWallet[] = getFioWallets(getState())
  let fioAddresses = []

  dispatch({
    type: 'FIO/SET_FIO_ADDRESSES_PROGRESS'
  })

  if (wallets != null) {
    for (const wallet: EdgeCurrencyWallet of wallets) {
      const walletFioAddresses = await wallet.otherMethods.getFioAddresses()
      fioAddresses = [...fioAddresses, ...walletFioAddresses]
    }
  }

  dispatch({
    type: 'FIO/SET_FIO_ADDRESSES',
    data: { fioAddresses }
  })
  if (cb) cb()
}
