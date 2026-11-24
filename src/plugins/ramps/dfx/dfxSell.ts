import { floor, gt, mul } from 'biggystring'
import {
  asMaybePendingFundsError,
  type EdgeAssetAction,
  type EdgeSpendInfo,
  type EdgeTransaction,
  type EdgeTxActionFiat
} from 'edge-core-js'
import URL from 'url-parse'

import type { SendScene2Params } from '../../../components/scenes/SendScene2'
import {
  showError,
  showToast
} from '../../../components/services/AirshipInstance'
import { requestPermissionOnSettings } from '../../../components/services/PermissionsManager'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenom } from '../../../selectors/DenominationSelectors'
import type { GuiPlugin } from '../../../types/GuiPluginTypes'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { makePluginUri } from '../../../util/GuiPluginTools'
import {
  SendErrorBackPressed,
  SendErrorNoTransaction
} from '../../gui/fiatPlugin'
import {
  makePaymentReturnUrl,
  NOT_SUCCESS_TOAST_HIDE_MS
} from '../../gui/providers/common'
import type { RampPluginConfig, RampQuoteRequest } from '../rampPluginTypes'
import { makeSellPaymentRedirect } from '../utils/sellPaymentRedirect'
import { fetchDfx } from './dfxApi'
import { fetchDfxSellFiatAmount } from './dfxQuote'
import { asDfxSellRedirectQuery, asDfxSellRoute } from './dfxRampTypes'

/** DFX's names for the blockchain and native asset of the selling wallet. */
export interface DfxSellChain {
  readonly blockchain: string
  readonly asset: string
}

export interface DfxSellParams {
  readonly config: RampPluginConfig
  /** The DFX GUI plugin, with its id, app URI, name and permissions */
  readonly guiPlugin: GuiPlugin
  /** DFX's sell page, from within the GUI plugin's `baseUri` */
  readonly deepPath: string
  /** The query DFX's app opens with, including the login `session` */
  readonly deepQuery: Record<string, string>
  readonly request: RampQuoteRequest
  readonly chain: DfxSellChain
}

/** The sell order DFX's payment redirect names. */
export interface DfxSellOrder {
  readonly routeId: string
  /** The crypto to send, as an exchange amount */
  readonly amount: string
  /** DFX reports the crypto as sent already */
  readonly isComplete: boolean
}

/**
 * Reads the sell order from the redirect DFX's sell page opens, which is the
 * redirect URI with `sell` appended to its path. Returns undefined for any
 * other path, such as the bare redirect URI DFX opens on cancel. Throws when
 * the order is malformed or not for the wallet's chain and asset.
 */
export function parseDfxSellRedirect(
  url: string,
  redirectUri: string,
  chain: DfxSellChain
): DfxSellOrder | undefined {
  const urlObj = new URL(url, true)
  if (urlObj.pathname !== `${new URL(redirectUri).pathname}sell`) {
    return undefined
  }

  const { routeId, amount, asset, blockchain, isComplete } =
    asDfxSellRedirectQuery(urlObj.query)
  // The route id goes into an API path:
  if (!/^\d+$/.test(routeId)) {
    throw new Error('DFX sell redirect has a malformed routeId')
  }
  // DFX writes the amount with JavaScript's number.toString(), which uses
  // exponent form for small amounts (1e-7). That form must not be misread:
  if (!/^\d+(\.\d+)?$/.test(amount) || !gt(amount, '0')) {
    throw new Error(`DFX sell redirect has a malformed amount: ${amount}`)
  }
  if (blockchain !== chain.blockchain) {
    throw new Error(
      `DFX sell redirect is for ${blockchain}, not ${chain.blockchain}`
    )
  }
  if (asset !== chain.asset) {
    throw new Error(`DFX sell redirect is for ${asset}, not ${chain.asset}`)
  }

  return { routeId, amount, isComplete: isComplete === 'true' }
}

/**
 * Fetches the address that takes the deposit for a sell route, and DFX's
 * name for the fiat the route pays out if DFX names one. The redirect is a
 * deep link anyone can forge, so the address comes from DFX's API for the
 * logged-in user, never from the redirect.
 */
async function fetchDfxSellRoute(
  routeId: string,
  session: string,
  chain: DfxSellChain
): Promise<{ depositAddress: string; fiat: string | undefined }> {
  const { deposit, currency } = asDfxSellRoute(
    await fetchDfx(`/sell/${routeId}`, {
      headers: { Authorization: `Bearer ${session}` }
    })
  )
  if (deposit == null) {
    throw new Error(`DFX sell route ${routeId} has no deposit address`)
  }
  if (!deposit.blockchains.includes(chain.blockchain)) {
    throw new Error(
      `DFX sell route ${routeId} does not take deposits on ${chain.blockchain}`
    )
  }
  return { depositAddress: deposit.address, fiat: currency?.name }
}

/**
 * Opens DFX's sell page with a payment redirect, so the user pays the order
 * from the send scene with the deposit address and amount filled in,
 * instead of copying DFX's deposit address.
 */
export async function openDfxSell(params: DfxSellParams): Promise<void> {
  const { config, guiPlugin, deepPath, deepQuery, request, chain } = params
  const { disklet, navigation, onLogEvent } = config
  const { fiatCurrencyCode, tokenId, wallet } = request
  const { displayName, pluginId } = guiPlugin

  // Ask for the GUI plugin's permissions the way the plugin scene does, and
  // stop silently where it would leave:
  for (const permission of guiPlugin.permissions ?? []) {
    const deniedPermission = await requestPermissionOnSettings(
      disklet,
      permission,
      displayName,
      guiPlugin.mandatoryPermissions ?? false
    )
    if (deniedPermission) return
  }

  const redirectUri = makePaymentReturnUrl(pluginId, {
    pluginId: wallet.currencyInfo.pluginId,
    tokenId
  })
  // The URL carries the login session, so this module never logs it and the
  // WebView scene logs it through `redactUrl`, which hides `session`.
  // `assets` leaves DFX's page only the wallet's own asset on its own chain,
  // so the order DFX hands back is one this wallet can pay. It takes DFX's
  // unique name: DFX also matches bare names, and ETH alone would still
  // offer ETH on Arbitrum, Optimism and Base:
  const url = makePluginUri(guiPlugin, {
    deepPath,
    deepQuery: {
      ...deepQuery,
      assets: `${chain.blockchain}/${chain.asset}`,
      'redirect-uri': redirectUri
    }
  })

  // The fiat amount the user entered in Edge, or '0' for a quote without one:
  const enteredFiatAmount =
    request.amountType === 'fiat' && 'exchangeAmount' in request.amountQuery
      ? request.amountQuery.exchangeAmount
      : '0'
  // DFX's name for the fiat, as makeDfxRequestQuery writes it:
  const dfxFiat = fiatCurrencyCode.replace(/^iso:/i, '').toUpperCase()

  let widgetClosed = false
  let inPayment = false
  // From opening the send scene until it unmounts:
  let sendSceneOpen = false

  const closeWidget = (): void => {
    if (widgetClosed) return
    widgetClosed = true
    navigation.pop()
  }

  // Opens the send scene for the sell order named in DFX's payment
  // redirect, and finishes the sale once it is sent:
  const handlePaymentRedirect = async (uri: string): Promise<void> => {
    // While the send scene is open, ignore every redirect: closing the
    // widget then would remove the WebView from under the send scene. Before
    // then, a cancel still closes the widget, which drops an order whose
    // route is loading. Once the widget is closed, nothing is left to do:
    if (sendSceneOpen || widgetClosed) return

    let order: DfxSellOrder | undefined
    try {
      order = parseDfxSellRedirect(uri, redirectUri, chain)
    } catch (e: unknown) {
      redirect.closeRedirectPage()
      throw e
    }

    // Any payment redirect other than DFX's sell redirect closes the widget,
    // such as DFX's cancel to the bare redirect URI:
    if (order == null) {
      closeWidget()
      return
    }

    // DFX reports the crypto as sent already, so there is nothing to pay.
    // This pops the WebView scene if the WebView had loaded the redirect
    // page, which can happen on Android, and does nothing otherwise:
    if (order.isComplete) {
      redirect.closeRedirectPage()
      return
    }

    if (inPayment) return
    inPayment = true

    const { amount, routeId } = order
    const assetAction: EdgeAssetAction = {
      assetActionType: 'sell'
    }
    let broadcastAttempted = false
    let sendSceneClosed = false
    let broadcastTx: EdgeTransaction | undefined
    // The order on DFX's page can differ from the quote in Edge, so the sale
    // saves DFX's fiat estimate for the crypto that is sent, in the fiat the
    // route pays out. Without one it saves the fiat amount the user entered
    // in Edge when the quote was entered in that fiat, and '0' otherwise:
    let fiatAmount = enteredFiatAmount
    let saleFiatCurrencyCode = fiatCurrencyCode
    try {
      // The estimate resolves to undefined instead of rejecting, so it
      // cannot fail the address fetch:
      const [route, fiatEstimate] = await Promise.all([
        fetchDfxSellRoute(routeId, deepQuery.session, chain),
        fetchDfxSellFiatAmount({
          blockchain: chain.blockchain,
          asset: chain.asset,
          fiat: dfxFiat,
          cryptoAmount: amount
        })
      ])
      if (fiatEstimate != null) fiatAmount = fiatEstimate

      // The user picked another payout currency on DFX's page, so the
      // estimate and the entered amount are in the wrong fiat:
      if (route.fiat != null && route.fiat !== dfxFiat) {
        saleFiatCurrencyCode = `iso:${route.fiat}`
        fiatAmount =
          (await fetchDfxSellFiatAmount({
            blockchain: chain.blockchain,
            asset: chain.asset,
            fiat: route.fiat,
            cryptoAmount: amount
          })) ?? '0'
      }
      const { depositAddress } = route

      // The user left the widget while the route loaded:
      if (widgetClosed) {
        inPayment = false
        return
      }

      // DFX can send more decimal places than the asset has. Round down,
      // so the user never sends more than DFX asked for:
      const { multiplier } = getExchangeDenom(wallet.currencyConfig, tokenId)
      const nativeAmount = floor(mul(amount, multiplier), 0)
      if (!gt(nativeAmount, '0')) {
        throw new Error(`DFX sell amount ${amount} is below the smallest unit`)
      }

      const savedAction: EdgeTxActionFiat = {
        actionType: 'fiat',
        orderId: routeId,
        isEstimate: true,
        fiatPlugin: {
          providerId: pluginId,
          providerDisplayName: displayName
        },
        payinAddress: depositAddress,
        cryptoAsset: {
          pluginId: wallet.currencyInfo.pluginId,
          tokenId,
          nativeAmount
        },
        fiatAsset: {
          fiatCurrencyCode: saleFiatCurrencyCode,
          fiatAmount
        }
      }

      const spendInfo: EdgeSpendInfo = {
        tokenId,
        assetAction,
        savedAction,
        spendTargets: [
          {
            nativeAmount,
            publicAddress: depositAddress
          }
        ]
      }

      const sendParams: SendScene2Params = {
        walletId: wallet.id,
        tokenId,
        spendInfo,
        dismissAlert: true,
        lockTilesMap: {
          address: true,
          amount: true,
          wallet: true
        },
        hiddenFeaturesMap: {
          address: true
        }
      }

      // The send scene calls onBack whenever it unmounts, so wait for it
      // here: leaving without sending lands in the catch below.
      await new Promise<EdgeTransaction>((resolve, reject) => {
        navigation.navigate('send2', {
          ...sendParams,
          // The default broadcast, wrapped to record that the signed
          // transaction was handed to the network:
          alternateBroadcast: async (signedTx: EdgeTransaction) => {
            // Leaving the scene does not stop a send that is still
            // signing. The order is open for a retry by then, so that send
            // must not go out:
            if (sendSceneClosed) {
              throw new Error('DFX sell send scene closed before broadcast')
            }
            broadcastAttempted = true
            try {
              broadcastTx = await wallet.broadcastTx(signedTx)
              return broadcastTx
            } catch (e: unknown) {
              // The wallet refused the spend before submitting anything:
              if (asMaybePendingFundsError(e) != null) {
                broadcastAttempted = false
              }
              throw e
            }
          },
          onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
            if (error != null) {
              reject(error)
            } else if (edgeTransaction != null) {
              resolve(edgeTransaction)
            } else {
              reject(new Error(SendErrorNoTransaction))
            }
          },
          onBack: () => {
            sendSceneOpen = false
            sendSceneClosed = true
            // Backing out after the broadcast went through still completes
            // the sale:
            if (broadcastTx != null) {
              resolve(broadcastTx)
            } else {
              reject(new Error(SendErrorBackPressed))
            }
          }
        })
        // Set only once the scene is on its way, so a navigation that
        // throws can't leave every later redirect ignored. The scene can't
        // unmount (onBack) before navigate returns:
        sendSceneOpen = true
      })
    } catch (e: unknown) {
      if (broadcastAttempted) {
        // The send may have reached the network, so close the widget and
        // keep the guard set: this order cannot open a second send.
        closeWidget()
      } else {
        // Nothing was sent (the user left, signing failed, or the wallet
        // refused the spend), so the order can open the send scene again.
        // A send still in flight is refused at the broadcast above.
        inPayment = false

        // A user who left the widget while the route loaded is done with
        // the order:
        if (widgetClosed) return

        // DFX's page still shows the order, so the user returns to it. This
        // pops the WebView scene if the WebView had loaded the redirect
        // page, which can happen on Android, and does nothing otherwise:
        redirect.closeRedirectPage()
      }

      if (e instanceof Error && e.message === SendErrorNoTransaction) {
        showToast(
          lstrings.fiat_plugin_sell_failed_to_send_try_again,
          NOT_SUCCESS_TOAST_HIDE_MS
        )
      } else if (e instanceof Error && e.message === SendErrorBackPressed) {
        // Do nothing
      } else {
        showError(e)
      }
      return
    }

    // The funds are sent and the send scene closed itself, so a failure
    // from here on is a plain error:
    try {
      closeWidget()

      onLogEvent('Sell_Success', {
        conversionValues: {
          conversionType: 'sell',
          destFiatCurrencyCode: saleFiatCurrencyCode,
          destFiatAmount: fiatAmount,
          sourceAmount: new CryptoAmount({
            currencyConfig: wallet.currencyConfig,
            tokenId,
            exchangeAmount: amount
          }),
          fiatProviderId: pluginId,
          orderId: routeId
        }
      })

      // DFX pays out by bank transfer, so this does not promise a payout
      // time the way other sells do:
      showToast(lstrings.fiat_plugin_sell_complete_title)
    } finally {
      inPayment = false
    }
  }

  const redirect = makeSellPaymentRedirect({
    navigation,
    onPaymentRedirect: handlePaymentRedirect
  })

  navigation.navigate('guiPluginWebView', {
    url,
    onClose: () => {
      widgetClosed = true
    },
    onShouldStartLoad: redirect.onShouldStartLoad,
    // The WebView scene shows any error this rejects with:
    onUrlChange: redirect.onUrlChange
  })
}
