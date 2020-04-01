// @flow
import { bns } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { showError } from '../../components/services/AirshipInstance'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes'
import { getAccount } from '../Core/selectors'
import { getExchangeDenomination } from '../Settings/selectors'
import { getFioWallets } from '../UI/selectors'
import type { BuyAddressResponse } from './reducer'

export const setFioWalletByFioAddress = (fioAddressToUse: string) => async (dispatch: Dispatch, getState: GetState) => {
  const wallets: EdgeCurrencyWallet[] = getFioWallets(getState())
  const fioAddress = fioAddressToUse.toLowerCase()
  if (wallets != null) {
    for (const wallet: EdgeCurrencyWallet of wallets) {
      const fioAddresses: string[] = await wallet.otherMethods.getFioAddressNames()
      if (fioAddresses.length > 0) {
        for (const address of fioAddresses) {
          if (address.toLowerCase() === fioAddress) {
            return dispatch({
              type: 'FIO/FIO_WALLET_BY_ADDRESS',
              data: { wallet }
            })
          }
        }
      }
    }
  } else {
    return dispatch({
      type: 'FIO/FIO_WALLET_BY_ADDRESS',
      data: { wallet: null }
    })
  }
}

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

export const getRegInfo = (fioAddress: string, selectedWallet: EdgeCurrencyWallet) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = getAccount(state)
  const currencyPluginName = Constants.CURRENCY_PLUGIN_NAMES[Constants.FIO_STR]
  const fioPlugin = account.currencyConfig[currencyPluginName]

  let activationCost = 0

  dispatch({
    type: 'FIO/FIO_ADDRESS_REG_INFO_LOADING',
    data: true
  })

  try {
    const fee = await selectedWallet.otherMethods.getFee('registerFioAddress')
    activationCost = fee / Constants.BILLION
  } catch (e) {
    showError(s.strings.fio_get_fee_err_msg)
  }

  try {
    const buyAddressResponse: BuyAddressResponse = await fioPlugin.otherMethods.buyAddressRequest({
      address: fioAddress,
      referralCode: 'edge',
      publicKey: selectedWallet.publicWalletInfo.keys.publicKey
    })

    if (buyAddressResponse.error) {
      console.log(buyAddressResponse.error)
      showError(s.strings.fio_get_reg_info_err_msg)
    }

    if (buyAddressResponse.success) {
      const supportedCurrencies = { [Constants.FIO_STR]: true }
      const paymentInfo = {
        [Constants.FIO_STR]: {
          amount: `${activationCost}`,
          nativeAmount: '',
          address: ''
        }
      }

      for (const currencyKey in buyAddressResponse.success.charge.pricing) {
        const currencyCode = buyAddressResponse.success.charge.pricing[currencyKey].currency
        supportedCurrencies[currencyCode] = true

        const exchangeDenomination = getExchangeDenomination(state, currencyCode)
        let nativeAmount = bns.mul(buyAddressResponse.success.charge.pricing[currencyKey].amount, exchangeDenomination.multiplier)
        nativeAmount = bns.toFixed(nativeAmount, 0, 0)

        paymentInfo[currencyCode] = {
          amount: buyAddressResponse.success.charge.pricing[currencyKey].amount,
          nativeAmount,
          address: buyAddressResponse.success.charge.addresses[currencyKey]
        }
      }

      dispatch({
        type: 'FIO/SET_FIO_ADDRESS_REG_INFO',
        data: { handleRegistrationInfo: { activationCost, supportedCurrencies }, addressRegistrationPaymentInfo: paymentInfo }
      })
    }
  } catch (e) {
    console.log(e)
    showError(s.strings.fio_get_reg_info_err_msg)
  }

  dispatch({
    type: 'FIO/FIO_ADDRESS_REG_INFO_LOADING',
    data: false
  })
}
