import * as ACTION from './action'

const newRequest = {
  receiveAddress: '',
  amountRequestedInCrypto: 0,
  amountReceivedInCrypto: 0
}

const request = (state = newRequest, action) => {
  return {
    receiveAddress: receiveAddress(state.receiveAddress, action),
    amountRequestedInCrypto: amountRequestedInCrypto(state.amountRequestedInCrypto, action),
    amountReceivedInCrypto: amountReceivedInCrypto(state.amountReceivedInCrypto, action)
  }
}

const receiveAddress = (state = '', action) => {
  switch (action.type) {
    case ACTION.ADD_RECEIVE_ADDRESS :
      return action.receiveAddress
    default:
      return state
  }
}

const amountRequestedInCrypto = (state = 0, action) => {
  switch (action.type) {
    case ACTION.UPDATE_AMOUNT_REQUESTED_IN_CRYPTO :
      return action.amountRequestedInCrypto
    default:
      return state
  }
}

const amountReceivedInCrypto = (state = 0, action) => {
  switch (action.type) {
    case ACTION.UPDATE_AMOUNT_RECEIVED_IN_CRYPTO :
      return action.amountReceivedInCrypto
    default:
      return state
  }
}

export default request
