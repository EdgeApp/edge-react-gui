// @flow

import type { EdgeParsedUri, EdgeSpendTarget } from 'edge-core-js'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { ADD_TOKEN, EDGE_LOGIN, SEND_CONFIRMATION } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import { type GuiMakeSpendInfo } from '../reducers/scenes/SendConfirmationReducer.js'
import { denominationToDecimalPlaces, isEdgeLogin, noOp } from '../util/utils.js'
import { loginWithEdge } from './EdgeLoginActions.js'
import { activated as legacyAddressModalActivated, deactivated as legacyAddressModalDeactivated } from './LegacyAddressModalActions.js'
import { activated as privateKeyModalActivated } from './PrivateKeyModalActions.js'
import { paymentProtocolUriReceived } from './SendConfirmationActions.js'

export const UPDATE_RECIPIENT_ADDRESS = 'UPDATE_RECIPIENT_ADDRESS'

export const toggleEnableTorch = () => ({
  type: 'TOGGLE_ENABLE_TORCH'
})

export const toggleAddressModal = () => ({
  type: 'TOGGLE_ADDRESS_MODAL_VISIBILITY'
})

export const enableScan = () => ({
  type: 'ENABLE_SCAN'
})

export const disableScan = () => ({
  type: 'DISABLE_SCAN'
})

export const parseUriSucceeded = (parsedUri: EdgeParsedUri) => ({
  type: 'PARSE_URI_SUCCEEDED',
  data: { parsedUri }
})

export const parseUriFailed = (error: Error) => ({
  type: 'PARSE_URI_FAILED',
  data: { error }
})

export const parseUriReset = () => ({
  type: 'PARSE_URI_RESET'
})

export const parseScannedUri = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  if (!data) return
  const state = getState()
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const edgeWallet = state.core.wallets.byId[selectedWalletId]
  const guiWallet = state.ui.wallets.byId[selectedWalletId]
  if (isEdgeLogin(data)) {
    // EDGE LOGIN
    dispatch(loginWithEdge(data))
    Actions[EDGE_LOGIN]()
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
        return Actions[ADD_TOKEN](parameters)
      }

      if (isLegacyAddressUri(parsedUri)) {
        // LEGACY ADDRESS URI
        return setTimeout(() => dispatch(legacyAddressModalActivated()), 500)
      }

      if (isPrivateKeyUri(parsedUri)) {
        // PRIVATE KEY URI
        return setTimeout(() => dispatch(privateKeyModalActivated()), 500)
      }

      if (isPaymentProtocolUri(parsedUri)) {
        // BIP70 URI
        // $FlowFixMe
        return dispatch(paymentProtocolUriReceived(parsedUri))
      }

      // PUBLIC ADDRESS URI
      const spendTargets: Array<EdgeSpendTarget> = [
        {
          publicAddress: parsedUri.publicAddress,
          nativeAmount: parsedUri.nativeAmount || '0'
        }
      ]

      const guiMakeSpendInfo: GuiMakeSpendInfo = {
        spendTargets,
        lockInputs: false,
        metadata: parsedUri.metadata,
        uniqueIdentifier: parsedUri.uniqueIdentifier
      }
      Actions[SEND_CONFIRMATION]({ guiMakeSpendInfo })
      // dispatch(sendConfirmationUpdateTx(parsedUri))
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

export const legacyAddressModalContinueButtonPressed = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  dispatch(legacyAddressModalDeactivated())
  const parsedUri = state.ui.scenes.scan.parsedUri
  setImmediate(() => {
    if (!parsedUri) {
      dispatch(enableScan())
      return
    }

    // Actions[SEND_CONFIRMATION]('fromScan')
    Actions[SEND_CONFIRMATION]({ guiMakeSpendInfo: parsedUri })
    // dispatch(sendConfirmationUpdateTx(parsedUri))
  })
}

export const qrCodeScanned = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const isScanEnabled = state.ui.scenes.scan.scanEnabled
  if (!isScanEnabled) return

  dispatch(disableScan())
  dispatch(parseScannedUri(data))
}

export const addressModalDoneButtonPressed = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(parseScannedUri(data))
}

export const addressModalCancelButtonPressed = () => (dispatch: Dispatch, getState: GetState) => {
  // dispatch(addressModalDeactivated())
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
