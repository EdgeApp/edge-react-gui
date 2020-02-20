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
  feeCollected: number
}

const initialState: FioAddressSceneState = {
  fioAddressName: '',
  fioAddresses: [],
  fioAddressesLoading: false,
  selectedWallet: null,
  expiration: new Date('1/1/2019'),
  feeCollected: 0
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
    default:
      return state
  }
}
