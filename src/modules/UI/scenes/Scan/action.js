export const TOGGLE_ENABLE_TORCH = 'TOGGLE_ENABLE_TORCH'
export const TOGGLE_ADDRESS_MODAL_VISIBILITY = 'TOGGLE_ADDRESS_MODAL_VISIBILITY'
export const UPDATE_RECIPIENT_ADDRESS = 'UPDATE_RECIPIENT_ADDRESS'
export const UPDATE_URI_SUCCESS = 'UPDATE_URI_SUCCESS'

export const toggleEnableTorch = () => {
  return {
    type: TOGGLE_ENABLE_TORCH
  }
}

export const toggleAddressModal = () => {
  return {
    type: TOGGLE_ADDRESS_MODAL_VISIBILITY
  }
}

export const updateRecipientAddress = data => {
  return {
    type: UPDATE_RECIPIENT_ADDRESS,
    data
  }
}

export const updateUri = data => {
  return (dispatch, getState) => {
    const { data: uri } = data
    const { account } = getState()
    account.parseUri = uri => { return { uri } }
    const parsedUri = account.parseUri(uri)

    dispatch(updateUriSuccess(parsedUri))
  }
}

export const updateUriSuccess = uri => {
  console.log('uri', uri)
  return {
    type: UPDATE_URI_SUCCESS,
    data: { uri }
  }
}
