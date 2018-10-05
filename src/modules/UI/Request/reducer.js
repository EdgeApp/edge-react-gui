// @flow

import type { Action } from '../../ReduxTypes.js'

export type RequestState = {
  receiveAddress: {
    publicAddress: string,
    amountSatoshi: number,
    metadata: {
      payeeName: string,
      category: string,
      notes: string,
      amountFiat: number,
      bizId: null,
      miscJson: string
    }
  }
}

const initialState: RequestState = {
  receiveAddress: {
    publicAddress: '',
    amountSatoshi: 0,
    metadata: {
      payeeName: '',
      category: '',
      notes: '',
      amountFiat: 0,
      bizId: null,
      miscJson: ''
    }
  }
}

export const request = (state: RequestState = initialState, action: Action): RequestState => {
  let receiveAddress
  let amountSatoshi
  let amountFiat

  switch (action.type) {
    case 'UPDATE_RECEIVE_ADDRESS_SUCCESS': {
      if (!action.data) throw new Error('Invalid action')
      receiveAddress = action.data.receiveAddress
      return {
        ...state,
        receiveAddress
      }
    }

    case 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO': {
      if (!action.data) throw new Error('Invalid action')
      amountSatoshi = action.data.amountSatoshi
      return {
        ...state,
        receiveAddress: {
          ...state.receiveAddress,
          amountSatoshi
        }
      }
    }

    case 'UPDATE_AMOUNT_REQUESTED_IN_FIAT': {
      if (!action.data) throw new Error('Invalid action')
      amountFiat = action.data.amountFiat
      return {
        ...state,
        receiveAddress: {
          ...state.receiveAddress,
          metadata: {
            ...state.receiveAddress.metadata,
            amountFiat
          }
        }
      }
    }

    default:
      return state
  }
}
