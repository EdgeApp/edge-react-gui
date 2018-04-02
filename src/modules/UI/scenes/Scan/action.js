// @flow

import type { EdgeParsedUri } from 'edge-core-js'

const PREFIX = 'UI/Scan/'

export const TOGGLE_ENABLE_TORCH = 'TOGGLE_ENABLE_TORCH'
export const TOGGLE_ADDRESS_MODAL_VISIBILITY = 'TOGGLE_ADDRESS_MODAL_VISIBILITY'
export const UPDATE_RECIPIENT_ADDRESS = 'UPDATE_RECIPIENT_ADDRESS'
export const ENABLE_SCAN = 'ENABLE_SCAN'
export const DISABLE_SCAN = 'DISABLE_SCAN'

export const toggleEnableTorch = () => ({
  type: TOGGLE_ENABLE_TORCH
})

export const toggleAddressModal = () => ({
  type: TOGGLE_ADDRESS_MODAL_VISIBILITY
})

export const updateRecipientAddress = (data: Object) => ({
  type: UPDATE_RECIPIENT_ADDRESS,
  data
})

export const enableScan = () => {
  return {
    type: ENABLE_SCAN
  }
}

export const disableScan = () => {
  return {
    type: DISABLE_SCAN
  }
}

export const PRIVATE_KEY_SCANNED = PREFIX + 'PRIVATE_KEY_SCANNED'
export const privateKeyScanned = (parsedUri: EdgeParsedUri) => ({
  type: PRIVATE_KEY_SCANNED,
  data: { parsedUri }
})
