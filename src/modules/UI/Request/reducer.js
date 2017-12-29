import * as ACTION from './action'

const initialState = {
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

export const request = (state = initialState, action) => {
  let receiveAddress
  let amountSatoshi
  let amountFiat

  switch (action.type) {
  case ACTION.UPDATE_RECEIVE_ADDRESS_SUCCESS:
    receiveAddress = action.data.receiveAddress
    return {
      ...state,
      receiveAddress
    }
  case 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO':
    amountSatoshi = action.data.amountSatoshi
    return {
      ...state,
      receiveAddress: {
        ...state.receiveAddress,
        amountSatoshi
      }
    }
  case 'UPDATE_AMOUNT_REQUESTED_IN_FIAT':
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
  default:
    return state
  }
}
