// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { type Reducer } from 'redux'

import type { Action } from '../../types/reduxTypes.js'

export type FioAddressSceneState = {
  fioAddressName: string,
  fioAddresses: string[],
  selectedWallet: EdgeCurrencyWallet | null,
  expiration: Date,
  fee_collected: number
}

const initialState: FioAddressSceneState = {
  fioAddressName: '',
  fioAddresses: [],
  selectedWallet: null,
  expiration: new Date('1/1/2019'),
  fee_collected: 0
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
        fee_collected: action.data.fee_collected
      }
    case 'FIO/FIO_ADDRESS_SET_FIO_ADDRESS':
      if (!action.data) throw new Error(`Invalid action FIO_ADDRESS_SET_FIO_ADDRESS`)
      return {
        ...state,
        fioAddressName: action.data.fioAddressName,
        expiration: new Date(action.data.expiration)
      }
    default:
      return state
  }
}
