import * as ACTION from './action'

const initialState = {
  receiveAddress: {
    publicAddress: '',
    amountSatoshi: 0,
    inputCurrencySelected: 'fiat',    
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

export default request = (state = initialState, action) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPDATE_RECEIVE_ADDRESS_SUCCESS: {
      const { receiveAddress } = data
      return {
        ...state,
        receiveAddress
      }
    }

    case ACTION.UPDATE_INPUT_CURRENCY_SELECTED: 
      const {inputCurrencySelected} = data
      return {
        ...state,
        inputCurrencySelected
      }

    case ACTION.UPDATE_PUBLIC_ADDRESS: {
      const { receiveAddress } = state
      const { publicAddress = '' } = data
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          publicAddress
        }
      }
    }

    case ACTION.UPDATE_AMOUNT_REQUESTED_IN_CRYPTO: {
      const { receiveAddress } = state
      const amountSatoshi = data.amountRequestedInCrypto
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          amountSatoshi
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

    case ACTION.UPDATE_PAYEE_NAME: {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      const { payeeName = '' } = metadata
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata: {
            ...metadata,
            payeeName
          }
        }
      }
    }

    case ACTION.UPDATE_CATEGORY: {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      const { category = '' } = metadata
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata: {
            ...metadata,
            category
          }
        }
      }
    }

    case ACTION.UPDATE_NOTES: {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      const { notes = '' } = metadata
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata: {
            ...metadata,
            notes
          }
        }
      }
    }

    case ACTION.UPDATE_AMOUNT_REQUESTED_IN_FIAT: {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      const amountFiat = data.amountRequestedInFiat

      console.log('update fiat')
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata: {
            ...metadata,
            amountFiat
          }
        }
      }
    }

    case ACTION.UPDATE_BIZ_ID: {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      const { bizId = null } = metadata
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata: {
            ...metadata,
            bizId
          }
        }
      }
    }

    case ACTION.UPDATE_MISC_JSON: {
      const { receiveAddress } = state
      const { metadata = {} } = receiveAddress
      const { miscJson = '' } = metadata
      return {
        ...state,
        receiveAddress: {
          ...receiveAddress,
          metadata: {
            ...metadata,
            miscJson
          }
        }
      }
    }

    default:
      return state
  }
}
