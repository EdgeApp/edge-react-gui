// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'
import type { FioAddress } from '../../types/types'

export type FioAddressSceneState = {
  fioAddressName: string,
  fioAddresses: FioAddress[],
  fioAddressesLoading: boolean,
  selectedWallet: EdgeCurrencyWallet | null,
  expiration: Date,
  feeCollected: number,
  handleRegistrationInfo: {
    activationCost: number,
    supportedCurrencies: { [currencyCode: string]: boolean }
  },
  addressRegistrationPaymentInfo: {
    [currencyCode: string]: {
      amount: string,
      nativeAmount: string,
      address: string
    }
  },
  regInfoLoading: boolean,
  fioWalletByAddress: EdgeCurrencyWallet | null
}

export type BuyAddressResponse = {
  error: any,
  success: {
    charge: {
      pricing: {
        [currencyCode: string]: {
          amount: string,
          currency: string
        }
      },
      addresses: {
        [currencyCode: string]: string
      }
    }
  }
}

const initialState: FioAddressSceneState = {
  fioAddressName: '',
  fioAddresses: [],
  fioAddressesLoading: false,
  selectedWallet: null,
  expiration: new Date('2020-01-01T10:10:10Z'),
  feeCollected: 0,
  handleRegistrationInfo: {
    activationCost: 40,
    supportedCurrencies: {}
  },
  addressRegistrationPaymentInfo: {},
  regInfoLoading: false,
  fioWalletByAddress: null
}

export const fioAddress: Reducer<FioAddressSceneState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME':
      if (!action.data) throw new Error('Invalid action FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME')
      return {
        ...state,
        fioAddressName: action.data.fioAddressName
      }
    case 'FIO/FIO_ADDRESS_UPDATE_SELECTED_WALLET':
      if (!action.data) throw new Error('Invalid action FIO_ADDRESS_UPDATE_FIO_ADDRESS_NAME')
      return {
        ...state,
        selectedWallet: action.data.selectedWallet,
        expiration: new Date(action.data.expiration),
        feeCollected: action.data.feeCollected
      }
    case 'FIO/FIO_ADDRESS_SET_FIO_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO_ADDRESS_SET_FIO_ADDRESS`)
      return {
        ...state,
        fioAddressName: action.data.fioAddressName,
        expiration: new Date(action.data.expiration)
      }
    case 'FIO/SET_FIO_ADDRESSES_PROGRESS':
      return {
        ...state,
        fioAddressesLoading: true
      }
    case 'FIO/SET_FIO_ADDRESSES':
      if (!action.data) throw new Error(`Invalid action SET_FIO_ADDRESSES`)
      return {
        ...state,
        fioAddresses: action.data.fioAddresses,
        fioAddressesLoading: false
      }
    case 'FIO/SET_FIO_ADDRESS_REG_INFO':
      if (!action.data) throw new Error(`Invalid action addressRegistrationPaymentInfo`)
      return {
        ...state,
        addressRegistrationPaymentInfo: action.data.addressRegistrationPaymentInfo,
        handleRegistrationInfo: action.data.handleRegistrationInfo
      }
    case 'FIO/FIO_ADDRESS_REG_INFO_LOADING':
      return {
        ...state,
        regInfoLoading: action.data
      }
    case 'FIO/FIO_WALLET_BY_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO/FIO_WALLET_BY_ADDRESS`)
      return {
        ...state,
        fioWalletByAddress: action.data.wallet
      }
    default:
      return state
  }
}
