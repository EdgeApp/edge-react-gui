import { EdgeAccount, EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendInfo } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'
import URL from 'url-parse'

import { selectWalletForExchange } from '../actions/CryptoExchangeActions'
import { ButtonsModal } from '../components/modals/ButtonsModal'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { WalletListModal, WalletListResult } from '../components/modals/WalletListModal'
import { Airship, showError, showWarning } from '../components/services/AirshipInstance'
import { getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'
import { RequestAddressLink } from '../types/DeepLinkTypes'
import { Dispatch, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { getTokenId } from '../util/CurrencyInfoHelpers'
import { parseDeepLink } from '../util/DeepLinkParser'
import { logActivity } from '../util/logger'
import { makeCurrencyCodeTable, upgradeCurrencyCodes } from '../util/tokenIdTools'
import { getPluginIdFromChainCode, toListString, zeroString } from '../util/utils'
import { cleanQueryFlags, openBrowserUri } from '../util/WebUtils'

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
export const doRequestAddress = async (navigation: NavigationBase, account: EdgeAccount, dispatch: Dispatch, link: RequestAddressLink) => {
  const { assets, post, redir, payer } = link
  try {
    // Check if all required fields are provided in the request
    if (assets.length === 0) throw new Error(lstrings.reqaddr_error_no_currencies_found)
    if ((post == null || post === '') && (redir == null || redir === '')) throw new Error(lstrings.reqaddr_error_post_redir)
  } catch (e: any) {
    showError(e.message)
  }

  // Present the request to the user for confirmation
  const payerStr = payer ?? lstrings.reqaddr_application_fragment
  const assetsStr = toListString(assets.map(asset => asset.tokenCode))
  const confirmResult = await Airship.show<'yes' | 'no' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.reqaddr_confirm_modal_title}
      message={sprintf(lstrings.reqaddr_confirm_modal_message, payerStr, assetsStr)}
      buttons={{
        yes: { label: lstrings.yes },
        no: { label: lstrings.no }
      }}
    />
  ))

  const lookup = makeCurrencyCodeTable(account.currencyConfig)
  const supportedAssets: Array<{ nativeCode: string; tokenCode: string }> = []
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
      const unsupportedMessage = sprintf(lstrings.reqaddr_error_unsupported_chains, config.appName, toListString(unsupportedNativeCodes))
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

    await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={navigation} headerTitle={lstrings.select_wallet} allowedAssets={tokenId} showCreateWallet />
    )).then(async ({ walletId, currencyCode }) => {
      if (walletId != null && currencyCode != null) {
        const { currencyWallets } = account
        const wallet = currencyWallets[walletId]

        // TODO: Extend getReceiveAddress() to generate the full bitcion:XXXX address instead of using raw addresses here
        const { publicAddress } = await wallet.getReceiveAddress({ currencyCode })
        jsonPayloadMap[`${currencyWallets[walletId].currencyInfo.currencyCode}_${currencyCode}`] = publicAddress
      }
    })
  }

  // Handle POST and redir
  if (Object.keys(jsonPayloadMap).length === 0) {
    showError(lstrings.reqaddr_error_no_wallets_selected)
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
        if (!response.ok) showError(lstrings.fio_get_requests_error)
      } catch (e: any) {
        showError(e.message)
      }
    }
    if (redir != null && redir !== '') {
      // Make sure this isn't some malicious link to cause an infinite redir loop
      const deepLink = parseDeepLink(redir)
      if (deepLink.type === 'requestAddress' && deepLink.redir != null) throw new Error(lstrings.reqaddr_error_invalid_redir)

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
      (await Airship.show<boolean>(bridge => (
        <ConfirmContinueModal
          bridge={bridge}
          title={sprintf(lstrings.gateway_agreement_modal_title, currencyCode)}
          body={lstrings.gateway_agreement_modal_body}
          isSkippable
        />
      )))
  }
  // Warn the user if the Address is a legacy type
  if (parsedUri.legacyAddress != null) {
    approve =
      approve &&
      (await Airship.show<boolean>(bridge => (
        <ConfirmContinueModal bridge={bridge} title={lstrings.legacy_address_modal_title} body={lstrings.legacy_address_modal_warning} isSkippable />
      )))
  }
  return approve
}

export function handleWalletUris(
  navigation: NavigationBase,
  wallet: EdgeCurrencyWallet,
  parsedUri: EdgeParsedUri,
  fioAddress?: string
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { account } = getState().core
    const { legacyAddress, metadata, minNativeAmount, nativeAmount, publicAddress, uniqueIdentifier } = parsedUri
    const currencyCode: string = parsedUri.currencyCode ?? wallet.currencyInfo.currencyCode

    // Coin operations
    try {
      // Check if the URI requires a warning to the user
      await addressWarnings(parsedUri, currencyCode)

      if (parsedUri.token) {
        // TOKEN URI
        const { contractAddress, currencyName, denominations, currencyCode } = parsedUri.token
        return navigation.push('editToken', {
          currencyCode: currencyCode.toUpperCase(),
          multiplier: denominations[0]?.multiplier,
          displayName: currencyName,
          networkLocation: { contractAddress },
          walletId: wallet.id
        })
      }

      if (parsedUri.privateKeys != null && parsedUri.privateKeys.length > 0) {
        // PRIVATE KEY URI
        return await privateKeyModalActivated(wallet, parsedUri.privateKeys)
      }

      // PUBLIC ADDRESS URI
      let tokenId: string | undefined
      if (currencyCode !== wallet.currencyInfo.currencyCode) {
        tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)
      }
      const spendInfo: EdgeSpendInfo = {
        metadata,
        spendTargets: [
          {
            // Prioritize legacyAddress first since the existence of a legacy address means that a legacy address
            // was scanned. Plugins may translate a legacy address into a publicAddress and provide that as well
            publicAddress: legacyAddress ?? publicAddress,
            memo: uniqueIdentifier,
            nativeAmount
          }
        ],
        tokenId
      }

      // React navigation doesn't like passing non-serializable objects as params. Convert date to string first
      // https://github.com/react-navigation/react-navigation/issues/7925
      const isoExpireDate = parsedUri?.expireDate?.toISOString()
      navigation.push('send2', { walletId: wallet.id, minNativeAmount, spendInfo, isoExpireDate, hiddenFeaturesMap: { scamWarning: false } })
    } catch (error: any) {
      // INVALID URI
      await Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          buttons={{ ok: { label: lstrings.string_ok } }}
          message={lstrings.scan_invalid_address_error_description}
          title={lstrings.scan_invalid_address_error_title}
        />
      ))
    }
  }
}

async function privateKeyModalActivated(wallet: EdgeCurrencyWallet, privateKeys: string[]): Promise<void> {
  const message = sprintf(lstrings.private_key_modal_sweep_from_private_key_message, config.appName)

  await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={lstrings.private_key_modal_sweep_from_private_address}
      message={message}
      buttons={
        {
          confirm: {
            label: lstrings.private_key_modal_import,
            async onPress() {
              await sweepPrivateKeys(wallet, privateKeys)
              return true
            }
          },
          cancel: { label: lstrings.private_key_modal_cancel }
        } as const
      }
    />
  ))
}

async function sweepPrivateKeys(wallet: EdgeCurrencyWallet, privateKeys: string[]) {
  const unsignedTx = await wallet.sweepPrivateKeys({
    privateKeys,
    spendTargets: []
  })
  const signedTx = await wallet.signTx(unsignedTx)
  await wallet.broadcastTx(signedTx)

  const { name, id, type } = wallet
  const {
    currencyCode,
    nativeAmount,
    networkFee,
    parentNetworkFee,
    txid,
    ourReceiveAddresses,
    deviceDescription,
    networkFeeOption,
    requestedCustomFee,
    feeRateUsed
  } = signedTx

  logActivity(`Sweep Private Key: ${name ?? ''} ${type} ${id}`)
  logActivity(`
    currencyCode: ${currencyCode}
    nativeAmount: ${nativeAmount}
    txid: ${txid}
    networkFee: ${networkFee}
    parentNetworkFee: ${parentNetworkFee ?? ''}
    deviceDescription: ${deviceDescription ?? ''}
    networkFeeOption: ${networkFeeOption ?? ''}
    ourReceiveAddresses: ${JSON.stringify(ourReceiveAddresses)}
    requestedCustomFee: ${JSON.stringify(requestedCustomFee)}
    feeRateUsed ${JSON.stringify(feeRateUsed)}
  `)
}

const shownWalletGetCryptoModals: string[] = []

export function checkAndShowGetCryptoModal(navigation: NavigationBase, selectedWalletId?: string, selectedCurrencyCode?: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
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
        const messageSyntax = sprintf(lstrings.buy_crypto_modal_message, currencyCode, currencyCode, currencyCode)
        threeButtonModal = await Airship.show<'buy' | 'exchange' | 'decline' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.buy_crypto_modal_title}
            message={messageSyntax}
            buttons={{
              buy: { label: sprintf(lstrings.buy_crypto_modal_buy_action, currencyCode) },
              exchange: { label: lstrings.buy_crypto_modal_exchange, type: 'primary' },
              decline: { label: lstrings.buy_crypto_decline }
            }}
          />
        ))
      } else {
        // if we're not targetting for buying, but rather exchange
        const messageSyntax = sprintf(lstrings.exchange_crypto_modal_message, currencyCode, currencyCode, currencyCode)
        threeButtonModal = await Airship.show<'exchange' | 'decline' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.buy_crypto_modal_title}
            message={messageSyntax}
            buttons={{
              exchange: { label: sprintf(lstrings.buy_crypto_modal_exchange) },
              decline: { label: lstrings.buy_crypto_decline }
            }}
          />
        ))
      }
      if (threeButtonModal === 'buy') {
        navigation.navigate('buyTab', { screen: 'pluginListBuy' })
      } else if (threeButtonModal === 'exchange') {
        await dispatch(selectWalletForExchange(wallet.id, currencyCode, 'to'))
        navigation.navigate('exchangeTab', { screen: 'exchange' })
      }
    } catch (e: any) {
      // Don't bother the user with this error, but log it quietly:
      console.log(e)
    }
  }
}
