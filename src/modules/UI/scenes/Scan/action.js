// @flow

import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import type { EdgeParsedUri } from 'edge-core-js'

import * as Constants from '../../../../constants/indexConstants.js'
import type { Dispatch, GetState } from '../../../ReduxTypes.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as UTILS from '../../../utils.js'
import { loginWithEdge } from '../../../../actions/EdgeLoginActions.js'
import { updateParsedURI } from '../SendConfirmation/action.js'
import s from '../../../../locales/strings.js'

import { activated as legacyAddressModalActivated, deactivated as legacyAddressModalDeactivated } from './LegacyAddressModal/LegacyAddressModalActions.js'

export const PREFIX = 'SCAN/'

export const UPDATE_RECIPIENT_ADDRESS = 'UPDATE_RECIPIENT_ADDRESS'

export const TOGGLE_ENABLE_TORCH = 'TOGGLE_ENABLE_TORCH'
export const toggleEnableTorch = () => ({
  type: TOGGLE_ENABLE_TORCH
})

export const TOGGLE_ADDRESS_MODAL_VISIBILITY = 'TOGGLE_ADDRESS_MODAL_VISIBILITY'
export const toggleAddressModal = () => ({
  type: TOGGLE_ADDRESS_MODAL_VISIBILITY
})

export const ENABLE_SCAN = 'ENABLE_SCAN'
export const enableScan = () => {
  return {
    type: ENABLE_SCAN
  }
}

export const DISABLE_SCAN = 'DISABLE_SCAN'
export const disableScan = () => {
  return {
    type: DISABLE_SCAN
  }
}

export const PARSE_URI_SUCCEEDED = 'PARSE_URI_SUCCEEDED'
export const parseUriSucceeded = (parsedUri: EdgeParsedUri) => ({
  type: PARSE_URI_SUCCEEDED,
  data: { parsedUri }
})

export const PARSE_URI_FAILED = 'PARSE_URI_FAILED'
export const parseUriFailed = (error: Error) => ({
  type: PARSE_URI_FAILED,
  data: { error }
})

export const PARSE_URI_RESET = 'PARSE_URI_RESET'
export const parseUriReset = () => ({
  type: PARSE_URI_RESET
})

export const parseUri = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const edgeWallet = state.core.wallets.byId[state.ui.wallets.selectedWalletId]
  const guiWallet = state.ui.wallets.byId[state.ui.wallets.selectedWalletId]
  if (/^airbitz:\/\/edge\//.test(data)) {
    // EDGE LOGIN
    dispatch(loginWithEdge(data))
    Actions[Constants.EDGE_LOGIN]()
    return
  }

  let parsedUri
  try {
    parsedUri = WALLET_API.parseURI(edgeWallet, data)
    dispatch(parseUriSucceeded(parsedUri))

    if (parsedUri.token) {
      // TOKEN
      const { contractAddress, currencyName, multiplier } = parsedUri.token
      const currencyCode = parsedUri.token.currencyCode.toUpperCase()
      const wallet = guiWallet
      const walletId = guiWallet.id
      let decimalPlaces = 18
      if (parsedUri.token && parsedUri.token.multiplier) {
        decimalPlaces = UTILS.denominationToDecimalPlaces(parsedUri.token.multiplier)
      }
      const parameters = {
        contractAddress,
        currencyCode,
        currencyName,
        multiplier,
        decimalPlaces,
        walletId,
        wallet,
        onAddToken: UTILS.noOp
      }
      Actions.addToken(parameters)
    } else if (parsedUri.legacyAddress) {
      // LEGACY ADDRESS
      setTimeout(() => dispatch(legacyAddressModalActivated()), 1000)
      return
    } else {
      // PUBLIC ADDRESS
      dispatch(updateParsedURI(parsedUri))
      Actions.sendConfirmation('fromScan')
    }
  } catch (error) {
    dispatch(disableScan())
    Alert.alert(s.strings.fragment_send_send_bitcoin_unscannable, error.toString(), [{ text: s.strings.string_ok, onPress: () => dispatch(enableScan()) }])
  }
}

export const qrCodeScanned = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const isScanEnabled = state.ui.scenes.scan.scanEnabled
  if (!isScanEnabled) return

  dispatch(disableScan())
  dispatch(parseUri(data))
}

export const addressModalDoneButtonPressed = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(parseUri(data))
}

export const addressModalCancelButtonPressed = () => (dispatch: Dispatch, getState: GetState) => {
  // dispatch(addressModalDeactivated())
}

export const legacyAddressModalContinueButtonPressed = () => (dispatch: Dispatch, getState: GetState) => {
  dispatch(legacyAddressModalDeactivated())
  dispatch(enableScan())

  const state = getState()
  const parsedUri = state.ui.scenes.scan.parsedUri
  if (!parsedUri) return

  dispatch(updateParsedURI(parsedUri))
  Actions.sendConfirmation('fromScan')
}

export const legacyAddressModalCancelButtonPressed = () => (dispatch: Dispatch) => {
  dispatch(legacyAddressModalDeactivated())
  dispatch(enableScan())
}
