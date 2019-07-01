// @flow

import { createThreeButtonModal, createYesNoModal } from 'edge-components'
import type { EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendInfo, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import React from 'react'
import { Alert, Linking } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { selectWalletForExchange } from '../actions/CryptoExchangeActions.js'
import { launchModal } from '../components/common/ModalProvider.js'
import { createAddressModal } from '../components/modals/AddressModal.js'
import {
  ADD_TOKEN,
  BUY_SELL,
  EDGE_LOGIN,
  EXCHANGE_SCENE,
  EXCLAMATION,
  FA_MONEY_ICON,
  ION_ICONS,
  KEY_ICON,
  MATERIAL_COMMUNITY,
  MATERIAL_ICONS,
  SEND_CONFIRMATION,
  SHOPPING_CART,
  getSpecialCurrencyInfo
} from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import Text from '../modules/UI/components/FormattedText'
import { Icon } from '../modules/UI/components/Icon/Icon.ui.js'
import OptionIcon from '../modules/UI/components/OptionIcon/OptionIcon.ui.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../reducers/scenes/SendConfirmationReducer.js'
import { colors as COLORS } from '../theme/variables/airbitz.js'
import type { GuiWallet } from '../types.js'
import { type RequestPaymentAddress, denominationToDecimalPlaces, getRequestForAddress, isEdgeLogin, noOp } from '../util/utils.js'
import { loginWithEdge } from './EdgeLoginActions.js'
import { sweepPrivateKeyFail, sweepPrivateKeyStart, sweepPrivateKeySuccess } from './PrivateKeyModalActions.js'
import { secondaryModalActivated } from './SecondaryModalActions.js'
import { paymentProtocolUriReceived } from './SendConfirmationActions.js'

const doRequestAddress = (dispatch: Dispatch, edgeWallet: EdgeCurrencyWallet, guiWallet: GuiWallet, requestAddress: RequestPaymentAddress) => {
  dispatch({ type: 'DISABLE_SCAN' })
  if (requestAddress.currencyName !== edgeWallet.currencyInfo.pluginName) {
    // Mismatching currency
    const body = sprintf(s.strings.currency_mismatch_popup_body, requestAddress.currencyName, requestAddress.currencyName)
    setTimeout(
      () =>
        Alert.alert(s.strings.currency_mismatch_popup_title, body, [
          {
            text: s.strings.string_ok,
            onPress: () => dispatch({ type: 'ENABLE_SCAN' })
          }
        ]),
      500
    )
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
      launchModal(modal)
        .then(resolveValue => {
          dispatch({ type: 'ENABLE_SCAN' })
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
          dispatch({ type: 'ENABLE_SCAN' })
        })
    }, 1000)
  }
}

export const parseScannedUri = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  if (!data) return
  const state = getState()
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const edgeWallet = state.core.wallets.byId[selectedWalletId]
  const guiWallet = state.ui.wallets.byId[selectedWalletId]
  const currencyCode = state.ui.wallets.selectedCurrencyCode

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

  WALLET_API.parseUri(edgeWallet, data, currencyCode).then(
    (parsedUri: EdgeParsedUri) => {
      dispatch({ type: 'PARSE_URI_SUCCEEDED', data: { parsedUri } })

      if (parsedUri.token) {
        // TOKEN URI
        const { contractAddress, currencyName } = parsedUri.token
        const multiplier = parsedUri.token.denominations[0].multiplier
        const currencyCode = parsedUri.token.currencyCode.toUpperCase()
        let decimalPlaces = 18
        if (multiplier) {
          decimalPlaces = denominationToDecimalPlaces(multiplier)
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
        return dispatch(showLegacyAddressModal())
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
      const nativeAmount = parsedUri.nativeAmount || '0'
      const spendTargets: Array<EdgeSpendTarget> = [
        {
          publicAddress: parsedUri.publicAddress,
          nativeAmount
        }
      ]

      const guiMakeSpendInfo: GuiMakeSpendInfo = {
        spendTargets,
        lockInputs: false,
        metadata: parsedUri.metadata,
        uniqueIdentifier: parsedUri.uniqueIdentifier,
        nativeAmount
      }
      Actions[SEND_CONFIRMATION]({ guiMakeSpendInfo })
      // dispatch(sendConfirmationUpdateTx(parsedUri))
    },
    () => {
      // INVALID URI
      dispatch({ type: 'DISABLE_SCAN' })
      setTimeout(
        () =>
          Alert.alert(s.strings.scan_invalid_address_error_title, s.strings.scan_invalid_address_error_description, [
            {
              text: s.strings.string_ok,
              onPress: () => dispatch({ type: 'ENABLE_SCAN' })
            }
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

  dispatch({ type: 'DISABLE_SCAN' })
  dispatch(parseScannedUri(data))
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
  // $FlowFixMe should be paymentProtocolUrl (lowercased)?
  return !!parsedUri.paymentProtocolURL && !parsedUri.publicAddress
}

export const toggleAddressModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId: string = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  const addressModal = createAddressModal({
    walletId,
    coreWallet,
    currencyCode
  })
  const uri = await launchModal(addressModal)
  if (uri) {
    dispatch(parseScannedUri(uri))
  }
}

export const legacyAddressModalContinueButtonPressed = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const parsedUri = state.ui.scenes.scan.parsedUri
  setImmediate(() => {
    if (!parsedUri) {
      dispatch({ type: 'ENABLE_SCAN' })
      return
    }

    Actions[SEND_CONFIRMATION]({ guiMakeSpendInfo: parsedUri })
  })
}

export const showLegacyAddressModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const legacyAddressModal = createYesNoModal({
    title: s.strings.legacy_address_modal_title,
    icon: <Icon style={{}} type={MATERIAL_COMMUNITY} name={EXCLAMATION} size={30} />,
    message: s.strings.legacy_address_modal_warning,
    textAlign: 'left',
    noButtonText: s.strings.legacy_address_modal_cancel,
    yesButtonText: s.strings.legacy_address_modal_continue
  })
  const response = await launchModal(legacyAddressModal)
  if (response) {
    dispatch(legacyAddressModalContinueButtonPressed())
  } else {
    dispatch({ type: 'ENABLE_SCAN' })
  }
}

export const privateKeyModalActivated = () => async (dispatch: Dispatch, getState: GetState) => {
  const privateKeyModal = createYesNoModal({
    title: s.strings.private_key_modal_sweep_from_private_address,
    icon: <Icon style={{ transform: [{ rotate: '270deg' }] }} type={ION_ICONS} name={KEY_ICON} size={30} />,
    noButtonText: s.strings.private_key_modal_cancel,
    yesButtonText: s.strings.private_key_modal_import
  })

  const firstResponse = await launchModal(privateKeyModal)
  if (!firstResponse) {
    dispatch({ type: 'ENABLE_SCAN' })
    return
  }
  setTimeout(() => {
    dispatch(sweepPrivateKeyStart())
    dispatch(secondaryModalActivated())

    const state = getState()
    const parsedUri = state.ui.scenes.scan.parsedUri
    if (!parsedUri) return
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const edgeWallet = state.core.wallets.byId[selectedWalletId]

    const spendInfo: EdgeSpendInfo = {
      privateKeys: parsedUri.privateKeys,
      spendTargets: []
    }

    edgeWallet.sweepPrivateKeys(spendInfo).then(
      (unsignedTx: EdgeTransaction) => {
        edgeWallet
          .signTx(unsignedTx)
          .then(signedTx => edgeWallet.broadcastTx(signedTx))
          .then(() => dispatch(sweepPrivateKeySuccess()))
      },
      (error: Error) => {
        dispatch(sweepPrivateKeyFail(error))
      }
    )
  }, 1000)
}

const shownWalletGetCryptoModals = []

export const checkAndShowGetCryptoModal = () => async (dispatch: Dispatch, getState: GetState) => {
  try {
    const state = getState()
    const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
    const wallet = UI_SELECTORS.getSelectedWallet(state)
    // check if balance is zero
    const balance = wallet.nativeBalances[currencyCode]
    if (balance !== '0' || shownWalletGetCryptoModals.includes(wallet.id)) return // if there's a balance then early exit
    shownWalletGetCryptoModals.push(wallet.id) // add to list of wallets with modal shown this session
    let threeButtonModal
    const SPECIAL_CURRENCY_INFO = getSpecialCurrencyInfo(currencyCode)
    if (SPECIAL_CURRENCY_INFO.displayBuyCrypto) {
      const messageSyntax = sprintf(s.strings.buy_crypto_modal_message, currencyCode, currencyCode, currencyCode)
      threeButtonModal = createThreeButtonModal({
        title: s.strings.buy_crypto_modal_title,
        message: messageSyntax,
        icon: <Icon name={SHOPPING_CART} type={MATERIAL_ICONS} size={32} color={COLORS.primary} />,
        primaryButton: {
          text: sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode),
          returnValue: 'buy'
        },
        secondaryButton: {
          text: s.strings.buy_crypto_modal_exchange,
          returnValue: 'exchange'
        },
        tertiaryButton: {
          text: s.strings.buy_crypto_decline,
          returnValue: 'decline'
        }
      })
    } else {
      // if we're not targetting for buying, but rather exchange
      const messageSyntax = sprintf(s.strings.exchange_crypto_modal_message, currencyCode, currencyCode, currencyCode)
      threeButtonModal = createThreeButtonModal({
        title: s.strings.buy_crypto_modal_title,
        message: messageSyntax,
        icon: <Icon name={SHOPPING_CART} type={MATERIAL_ICONS} size={32} color={COLORS.primary} />,
        primaryButton: {
          text: sprintf(s.strings.buy_crypto_modal_exchange),
          returnValue: 'exchange'
        },
        secondaryButton: {
          text: s.strings.buy_crypto_decline,
          returnValue: 'decline'
        }
      })
    }
    const value = await launchModal(threeButtonModal)
    if (value === 'buy') {
      Actions[BUY_SELL]()
    } else if (value === 'exchange') {
      dispatch(selectWalletForExchange(wallet.id, currencyCode, 'to'))
      Actions[EXCHANGE_SCENE]()
    }
  } catch (e) {
    console.log('error generating encodedURI: ', e)
  }
}
