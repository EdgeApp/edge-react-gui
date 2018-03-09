// @flow
import * as ACTION from './action'
import type { Action } from '../../../ReduxTypes.js'
import * as Constants from '../../../../constants/indexConstants.js'

export type SceneRequestState = {
  inputCurrencySelected: string,
  receiveAddress: {
    publicAddress: string,
    amountSatoshi: number,
    metadata: {
      payeeName?: string,
      category?: string,
      notes?: string,
      amountFiat?: number,
      bizId?: string | null,
      miscJson?: string
    }
  }
}
const initialState: SceneRequestState = {
  inputCurrencySelected: 'fiat',
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

export const request = (state: SceneRequestState = initialState, action: Action): SceneRequestState => {
  switch (action.type) {
    case Constants.UPDATE_RECEIVE_ADDRESS_SUCCESS: {
      if (!action.data) {
        return state
      }
      return {
        ...state,
        receiveAddress: action.data.receiveAddress
      }
    }

    case ACTION.UPDATE_INPUT_CURRENCY_SELECTED: {
      if (!action.data) {
        return state
      }
      return {
        ...state,
        inputCurrencySelected: action.data.inputCurrencySelected
      }
    }

    case ACTION.UPDATE_AMOUNT_REQUESTED_IN_CRYPTO: {
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

    case ACTION.UPDATE_METADATA: {
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

    case ACTION.UPDATE_AMOUNT_REQUESTED_IN_FIAT: {
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

export default request
