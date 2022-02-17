// @flow

import type { EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendTarget } from 'edge-core-js'
import * as React from 'react'
import { Alert, Linking } from 'react-native'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { selectWalletForExchange } from '../actions/CryptoExchangeActions.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal.js'
import { paymentProtocolUriReceived } from '../components/modals/paymentProtocolUriReceived.js'
import { Airship, showError } from '../components/services/AirshipInstance'
import { ADD_TOKEN, EXCHANGE_SCENE, PLUGIN_BUY, SEND } from '../constants/SceneKeys.js'
import { getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { checkPubAddress } from '../modules/FioAddress/util'
import { type ReturnAddressLink } from '../types/DeepLinkTypes.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { type GuiMakeSpendInfo, type GuiWallet } from '../types/types.js'
import { parseDeepLink } from '../util/DeepLinkParser.js'
import { denominationToDecimalPlaces, zeroString } from '../util/utils.js'
import { launchDeepLink } from './DeepLinkingActions.js'

export const doRequestAddress = (dispatch: Dispatch, edgeWallet: EdgeCurrencyWallet, guiWallet: GuiWallet, link: ReturnAddressLink) => {
  const { currencyName, sourceName = '', successUri = '' } = link
  dispatch({ type: 'DISABLE_SCAN' })
  if (currencyName !== edgeWallet.currencyInfo.pluginId) {
    // Mismatching currency
    const body = sprintf(s.strings.currency_mismatch_popup_body, currencyName, currencyName)
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
    const bodyString = sprintf(s.strings.request_crypto_address_modal_body, sourceName, currencyName) + '\n\n'
    const { host } = new URL(successUri)

    setTimeout(() => {
      Airship.show(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={s.strings.request_crypto_address_modal_title}
          message={`${bodyString} ${host}`}
          buttons={{
            confirm: { label: s.strings.request_crypto_address_modal_send_address_button },
            cancel: { label: s.strings.string_cancel_cap }
          }}
        />
      ))
        .then(resolveValue => {
          dispatch({ type: 'ENABLE_SCAN' })
          if (resolveValue === 'confirm') {
            // Build the URL
            const addr = guiWallet.receiveAddress.publicAddress
            const url = decodeURIComponent(successUri)
            const finalUrl = url + '?address=' + encodeURIComponent(addr)
            Linking.openURL(finalUrl)
          }
        })
        .catch(e => {
          dispatch({ type: 'ENABLE_SCAN' })
        })
    }, 1000)
  }
}

export const addressWarnings = async (parsedUri: any, currencyCode: string) => {
  let approve = true
  // Warn the user if the URI is a Gateway/Bridge URI
  if (parsedUri?.metadata?.gateway === true) {
    approve =
      approve &&
      (await Airship.show(bridge => (
        <ConfirmContinueModal
          bridge={bridge}
          title={sprintf(s.strings.gateway_agreement_modal_title, currencyCode)}
          body={s.strings.gateway_agreement_modal_body}
          isSkippable
        />
      )))
  }
  // Warn the user if the Address is a legacy type
  if (parsedUri.legacyAddress != null) {
    approve =
      approve &&
      (await Airship.show(bridge => (
        <ConfirmContinueModal bridge={bridge} title={s.strings.legacy_address_modal_title} body={s.strings.legacy_address_modal_warning} isSkippable />
      )))
  }
  return approve
}

export const parseScannedUri = (data: string, customErrorTitle?: string, customErrorDescription?: string) => async (dispatch: Dispatch, getState: GetState) => {
  if (!data) return
  const state = getState()
  const { account } = state.core
  const { currencyWallets } = account

  const selectedWalletId = state.ui.wallets.selectedWalletId
  const edgeWallet = currencyWallets[selectedWalletId]
  const guiWallet = state.ui.wallets.byId[selectedWalletId]
  const currencyCode = state.ui.wallets.selectedCurrencyCode

  const walletId: string = state.ui.wallets.selectedWalletId
  const coreWallet: EdgeCurrencyWallet = currencyWallets[walletId]

  let fioAddress
  if (account && account.currencyConfig) {
    const fioPlugin = account.currencyConfig.fio
    const currencyCode: string = state.ui.wallets.selectedCurrencyCode
    try {
      const publicAddress = await checkPubAddress(fioPlugin, data.toLowerCase(), coreWallet.currencyInfo.currencyCode, currencyCode)
      fioAddress = data.toLowerCase()
      data = publicAddress
    } catch (e) {
      if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
        return showError(e)
      }
    }
  }
  // Check for things other than coins:
  try {
    const deepLink = parseDeepLink(data)
    switch (deepLink.type) {
      case 'other':
        // Handle this link type below:
        break
      case 'returnAddress':
        try {
          return doRequestAddress(dispatch, edgeWallet, guiWallet, deepLink)
        } catch (e) {
          console.log(e)
        }
        break
      case 'edgeLogin':
      case 'bitPay':
      default:
        dispatch(launchDeepLink(deepLink))
        return
    }
  } catch (error) {
    return showError(error)
  }

  // Coin operations
  try {
    const parsedUri: EdgeParsedUri & { paymentProtocolURL?: string } = await edgeWallet.parseUri(data, currencyCode)
    dispatch({ type: 'PARSE_URI_SUCCEEDED', data: { parsedUri } })

    // Check if the URI requires a warning to the user
    const approved = await addressWarnings(parsedUri, currencyCode)
    if (!approved) return dispatch({ type: 'ENABLE_SCAN' })

    if (parsedUri.token) {
      // TOKEN URI
      const { contractAddress, currencyName } = parsedUri.token
      const multiplier = parsedUri.token.denominations[0].multiplier
      const currencyCode = parsedUri.token.currencyCode.toUpperCase()
      let decimalPlaces = '18'

      if (multiplier) {
        decimalPlaces = denominationToDecimalPlaces(multiplier)
      }

      const parameters = {
        contractAddress,
        currencyCode,
        currencyName,
        decimalPlaces,
        walletId: selectedWalletId
      }

      return Actions.push(ADD_TOKEN, parameters)
    }

    // LEGACY ADDRESS URI
    if (parsedUri.legacyAddress != null) {
      const guiMakeSpendInfo: GuiMakeSpendInfo = { ...parsedUri }
      Actions.push(SEND, {
        guiMakeSpendInfo,
        selectedWalletId,
        selectedCurrencyCode: currencyCode
      })

      return
    }

    if (parsedUri.privateKeys != null && parsedUri.privateKeys.length > 0) {
      // PRIVATE KEY URI
      return dispatch(privateKeyModalActivated(parsedUri.privateKeys))
    }

    if (parsedUri.paymentProtocolURL != null && parsedUri.publicAddress == null) {
      // BIP70 URI
      const guiMakeSpendInfo = await paymentProtocolUriReceived(parsedUri, coreWallet)

      if (guiMakeSpendInfo != null) {
        Actions.push(SEND, {
          guiMakeSpendInfo,
          selectedWalletId,
          selectedCurrencyCode: currencyCode
        })
      }

      return
    }

    // PUBLIC ADDRESS URI
    const nativeAmount = parsedUri.nativeAmount || ''
    const spendTargets: EdgeSpendTarget[] = [
      {
        publicAddress: parsedUri.publicAddress,
        nativeAmount
      }
    ]

    if (fioAddress != null) {
      spendTargets[0].otherParams = {
        fioAddress,
        isSendUsingFioAddress: true
      }
    }

    const guiMakeSpendInfo: GuiMakeSpendInfo = {
      spendTargets,
      lockInputs: false,
      metadata: parsedUri.metadata,
      uniqueIdentifier: parsedUri.uniqueIdentifier,
      nativeAmount
    }

    Actions.push(SEND, {
      guiMakeSpendInfo,
      selectedWalletId,
      selectedCurrencyCode: currencyCode
    })
    // dispatch(sendConfirmationUpdateTx(parsedUri))
  } catch (error) {
    // INVALID URI
    dispatch({ type: 'DISABLE_SCAN' })
    setTimeout(
      () =>
        Alert.alert(
          customErrorTitle || s.strings.scan_invalid_address_error_title,
          customErrorDescription || s.strings.scan_invalid_address_error_description,
          [
            {
              text: s.strings.string_ok,
              onPress: () => dispatch({ type: 'ENABLE_SCAN' })
            }
          ]
        ),
      500
    )
  }
}

export const qrCodeScanned = (data: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const isScanEnabled = state.ui.scenes.scan.scanEnabled
  if (!isScanEnabled) return

  dispatch({ type: 'DISABLE_SCAN' })
  dispatch(parseScannedUri(data))
}

const privateKeyModalActivated = (privateKeys: string[]) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  const { currencyWallets } = state.core.account
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const edgeWallet = currencyWallets[selectedWalletId]

  await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.private_key_modal_sweep_from_private_address}
      message={s.strings.private_key_modal_sweep_from_private_address_message}
      buttons={{
        confirm: {
          label: s.strings.private_key_modal_import,
          async onPress() {
            await sweepPrivateKeys(edgeWallet, privateKeys)
            return true
          }
        },
        cancel: { label: s.strings.private_key_modal_cancel }
      }}
    />
  ))
  dispatch({ type: 'ENABLE_SCAN' })
}

async function sweepPrivateKeys(wallet: EdgeCurrencyWallet, privateKeys: string[]) {
  const unsignedTx = await wallet.sweepPrivateKeys({
    privateKeys,
    spendTargets: []
  })
  const signedTx = await wallet.signTx(unsignedTx)
  await wallet.broadcastTx(signedTx)
}

const shownWalletGetCryptoModals = []

export const checkAndShowGetCryptoModal = (selectedWalletId?: string, selectedCurrencyCode?: string) => async (dispatch: Dispatch, getState: GetState) => {
  try {
    const state = getState()
    const currencyCode = selectedCurrencyCode ?? state.ui.wallets.selectedCurrencyCode
    const { currencyWallets } = state.core.account
    const wallet: EdgeCurrencyWallet = currencyWallets[selectedWalletId ?? state.ui.wallets.selectedWalletId]
    // check if balance is zero
    const balance = wallet.balances[currencyCode]
    if (!zeroString(balance) || shownWalletGetCryptoModals.includes(wallet.id)) return // if there's a balance then early exit
    shownWalletGetCryptoModals.push(wallet.id) // add to list of wallets with modal shown this session
    let threeButtonModal
    const { displayBuyCrypto } = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId)
    if (displayBuyCrypto) {
      const messageSyntax = sprintf(s.strings.buy_crypto_modal_message, currencyCode, currencyCode, currencyCode)
      threeButtonModal = await Airship.show(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={s.strings.buy_crypto_modal_title}
          message={messageSyntax}
          buttons={{
            buy: { label: sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode) },
            exchange: { label: s.strings.buy_crypto_modal_exchange, type: 'primary' },
            decline: { label: s.strings.buy_crypto_decline }
          }}
        />
      ))
    } else {
      // if we're not targetting for buying, but rather exchange
      const messageSyntax = sprintf(s.strings.exchange_crypto_modal_message, currencyCode, currencyCode, currencyCode)
      threeButtonModal = await Airship.show(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={s.strings.buy_crypto_modal_title}
          message={messageSyntax}
          buttons={{
            exchange: { label: sprintf(s.strings.buy_crypto_modal_exchange) },
            decline: { label: s.strings.buy_crypto_decline }
          }}
        />
      ))
    }
    if (threeButtonModal === 'buy') {
      Actions.jump(PLUGIN_BUY, { direction: 'buy' })
    } else if (threeButtonModal === 'exchange') {
      dispatch(selectWalletForExchange(wallet.id, currencyCode, 'to'))
      Actions.jump(EXCHANGE_SCENE)
    }
  } catch (e) {
    // Don't bother the user with this error, but log it quietly:
    console.log(e)
  }
}
