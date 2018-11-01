// @flow

import { type Reducer } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'
import type { GuiReceiveAddress } from '../../types.js'

export type RequestSceneState = {
  inputCurrencySelected: string,
  receiveAddress: GuiReceiveAddress
}

const receiveAddress: GuiReceiveAddress = {
  publicAddress: '',
  nativeAmount: '0',
  metadata: {}
}

const initialState: RequestSceneState = {
  inputCurrencySelected: 'fiat',
  receiveAddress
}

export const request: Reducer<RequestSceneState, Action> = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'UPDATE_RECEIVE_ADDRESS_SUCCESS': {
      if (!action.data) {
        return state
      }
      return {
        ...state,
        receiveAddress: action.data.receiveAddress
      }
    }

    case 'UPDATE_INPUT_CURRENCY_SELECTED': {
      if (!action.data) {
        return state
      }
      return {
        ...state,
        inputCurrencySelected: action.data.inputCurrencySelected
      }
    }

    case 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO': {
      const { receiveAddress } = state
      if (!action.data) {
        return state
      }
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          amountSatoshi: action.data.amountRequestedInCrypto
        }
      }
    }

    case 'UPDATE_METADATA': {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata
        }
      }
    }

    case 'UPDATE_AMOUNT_REQUESTED_IN_FIAT': {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      if (!action.data) {
        return state
      }
      const amountFiat = action.data.amountRequestedInFiat

      // console.log('update fiat')
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata: {
            ...metadata,
            amountFiat: amountFiat
          }
        }
      }
    }

    default:
      return state
  }
}
