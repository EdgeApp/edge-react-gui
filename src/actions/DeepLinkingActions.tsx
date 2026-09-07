import { mul } from 'biggystring'
import type { EdgeAccount, EdgeParsedUri, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { Linking } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { FundAccountModal } from '../components/modals/FundAccountModal'
import {
  pickWallet,
  type WalletListWalletResult
} from '../components/modals/WalletListModal'
import {
  Airship,
  showError,
  showToast,
  showToastSpinner
} from '../components/services/AirshipInstance'
import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import {
  executePlugin,
  fiatProviderDeeplinkHandler
} from '../plugins/gui/fiatPlugin'
import { rampDeeplinkManager } from '../plugins/ramps/rampDeeplinkHandler'
import { getExchangeDenom } from '../selectors/DenominationSelectors'
import { config } from '../theme/appConfig'
import type { DeepLink } from '../types/DeepLinkTypes'
import type { Dispatch, RootState, ThunkAction } from '../types/reduxTypes'
import type { NavigationBase } from '../types/routerTypes'
import type { EdgeAsset } from '../types/types'
import { logEvent } from '../util/tracking'
import { base58ToUuid, isEmail } from '../util/utils'
import { activatePromotion } from './AccountReferralActions'
import { checkAndShowLightBackupModal } from './BackupModalActions'
import { logoutRequest } from './LoginActions'
import { launchPaymentProto } from './PaymentProtoActions'
import { doRequestAddress, handleWalletUris } from './ScanActions'

// These are the asset types that we'll manually check for when deep linking with a
// URI for the format edge://pay/bitcoin/[privateKey]
// Such assets will allow the user to auto create a wallet if they don't have one
const CREATE_WALLET_ASSETS: Record<string, EdgeAsset> = {
  bitcoin: { pluginId: 'bitcoin', tokenId: null },
  bitcoincash: { pluginId: 'bitcoincash', tokenId: null },
  litecoin: { pluginId: 'litecoin', tokenId: null },
  dogecoin: { pluginId: 'dogecoin', tokenId: null },
  dash: { pluginId: 'dash', tokenId: null }
}

/**
 * How much of the app must be loaded before a link can be handled,
 * from least to most demanding:
 *
 * - `loggedOut`: Nothing at all.
 * - `account`: A logged-in account with its settings.
 * - `referral`: Also the account referral state.
 * - `wallets`: Also every wallet in `activeWalletIds`.
 *
 * Wallets take by far the longest to load, so a link that merely navigates
 * should never wait for them.
 */
export type DeepLinkReadiness = 'loggedOut' | 'account' | 'referral' | 'wallets'

/** Compares two `DeepLinkReadiness` levels. Higher means more demanding. */
export const deepLinkReadinessRank: Record<DeepLinkReadiness, number> = {
  loggedOut: 0,
  account: 1,
  referral: 2,
  wallets: 3
}

/**
 * Returns the app state a link needs before `launchDeepLink` can follow it.
 * Keep this in sync with `handleLink` below - a link that reads
 * `account.currencyWallets` or opens a wallet picker needs `wallets`.
 */
export function getDeepLinkReadiness(link: DeepLink): DeepLinkReadiness {
  switch (link.type) {
    // We can always handle recovery links, and there is nothing to wait for
    // when there is nothing to do:
    case 'passwordRecovery':
    case 'noop':
      return 'loggedOut'

    // These write the account referral state, which would clobber the real
    // `CreationReason.json` with default values if it hasn't loaded yet:
    case 'promotion':
      return 'referral'
    case 'affiliate': {
      const inner = getDeepLinkReadiness(link.link)
      return deepLinkReadinessRank[inner] > deepLinkReadinessRank.referral
        ? inner
        : 'referral'
    }

    // Tracking the open needs the account; navigation then waits for whatever
    // the campaign's own link needs, if it carries one:
    case 'marketing': {
      const inner =
        link.link == null ? 'account' : getDeepLinkReadiness(link.link)
      return deepLinkReadinessRank[inner] > deepLinkReadinessRank.account
        ? inner
        : 'account'
    }

    // These search `account.currencyWallets` or open a wallet picker, so a
    // half-loaded account would show an incomplete list or no match at all.
    // `walletConnect` belongs here because `WcConnectionsScene` opens the
    // picker as soon as it mounts with a uri:
    case 'azteco':
    case 'modal':
    case 'other':
    case 'paymentProto':
    case 'paymentRedirect':
    case 'requestAddress':
    case 'rewards':
    case 'walletConnect':
      return 'wallets'

    // These check `state.ui.exchangeInfo` for a disabled plugin. That comes
    // from the info server, which has no readiness flag of its own, so they
    // keep waiting for wallets to give the fetch time to land:
    case 'fiatPlugin':
    case 'plugin':
      return 'wallets'

    // An `exchange` link that names an asset opens the wallet picker, so it
    // belongs with the group above; without one it only navigates:
    case 'rampCreate':
      return link.asset == null ? 'account' : 'wallets'
    case 'swap':
      return link.buyAsset == null && link.sellAsset == null
        ? 'account'
        : 'wallets'

    // Everything else just navigates, or hands off to an already-open scene:
    case 'edgeLogin':
    case 'fiatProvider':
    case 'price-change':
    case 'ramp':
    case 'scene':
      return 'account'
  }
}

/**
 * The app has just received some of link,
 * so try to follow it if possible, or save it for later if not.
 */
// TODO: Remove NavigationBase dependency. Requires inversion of navigation
// control for v7 migration.
export function launchDeepLink(
  navigation: NavigationBase,
  link: DeepLink
): ThunkAction<Promise<boolean>> {
  return async (dispatch, getState) => {
    const state = getState()
    return await handleLink(navigation, dispatch, state, link)
  }
}

/**
 * Follow a link.
 * @returns false when the user backed out of a prompt the link raised (a
 * wallet picker they dismissed), so callers can leave whatever surface sent
 * them here untouched. True otherwise.
 */
async function handleLink(
  navigation: NavigationBase,
  dispatch: Dispatch,
  state: RootState,
  link: DeepLink
): Promise<boolean> {
  const { account, context, disklet } = state.core
  const { defaultIsoFiat } = state.ui.settings
  const { currencyWallets } = account
  const deviceId = base58ToUuid(context.clientId)

  switch (link.type) {
    case 'edgeLogin':
      navigation.push('edgeLogin', {
        lobbyId: link.lobbyId
      })
      break

    case 'passwordRecovery':
      await dispatch(
        logoutRequest(navigation, {
          passwordRecoveryKey: link.passwordRecoveryKey
        })
      )
      break

    case 'plugin': {
      const { pluginId, path, query } = link
      const plugin = guiPlugins[pluginId]
      if (plugin?.pluginId == null || plugin?.pluginId === 'custom') {
        showError(`No plugin named "${pluginId}" exists`)
        break
      }

      // Check the disabled status:
      if (
        state.ui.exchangeInfo.buy.disablePlugins[pluginId] === true ||
        state.ui.exchangeInfo.sell.disablePlugins[pluginId] === true
      ) {
        showError(`Plugin "${pluginId}" is disabled`)
        break
      }

      navigation.push('pluginView', {
        plugin,
        deepPath: path,
        deepQuery: query
      })
      break
    }

    case 'fiatPlugin': {
      const {
        direction = 'buy',
        paymentType = 'credit',
        pluginId,
        providerId
      } = link
      const plugin = guiPlugins[pluginId]
      if (plugin?.nativePlugin == null) {
        showError(new Error(`No fiat plugin named "${pluginId}" exists`))
        break
      }

      // Check the disabled status:
      const disableProviders =
        state.ui.exchangeInfo[direction].disablePlugins[pluginId] ?? {}
      if (disableProviders === true) {
        showError(`Plugin "${pluginId}" is disabled`)
        break
      }

      await executePlugin({
        account,
        defaultIsoFiat,
        deviceId,
        disablePlugins: disableProviders,
        disklet,
        guiPlugin: plugin,
        direction,
        regionCode: { countryCode: state.ui.settings.countryCode },
        paymentType,
        providerId,
        navigation,
        onLogEvent: (event, values) => {
          dispatch(logEvent(event, values))
        },
        dispatch
      })
      break
    }

    // NOTE: We MUST keep 'fiatProvider' case around indefinitely for backwards compatibility
    // because some buy/sell providers manage the callback URL state (e.g. Simplex).
    // This means we can never really change the callback URL for those providers without
    // breaking the older versions of the app which do not have the ramp plugins.
    // Only until those providers become deprecated or accept parameterized callback URLs,
    // can we remove this deeplink handling.
    case 'fiatProvider': {
      // Handle with ramp deeplink manager first for backward compatibility
      // of some fiat providers (e.g. Simplex) because we cannot upgrade those
      // providers to use the new `/ramp/` deeplink format..
      const result = rampDeeplinkManager.handleDeeplink({
        ...link,
        type: 'ramp'
      })
      if (result.success) {
        break
      }
      // Handle with legacy fiat plugin handler
      fiatProviderDeeplinkHandler(link)
      break
    }

    case 'promotion':
      await dispatch(activatePromotion(link.installerId ?? ''))
      break

    case 'affiliate':
      await dispatch(activatePromotion(link.installerId))
      return await handleLink(navigation, dispatch, state, link.link)

    case 'requestAddress':
      await doRequestAddress(navigation, state.core.account, dispatch, link)
      break

    case 'swap': {
      const { buyAsset, sellAsset, promoId } = link

      const toResult = await pickLinkedWallet(account, navigation, buyAsset)
      if (toResult === null) return false
      const fromResult = await pickLinkedWallet(account, navigation, sellAsset)
      if (fromResult === null) return false
      dispatch({ type: 'LINK_PROMO_ID/SET', data: { promoId } })

      // Navigate with no params at all when the link named no asset: passing
      // undefined wallet ids would blank a selection the user already made on
      // the swap scene, which is what a bare `edge://swap` used to preserve.
      navigation.navigate('swapTab', {
        screen: 'swapCreate',
        params:
          fromResult == null && toResult == null
            ? undefined
            : {
                fromWalletId: fromResult?.walletId,
                fromTokenId: fromResult?.tokenId,
                toWalletId: toResult?.walletId,
                toTokenId: toResult?.tokenId
              }
      })
      break
    }

    case 'azteco': {
      const result = await pickWallet({
        account,
        assets: [{ pluginId: 'bitcoin', tokenId: null }],
        navigation,
        showCreateWallet: true
      })
      if (result?.type !== 'wallet') break
      const wallet = account.currencyWallets[result.walletId]
      if (wallet == null) break

      if (checkAndShowLightBackupModal(account, navigation)) break

      const [address] = await wallet.getAddresses({ tokenId: null })
      if (address == null) {
        showError(lstrings.alert_deep_link_no_wallet_for_uri)
        break
      }
      const response = await fetch(`${link.uri}${address.publicAddress}`)
      if (response.ok) {
        showToast(lstrings.azteco_success)
      } else if (response.status === 400) {
        showError(lstrings.azteco_invalid_code)
      } else {
        showError(lstrings.azteco_service_unavailable)
      }
      navigation.navigate('home')
      break
    }

    case 'walletConnect':
      navigation.push('wcConnections', {
        uri: link.uri
      })
      break

    case 'paymentProto':
      await launchPaymentProto(navigation, account, link.uri, {
        hideScamWarning: false
      })
      break

    case 'paymentRedirect': {
      // A provider sell-completion redirect (e.g. MoonPay "Send with Edge").
      // Resolve the provider's base currency code to candidate assets, then
      // open the Send scene pre-filled with the deposit address, amount, and
      // destination tag / memo so the user can finish the sell order.
      const { currencyCode, depositAddress, amount, addressTag } = link

      // Collect every native AND token asset that shares the symbol, and let
      // the user disambiguate via the wallet picker. A provider sell can be a
      // token whose ticker collides with another chain's native asset (the
      // provider disambiguates by network metadata we do not get here), so we
      // must not exclude token matches when a native one also matches. Iterate
      // `allTokens` (builtin + user-added custom tokens) rather than
      // `builtinTokens`: pickWallet matches wallets by their enabled token ids,
      // which include custom tokens, so a sell of a custom token would
      // otherwise resolve zero assets and wrongly report "no wallet".
      const symbol = currencyCode.split('_')[0].toUpperCase()
      const assets: EdgeAsset[] = []
      for (const pluginId of Object.keys(account.currencyConfig)) {
        const currencyConfig = account.currencyConfig[pluginId]
        if (currencyConfig.currencyInfo.currencyCode.toUpperCase() === symbol) {
          assets.push({ pluginId, tokenId: null })
        }
        const { allTokens } = currencyConfig
        for (const tokenId of Object.keys(allTokens)) {
          if (allTokens[tokenId].currencyCode.toUpperCase() === symbol) {
            assets.push({ pluginId, tokenId })
          }
        }
      }

      if (assets.length === 0) {
        showToast(lstrings.alert_deep_link_no_wallet_for_uri)
        break
      }

      const result = await pickWallet({
        account,
        assets,
        navigation,
        showCreateWallet: true
      })
      if (result?.type !== 'wallet') break
      const { walletId, tokenId } = result
      const wallet = account.currencyWallets[walletId]
      if (wallet == null) break

      // A token-metadata refresh race could leave the picked tokenId
      // unresolvable, in which case getExchangeDenom silently returns a
      // multiplier of '1' and mul() would treat a decimal amount as already
      // native (a wildly wrong send amount). Abort with a toast rather than
      // pre-filling a wrong amount.
      if (
        amount != null &&
        tokenId != null &&
        wallet.currencyConfig.allTokens[tokenId] == null
      ) {
        showToast(lstrings.alert_deep_link_no_wallet_for_uri)
        break
      }
      const nativeAmount =
        amount != null
          ? mul(
              amount,
              getExchangeDenom(wallet.currencyConfig, tokenId).multiplier
            )
          : undefined

      const parsedUri: EdgeParsedUri = {
        publicAddress: depositAddress,
        nativeAmount,
        uniqueIdentifier: addressTag,
        tokenId
      }
      await dispatch(handleWalletUris(navigation, wallet, parsedUri))
      break
    }

    case 'price-change': {
      const { pluginId, body } = link
      const currencyCode =
        account.currencyConfig[pluginId].currencyInfo.currencyCode
      let result
      if (config.disableSwaps === true) {
        result = await Airship.show<'buy' | 'sell' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.price_change_notification}
            message={`${body} ${sprintf(
              lstrings.price_change_buy_sell_trade,
              currencyCode
            )}`}
            buttons={{
              buy: { label: lstrings.title_buy, type: 'secondary' },
              sell: { label: lstrings.title_sell }
            }}
          />
        ))
      } else {
        result = await Airship.show<'buy' | 'sell' | 'exchange' | undefined>(
          bridge => (
            <ButtonsModal
              bridge={bridge}
              title={lstrings.price_change_notification}
              message={`${body} ${sprintf(
                lstrings.price_change_buy_sell_trade,
                currencyCode
              )}`}
              buttons={{
                buy: { label: lstrings.title_buy, type: 'secondary' },
                sell: { label: lstrings.title_sell },
                exchange: { label: lstrings.buy_crypto_modal_exchange }
              }}
            />
          )
        )
      }

      if (result === 'buy') {
        navigation.navigate('buyTab', { screen: 'pluginListBuy', params: {} })
      } else if (result === 'sell') {
        navigation.navigate('sellTab', { screen: 'pluginListSell', params: {} })
      } else if (result === 'exchange') {
        navigation.navigate('swapTab', { screen: 'swapCreate' })
      }

      break
    }

    case 'marketing': {
      // The user opened the app from a marketing push. Report it so the
      // campaign's open rate can be tracked. The send UI lives in the internal
      // tools project; the campaignId rides in the push notification payload.
      dispatch(
        logEvent('Push_Notification_Opened', {
          campaignId: link.campaignId
        })
      )
      // Optional navigation: delegate to the shared handler, mirroring the
      // affiliate link. Unsupported targets fall through its existing guards.
      if (link.link != null) {
        return await handleLink(navigation, dispatch, state, link.link)
      }
      break
    }

    case 'other': {
      const matchingWalletIdsAndUris: Array<{
        walletId: string
        parsedUri: EdgeParsedUri
        tokenId: EdgeTokenId
      }> = []
      const assets: EdgeAsset[] = []

      const parseWallets = async (): Promise<void> => {
        // Try to parse with all wallets
        for (const wallet of Object.values(currencyWallets)) {
          const { pluginId } = wallet.currencyInfo
          // Ignore disabled wallets:
          const { keysOnlyMode = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
          if (keysOnlyMode) continue
          const parsedUri = await wallet
            .parseUri(link.uri)
            .catch((_: unknown) => undefined)
          if (parsedUri != null) {
            const { tokenId = null } = parsedUri
            matchingWalletIdsAndUris.push({
              walletId: wallet.id,
              parsedUri,
              tokenId
            })
            assets.push({ pluginId, tokenId })
          }
        }
      }

      const promise = parseWallets()
      await showToastSpinner(lstrings.scan_parsing_link, promise)

      // Check if this is an email for Tron USDT and show warning for potential
      // PIX send
      if (
        isEmail(link.uri) &&
        assets.find(
          asset =>
            asset.pluginId === 'tron' &&
            asset.tokenId === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        ) != null
      ) {
        const approved = await Airship.show<boolean>(bridge => (
          <ConfirmContinueModal
            bridge={bridge}
            title={lstrings.warning_sending_pix_to_email_title}
            body={lstrings.warning_sending_pix_to_email_body}
            warning
            isSkippable
          />
        ))
        if (!approved) {
          return false
        }
      }

      // Check if the uri matches one of the wallet types that we could create. In such a case, link.uri
      // would be of the format 'dogecoin:QUE1U9n3kMYR...'
      const [linkCurrency] = link.uri.split(':')
      const createWalletAsset = CREATE_WALLET_ASSETS[linkCurrency]

      if (matchingWalletIdsAndUris.length === 0 && createWalletAsset == null) {
        showToast(lstrings.alert_deep_link_no_wallet_for_uri)
        break
      }

      if (matchingWalletIdsAndUris.length === 1) {
        const { walletId, parsedUri } = matchingWalletIdsAndUris[0]
        await dispatch(
          handleWalletUris(navigation, currencyWallets[walletId], parsedUri)
        )
        break
      }

      if (createWalletAsset != null) {
        assets.push(createWalletAsset)
      }

      const result = await pickWallet({
        account,
        assets,
        navigation,
        showCreateWallet: true
      })
      if (result?.type !== 'wallet') break
      const wallet = account.currencyWallets[result.walletId]
      if (wallet == null) break

      // Re-parse the uri with the final chosen wallet
      // just in case this was a URI for a wallet we didn't have:
      const finalParsedUri = await wallet.parseUri(link.uri)
      await dispatch(handleWalletUris(navigation, wallet, finalParsedUri))
      break
    }

    case 'scene': {
      try {
        navigation.navigate(link.sceneName as any, link.query as any)
      } catch (e) {
        showError(
          `Deep link failed. Unable to navigate to: '${link.sceneName}'`
        )
      }
      break
    }

    case 'modal': {
      switch (link.modalName) {
        case 'fundAccount':
          await Airship.show(bridge => (
            <FundAccountModal bridge={bridge} navigation={navigation} />
          ))
          break
        default:
          showError(`Unknown modal: '${link.modalName}'`)
      }
      break
    }

    case 'rampCreate': {
      // Open the ramps buy/sell flow, optionally pinning a provider and payment
      // type to the top of the quote results. The pin lives in the navigation
      // params only: nothing is written to the account referral state, and a
      // pin that matches no quote degrades to the normal ordering.
      const { direction, providerId, paymentType, asset, promoId } = link

      // A null result means the user backed out of the wallet picker, so do
      // not push them into the flow anyway. Resolve before stashing the promo
      // id, so a dismissed picker leaves no id behind to mis-attribute a later
      // conversion.
      const forcedWalletResult = await pickLinkedWallet(
        account,
        navigation,
        asset
      )
      if (forcedWalletResult === null) return false
      dispatch({ type: 'LINK_PROMO_ID/SET', data: { promoId } })

      if (direction === 'buy') {
        navigation.navigate('buyTab', {
          screen: 'pluginListBuy',
          params: { providerId, paymentType, forcedWalletResult }
        })
      } else {
        navigation.navigate('sellTab', {
          screen: 'pluginListSell',
          params: { providerId, paymentType, forcedWalletResult }
        })
      }
      break
    }

    case 'ramp': {
      const result = rampDeeplinkManager.handleDeeplink(link)
      if (!result.success) {
        showError(result.error)
      }
      break
    }

    case 'rewards': {
      const { pluginId, tokenId } = link

      // Choose wallet:
      const walletListResult = await pickWallet({
        account,
        assets: [{ pluginId, tokenId }],
        navigation,
        showCreateWallet: true
      })
      if (walletListResult?.type !== 'wallet') break
      const { walletId } = walletListResult
      const wallet = account.currencyWallets[walletId]
      const { publicAddress } = (await wallet.getAddresses({ tokenId }))[0]
      const { currencyCode } =
        tokenId == null
          ? account.currencyConfig[pluginId].currencyInfo
          : account.currencyConfig[pluginId].allTokens[tokenId]

      // Encode data:
      const data = btoa(`edgerewards|${publicAddress}|${currencyCode}`)

      // Open URL:
      await Linking.openURL(`https://edge.app/rewards/?data=${data}`)
      break
    }

    default:
      break
  }
  return true
}

/**
 * Resolve a deep link's asset to one of the account's wallets, offering to
 * create one when the account holds none for that asset. Returns undefined
 * when the link named no asset (nothing to pre-select) and null when the user
 * dismissed the picker, which callers treat as "do not navigate".
 */
async function pickLinkedWallet(
  account: EdgeAccount,
  // Taken from `pickWallet` rather than named directly, so this follows the
  // v7 navigation migration instead of pinning the deprecated flat type.
  navigation: Parameters<typeof pickWallet>[0]['navigation'],
  asset: EdgeAsset | undefined
): Promise<WalletListWalletResult | undefined | null> {
  if (asset == null) return undefined

  const result = await pickWallet({
    account,
    assets: [asset],
    navigation,
    showCreateWallet: true
  })
  return result?.type === 'wallet' ? result : null
}
