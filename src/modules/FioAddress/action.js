// @flow
import { bns } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { createCurrencyWallet } from '../../actions/CreateWalletActions'
import { showError } from '../../components/services/AirshipInstance'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes'
import type { FioDomain } from '../../types/types'
import { truncateDecimals } from '../../util/utils'
import { getDefaultIsoFiat, getDisplayDenomination, getExchangeDenomination } from '../Settings/selectors'
import { getFioWallets } from '../UI/selectors'
import type { BuyAddressResponse } from './reducer'
import { findWalletByFioAddress, refreshConnectedWalletsForFioAddress } from './util'

export const createFioWallet = () => (dispatch: Dispatch, getState: GetState): Promise<EdgeCurrencyWallet | any> => {
  const fiatCurrencyCode = getDefaultIsoFiat(getState())
  return dispatch(createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, Constants.FIO_WALLET_TYPE, fiatCurrencyCode, false, false))
}

export const refreshAllFioAddresses = () => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({
    type: 'FIO/SET_FIO_ADDRESSES_PROGRESS'
  })
  const state = getState()
  const { currencyWallets = {} } = state.core.account
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  let fioAddresses = []
  let fioDomains = []

  if (fioWallets != null) {
    for (const wallet of fioWallets) {
      const walletId = wallet.id
      const walletFioAddresses = await wallet.otherMethods.getFioAddresses()
      fioAddresses = [...fioAddresses, ...walletFioAddresses]
      const walletFioDomains = await wallet.otherMethods.getFioDomains()
      fioDomains = [...fioDomains, ...walletFioDomains.map(({ name, expiration, isPublic }) => ({ name, expiration, isPublic, walletId }))]
    }
  }

  window.requestAnimationFrame(() => {
    dispatch({
      type: 'FIO/SET_FIO_ADDRESSES',
      data: { fioAddresses }
    })
    dispatch({
      type: 'FIO/SET_FIO_DOMAINS',
      data: { fioDomains }
    })
  })

  const { connectedWalletsByFioAddress } = state.ui.fio
  const wallets = Object.keys(currencyWallets).map(walletKey => currencyWallets[walletKey])
  for (const { name } of fioAddresses) {
    if (!connectedWalletsByFioAddress[name]) {
      const fioWallet = await findWalletByFioAddress(fioWallets, name)
      if (!fioWallet) continue
      const ccWalletMap = await refreshConnectedWalletsForFioAddress(name, fioWallet, wallets)
      dispatch({
        type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
        data: {
          fioAddress: name,
          ccWalletMap
        }
      })
    }
  }
}

export const getRegInfo = (fioAddress: string, selectedWallet: EdgeCurrencyWallet, selectedDomain: FioDomain) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const { account } = state.core
  const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]
  const displayDenomination = getDisplayDenomination(state, Constants.FIO_STR)

  let activationCost = 0

  dispatch({
    type: 'FIO/FIO_ADDRESS_REG_INFO_LOADING',
    data: true
  })

  try {
    const fee = await selectedWallet.otherMethods.getFee('registerFioAddress')
    activationCost = parseFloat(truncateDecimals(bns.div(`${fee}`, displayDenomination.multiplier, 18), 6))
  } catch (e) {
    showError(s.strings.fio_get_fee_err_msg)
  }

  if (selectedDomain.name !== Constants.FIO_DOMAIN_DEFAULT.name) {
    dispatch({
      type: 'FIO/SET_FIO_ADDRESS_REG_INFO',
      data: {
        handleRegistrationInfo: {
          activationCost,
          supportedCurrencies: { [Constants.FIO_STR]: true }
        },
        addressRegistrationPaymentInfo: {
          [Constants.FIO_STR]: {
            amount: `${activationCost}`,
            nativeAmount: '',
            address: ''
          }
        }
      }
    })
    dispatch({
      type: 'FIO/FIO_ADDRESS_REG_INFO_LOADING',
      data: false
    })
    return
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
