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
  const { type, data = {} } = action
  const { receiveAddress } = data
  switch (type) {
    case ACTION.UPDATE_RECEIVE_ADDRESS_SUCCESS:
      return receiveAddress
    default:
      return state
  }
}
