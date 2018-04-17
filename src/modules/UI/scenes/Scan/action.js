// @flow

import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../../../constants/indexConstants.js'
import type { Dispatch, GetState } from '../../../ReduxTypes.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as UTILS from '../../../utils.js'
import { loginWithEdge } from '../../../../actions/EdgeLoginActions.js'
import { updateParsedURI } from '../SendConfirmation/action.js'
import s from '../../../../locales/default.js'

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

export const parseUri = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const edgeWallet = state.core.wallets.byId[state.ui.wallets.selectedWalletId]
  const guiWallet = state.ui.wallets.byId[state.ui.wallets.selectedWalletId]
  try {
    if (/^airbitz:\/\/edge\//.test(data)) {
      dispatch(loginWithEdge(data))
      Actions[Constants.EDGE_LOGIN]()
      return
    }
    const parsedURI = WALLET_API.parseURI(edgeWallet, data)
    if (parsedURI.token) {
      // token URI, not pay
      const { contractAddress, currencyName, multiplier } = parsedURI.token
      const currencyCode = parsedURI.token.currencyCode.toUpperCase()
      const wallet = guiWallet
      const walletId = guiWallet.id
      let decimalPlaces = 18
      if (parsedURI.token && parsedURI.token.multiplier) {
        decimalPlaces = UTILS.denominationToDecimalPlaces(parsedURI.token.multiplier)
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
    } else {
      // assume pay URI
      dispatch(updateParsedURI(parsedURI))
      Actions.sendConfirmation('fromScan')
    }
  } catch (error) {
    dispatch(disableScan())
    Alert.alert(s.strings.fragment_send_send_bitcoin_unscannable, error.toString(), [{ text: s.strings.string_ok, onPress: () => dispatch(enableScan()) }])
  }
}
