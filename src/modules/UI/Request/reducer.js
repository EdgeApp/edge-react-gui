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
  const {type, data = {} } = action
  const {receiveAddress, amountSatoshi, amountFiat} = data
  switch (type) {
  case ACTION.UPDATE_RECEIVE_ADDRESS_SUCCESS:
    return {
      ...state,
      receiveAddress
    }
  case 'UPDATE_AMOUNT_REQUESTED_IN_CRYPTO':
    return {
      ...state,
      receiveAddress: {
        ...state.receiveAddress,
        amountSatoshi
      }
    }
  case 'UPDATE_AMOUNT_REQUESTED_IN_FIAT':
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
