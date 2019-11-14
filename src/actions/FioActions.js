// @flow

import { type EdgeAccount } from 'edge-core-js/types'
import { Linking } from 'react-native'

import { showActivity, showError } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'

export function registerFioAddress () {
  return function (dispatch: Dispatch, getState: GetState) {
    const state = getState()
    const defaultFiat = state.ui.settings.defaultIsoFiat
    const { account } = state.core

    return showActivity(s.strings.preparing_fio_wallet, getFioAddress(account, defaultFiat)).then(fioAddress => {
      Linking.openURL(`https://giveaway.fio.foundation/?referrer=edge&fpk=${fioAddress}`)
    }, showError)
  }
}

/**
 * Creates a FIO wallet (if needed) and grabs an address.
 */
async function getFioAddress (account: EdgeAccount, defaultFiat: string) {
  // Create a FIO wallet, if needed:
  if (account.getFirstWalletInfo('wallet:fio') == null) {
    await account.createCurrencyWallet('wallet:fio', {
      name: s.strings.string_first_fio_wallet_name,
      fiatCurrencyCode: defaultFiat
    })
  }

  // Get the wallet info again (it should definitely exist now):
  const walletInfo = account.getFirstWalletInfo('wallet:fio')
  if (walletInfo == null) throw new Error('Problem loading FIO wallet')

  // Get the wallet object itself:
  const currencyWallet = await account.waitForCurrencyWallet(walletInfo.id)
  const address = await currencyWallet.getReceiveAddress()
  return address.publicAddress
}
