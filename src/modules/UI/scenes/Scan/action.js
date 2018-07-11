// @flow

import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import type { EdgeParsedUri } from 'edge-core-js'

import * as Constants from '../../../../constants/indexConstants.js'
import type { Dispatch, GetState } from '../../../ReduxTypes.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import { isEdgeLogin, denominationToDecimalPlaces, noOp } from '../../../utils.js'
import { loginWithEdge } from '../../../../actions/EdgeLoginActions.js'
import { updateParsedURI, paymentProtocolUriReceived } from '../SendConfirmation/action.js'
import s from '../../../../locales/strings.js'

import { activated as legacyAddressModalActivated, deactivated as legacyAddressModalDeactivated } from './LegacyAddressModal/LegacyAddressModalActions.js'
import { activated as privateKeyModalActivated } from './PrivateKeyModal/PrivateKeyModalActions.js'

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
  if (!data) return
  const state = getState()
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const edgeWallet = state.core.wallets.byId[selectedWalletId]
  const guiWallet = state.ui.wallets.byId[selectedWalletId]
  if (isEdgeLogin(data)) {
    // EDGE LOGIN
    dispatch(loginWithEdge(data))
    Actions[Constants.EDGE_LOGIN]()
    return
  }

  WALLET_API.parseUri(edgeWallet, data).then(
    (parsedUri: EdgeParsedUri) => {
      dispatch(parseUriSucceeded(parsedUri))

      if (parsedUri.token) {
        // TOKEN URI
        const { contractAddress, currencyName, multiplier } = parsedUri.token
        const currencyCode = parsedUri.token.currencyCode.toUpperCase()
        let decimalPlaces = 18
        if (parsedUri.token && parsedUri.token.multiplier) {
          decimalPlaces = denominationToDecimalPlaces(parsedUri.token.multiplier)
        }
        const parameters = {
          contractAddress,
          currencyCode,
          currencyName,
          multiplier,
          decimalPlaces,
          walletId: selectedWalletId,
          wallet: guiWallet,
          onAddToken: noOp
        }
        return Actions.addToken(parameters)
      }

      if (isLegacyAddressUri(parsedUri)) {
        // LEGACY ADDRESS URI
        return dispatch(legacyAddressModalActivated())
      }

      if (isPrivateKeyUri(parsedUri)) {
        // PRIVATE KEY URI
        return dispatch(privateKeyModalActivated())
      }

      if (isPaymentProtocolUri(parsedUri)) {
        // BIP70 URI
        // $FlowFixMe
        return dispatch(paymentProtocolUriReceived(parsedUri))
      }

      // PUBLIC ADDRESS URI
      dispatch(updateParsedURI(parsedUri))
      return Actions.sendConfirmation('fromScan')
    },
    () => {
      // INVALID URI
      dispatch(disableScan())
      setTimeout(
        () =>
          Alert.alert(s.strings.scan_invalid_address_error_title, s.strings.scan_invalid_address_error_description, [
            { text: s.strings.string_ok, onPress: () => dispatch(enableScan()) }
          ]),
        500
      )
    }
  )
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

export const isTokenUri = (parsedUri: EdgeParsedUri): boolean => {
  return !!parsedUri.token
}

export const isLegacyAddressUri = (parsedUri: EdgeParsedUri): boolean => {
  return !!parsedUri.legacyAddress
}

export const isPrivateKeyUri = (parsedUri: EdgeParsedUri): boolean => {
  return !!parsedUri.privateKeys && parsedUri.privateKeys.length >= 1
}

export const isPaymentProtocolUri = (parsedUri: EdgeParsedUri): boolean => {
  return !!parsedUri.paymentProtocolURL && !parsedUri.publicAddress
}
