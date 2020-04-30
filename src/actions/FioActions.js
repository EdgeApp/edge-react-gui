// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

import { FIO_WALLET_TYPE } from '../constants/WalletAndCurrencyConstants'
import { refreshConnectedWalletsForFioAddress } from '../modules/FioAddress/util'
import type { Dispatch } from '../types/reduxTypes.js'

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
