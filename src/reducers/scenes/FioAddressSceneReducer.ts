import { Reducer } from 'redux'

import { Action } from '../../types/reduxTypes'
import { FioAddress, FioDomain } from '../../types/types'

export interface FioAddressSceneState {
  fioAddresses: FioAddress[]
  fioDomains: FioDomain[]
  fioAddressesLoading: boolean
}

const initialState: FioAddressSceneState = {
  fioAddresses: [],
  fioDomains: [],
  fioAddressesLoading: false
}

export const fioAddress: Reducer<FioAddressSceneState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'FIO/SET_FIO_ADDRESSES_PROGRESS':
      return {
        ...state,
        fioAddressesLoading: true
      }
    case 'FIO/SET_FIO_ADDRESSES':
      return {
        ...state,
        fioAddresses: action.data.fioAddresses,
        fioAddressesLoading: false
      }
    case 'FIO/SET_FIO_DOMAINS':
      return {
        ...state,
        fioDomains: action.data.fioDomains
      }
    default:
      return state
  }
}
