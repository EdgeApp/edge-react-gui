// @flow

import { createYesNoModal, showModal } from 'edge-components'
import type { EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import React from 'react'
import { Alert, Linking, Text } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { ADD_TOKEN, EDGE_LOGIN, FA_MONEY_ICON, SEND_CONFIRMATION } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import OptionIcon from '../modules/UI/components/OptionIcon/OptionIcon.ui.js'
import type { GuiWallet } from '../types.js'
import { type RequestPaymentAddress, denominationToDecimalPlaces, getRequestForAddress, isEdgeLogin, noOp } from '../util/utils.js'
import { loginWithEdge } from './EdgeLoginActions.js'
import { activated as legacyAddressModalActivated, deactivated as legacyAddressModalDeactivated } from './LegacyAddressModalActions.js'
import { activated as privateKeyModalActivated } from './PrivateKeyModalActions.js'
import { paymentProtocolUriReceived, updateParsedURI } from './SendConfirmationActions.js'

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

const doRequestAddress = (dispatch: Dispatch, edgeWallet: EdgeCurrencyWallet, guiWallet: GuiWallet, requestAddress: RequestPaymentAddress) => {
  dispatch(disableScan())
  if (requestAddress.currencyName !== edgeWallet.currencyInfo.pluginName) {
    // Mismatching currency
    const body = sprintf(s.strings.currency_mismatch_popup_body, requestAddress.currencyName, requestAddress.currencyName)
    setTimeout(() => Alert.alert(s.strings.currency_mismatch_popup_title, body, [{ text: s.strings.string_ok, onPress: () => dispatch(enableScan()) }]), 500)
  } else {
    // Currencies match. Ask user to confirm sending an address
    const bodyString = sprintf(s.strings.request_crypto_address_modal_body, requestAddress.sourceName, requestAddress.currencyName) + '\n\n'

    const modal = createYesNoModal({
      title: s.strings.request_crypto_address_modal_title,
      message: (
        <Text style={{ textAlign: 'center' }}>
          {bodyString}
          <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{`${requestAddress.callbackDomain}`}</Text>
        </Text>
      ),
      icon: <OptionIcon iconName={FA_MONEY_ICON} />,
      noButtonText: s.strings.string_cancel_cap,
      yesButtonText: s.strings.request_crypto_address_modal_send_address_button
    })

    setTimeout(() => {
      showModal(modal)
        .then(resolveValue => {
          dispatch(enableScan())
          if (resolveValue) {
            // Build the URL
            const addr = guiWallet.receiveAddress.publicAddress
            const url = decodeURIComponent(requestAddress.callbackUrl)
            const finalUrl = url + '?address=' + encodeURIComponent(addr)
            try {
              Linking.openURL(finalUrl)
            } catch (e) {
              throw new Error(e)
            }
          }
        })
        .catch(e => {
          dispatch(enableScan())
        })
    }, 1000)
  }
}

export const parseUri = (data: string) => (dispatch: Dispatch, getState: GetState) => {
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

  try {
    const requestAddress: RequestPaymentAddress = getRequestForAddress(data)
    return doRequestAddress(dispatch, edgeWallet, guiWallet, requestAddress)
  } catch (e) {
    console.log(e)
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
      Actions[SEND_CONFIRMATION]('fromScan')
      dispatch(updateParsedURI(parsedUri))
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

    Actions[SEND_CONFIRMATION]('fromScan')
    dispatch(updateParsedURI(parsedUri))
  })
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
