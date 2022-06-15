// @flow

import type { EdgeAccount, EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendTarget } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { selectWalletForExchange } from '../actions/CryptoExchangeActions.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal.js'
import { paymentProtocolUriReceived } from '../components/modals/paymentProtocolUriReceived.js'
import { upgradeCurrencyCodes, WalletListModal } from '../components/modals/WalletListModal'
import { Airship, showError, showWarning } from '../components/services/AirshipInstance'
import { getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import { checkPubAddress } from '../modules/FioAddress/util'
import { config } from '../theme/appConfig.js'
import { type RequestAddressLink } from '../types/DeepLinkTypes'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { type GuiMakeSpendInfo } from '../types/types'
import { parseDeepLink } from '../util/DeepLinkParser.js'
import { getPluginIdFromChainCode, makeCurrencyCodeTable, toListString, zeroString } from '../util/utils.js'
import { cleanQueryFlags, openBrowserUri } from '../util/WebUtils'
import { launchDeepLink } from './DeepLinkingActions.js'

/**
 * Handle Request for Address Links (WIP - pending refinement).
 *
 * Further refinement will be needed when the specs for the POST endpoint come
 * out.
 *
 * Currently there are no known URI's that can be used in the POST query that
 * will properly accept this payment address format.
 * Specifying the POST
 *
 * At this point the feature should:
 * - Recognize the Request for Address (reqaddr) URI's in either a QR code
 *    or a deeplink as specified by the specification.
 * - Recognize error cases
 * - Allow the user to select multiple wallets, filtered by token and wallet
 *    according to the reqaddr URI
 * - Handle the 'redir' query in the reqaddr as another deeplink/scan after
 *    validating the user satisfies the 'codes' query from the reqaddr.
 * - Disallow reqaddr's that specify other reqaddr's in the 'redir' query (prevent
 *    infinite redirect loops).
 */
export const doRequestAddress = async (account: EdgeAccount, dispatch: Dispatch, link: RequestAddressLink) => {
  dispatch({ type: 'DISABLE_SCAN' })
  const { assets, post, redir, payer } = link
  try {
    // Check if all required fields are provided in the request
    if (assets.length === 0) throw new Error(s.strings.reqaddr_error_no_currencies_found)
    if ((post == null || post === '') && (redir == null || redir === '')) throw new Error(s.strings.reqaddr_error_post_redir)
  } catch (e) {
    showError(e.message)
  }

  // Present the request to the user for confirmation
  const payerStr = payer ?? s.strings.reqaddr_application_fragment
  const assetsStr = toListString(assets.map(asset => asset.tokenCode))
  const confirmResult = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.reqaddr_confirm_modal_title}
      message={sprintf(s.strings.reqaddr_confirm_modal_message, payerStr, assetsStr)}
      buttons={{
        yes: { label: s.strings.yes },
        no: { label: s.strings.no }
      }}
    />
  ))

  const lookup = makeCurrencyCodeTable(account)
  const supportedAssets: Array<{ nativeCode: string, tokenCode: string }> = []
  if (confirmResult === 'yes') {
    // Verify Edge supports at least some of the requested native assets
    const unsupportedNativeCodes: string[] = []
    assets.forEach(asset => {
      const { nativeCode, tokenCode } = asset
      const test = upgradeCurrencyCodes(lookup, [`${nativeCode}-${tokenCode}`]) ?? []
      if (getPluginIdFromChainCode(nativeCode) == null || test.length === 0) unsupportedNativeCodes.push(tokenCode)
      else supportedAssets.push({ ...asset })
    })

    // Show warnings or errors for unsupported native currencies
    if (unsupportedNativeCodes.length > 0) {
      const unsupportedMessage = sprintf(s.strings.reqaddr_error_unsupported_chains, config.appName, toListString(unsupportedNativeCodes))
      if (unsupportedNativeCodes.length === assets.length) {
        showError(unsupportedMessage) // All requested assets unsupported
        return
      } else showWarning(unsupportedMessage) // Some requested assets unsupported
    }
  }

  // Show wallet picker(s) for supported assets
  const jsonPayloadMap: { [currencyAndTokenCode: string]: string | null } = {}
  for (const supportedAsset of supportedAssets) {
    const tokenId = upgradeCurrencyCodes(lookup, [`${supportedAsset.nativeCode}-${supportedAsset.tokenCode}`])

    await Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedAssets={tokenId} showCreateWallet />).then(
      async ({ walletId, currencyCode }) => {
        if (walletId != null && currencyCode != null) {
          const { currencyWallets } = account
          const wallet = currencyWallets[walletId]

          // TODO: Extend getReceiveAddress() to generate the full bitcion:XXXX address instead of using raw addresses here
          const { publicAddress } = await wallet.getReceiveAddress({ currencyCode })
          jsonPayloadMap[`${currencyWallets[walletId].currencyInfo.currencyCode}_${currencyCode}`] = publicAddress
        }
      }
    )
  }

  // Handle POST and redir
  if (Object.keys(jsonPayloadMap).length === 0) {
    showError(s.strings.reqaddr_error_no_wallets_selected)
  } else {
    if (post != null && post !== '') {
      // Setup and POST the JSON payload
      // TODO: Fetch header and proper response error handling, after the POST recipient spec is defined.
      const initOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonPayloadMap)
      }
      try {
        const response = await fetch(post, initOpts)
        if (!response.ok) showError(s.strings.fio_get_requests_error)
      } catch (e) {
        showError(e.message)
      }
    }
    if (redir != null && redir !== '') {
      // Make sure this isn't some malicious link to cause an infinite redir loop
      const deepLink = parseDeepLink(redir)
      if (deepLink.type === 'requestAddress' && deepLink.redir != null) throw new Error(s.strings.reqaddr_error_invalid_redir)

      const url = new URL(redir, true)
      url.set('query', { ...url.query, ...jsonPayloadMap })

      await openBrowserUri(cleanQueryFlags(url.href))
    }
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
  const currencyCode = state.ui.wallets.selectedCurrencyCode

  let fioAddress
  if (account && account.currencyConfig) {
    const fioPlugin = account.currencyConfig.fio
    if (fioPlugin != null) {
      const currencyCode: string = state.ui.wallets.selectedCurrencyCode
      try {
        const publicAddress = await checkPubAddress(fioPlugin, data.toLowerCase(), edgeWallet.currencyInfo.currencyCode, currencyCode)
        fioAddress = data.toLowerCase()
        data = publicAddress
      } catch (e) {
        if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
          return showError(e)
        }
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
      case 'requestAddress':
        return await doRequestAddress(account, dispatch, deepLink)
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
      const { contractAddress, currencyName, denominations, currencyCode } = parsedUri.token
      return Actions.push('editToken', {
        currencyCode: currencyCode.toUpperCase(),
        multiplier: denominations[0]?.multiplier,
        displayName: currencyName,
        networkLocation: { contractAddress },
        walletId: selectedWalletId
      })
    }

    // LEGACY ADDRESS URI
    if (parsedUri.legacyAddress != null) {
      const guiMakeSpendInfo: GuiMakeSpendInfo = { ...parsedUri }
      Actions.push('send', {
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
      const guiMakeSpendInfo = await paymentProtocolUriReceived(parsedUri, edgeWallet)

      if (guiMakeSpendInfo != null) {
        Actions.push('send', {
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

    Actions.push('send', {
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

const privateKeyModalActivated = (privateKeys: string[]) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  const { currencyWallets } = state.core.account
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const edgeWallet = currencyWallets[selectedWalletId]
  const message = sprintf(s.strings.private_key_modal_sweep_from_private_key_message, config.appName)

  await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.private_key_modal_sweep_from_private_address}
      message={message}
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
      Actions.jump('pluginListBuy', { direction: 'buy' })
    } else if (threeButtonModal === 'exchange') {
      dispatch(selectWalletForExchange(wallet.id, currencyCode, 'to'))
      Actions.jump('exchangeScene')
    }
  } catch (e) {
    // Don't bother the user with this error, but log it quietly:
    console.log(e)
  }
}
