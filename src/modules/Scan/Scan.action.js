export const TOGGLE_ENABLE_TORCH = 'TOGGLE_ENABLE_TORCH'
export const TOGGLE_ADDRESS_MODAL_VISIBILITY = 'TOGGLE_ADDRESS_MODAL_VISIBILITY'
export const UPDATE_RECIPIENT_ADDRESS = 'UPDATE_RECIPIENT_ADDRESS'

export function toggleEnableTorch () {
  return {
    type: TOGGLE_ENABLE_TORCH
  }
}

export function toggleAddressModal() {
  return {
    type: TOGGLE_ADDRESS_MODAL_VISIBILITY
  }
}

export function updateRecipientAddress(data) {
  return {
    type: UPDATE_RECIPIENT_ADDRESS,
    data
  }
}
