import { EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'

import { launchPriceChangeBuySellSwapModal } from '../components/modals/PriceChangeBuySellSwapModal'
import { pickWallet } from '../components/modals/WalletListModal'
import { showError, showToast } from '../components/services/AirshipInstance'
import { guiPlugins } from '../constants/plugins/GuiPlugins'
import s from '../locales/strings'
import { asFiatPaymentType } from '../plugins/gui/fiatPluginTypes'
import { DeepLink } from '../types/DeepLinkTypes'
import { Dispatch, RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { EdgeTokenId } from '../types/types'
import { getTokenId } from '../util/CurrencyInfoHelpers'
import { activatePromotion } from './AccountReferralActions'
import { launchPaymentProto } from './PaymentProtoActions'
import { doRequestAddress, handleWalletUris } from './ScanActions'

/**
 * The app has just received some of link,
 * so try to follow it if possible, or save it for later if not.
 */
export function launchDeepLink(navigation: NavigationBase, link: DeepLink): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    dispatch({ type: 'DEEP_LINK_HANDLED' })

    const handled = await handleLink(navigation, dispatch, state, link)
    // If we couldn't handle the link, save it for later:
    if (!handled) {
      dispatch({ type: 'DEEP_LINK_RECEIVED', data: link })
    }
  }
}

/**
 * The deep linking manager calls this as the wallet list changes.
 * Maybe we were in the wrong state before, but now we are able
 * to launch the link.
 */
export function retryPendingDeepLink(navigation: NavigationBase): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { pendingDeepLink } = state
    if (pendingDeepLink == null) return
    dispatch({ type: 'DEEP_LINK_HANDLED' })

    const handled = await handleLink(navigation, dispatch, state, pendingDeepLink)
    // If we handled the link, clear it:
    if (!handled) {
      dispatch({ type: 'DEEP_LINK_RECEIVED', data: pendingDeepLink })
    }
  }
}

/**
 * Launches a link if it app is able to do so.
 */
export async function handleLink(navigation: NavigationBase, dispatch: Dispatch, state: RootState, link: DeepLink): Promise<boolean> {
  const { account } = state.core
  const { activeWalletIds, currencyWallets } = account
  const isLoggedIn = state.isLoggedIn

  // Wait for all wallets to load before handling deep links
  const allWalletsLoaded = activeWalletIds.length === Object.keys(currencyWallets).length

  // We can't handle any links without being logged into the app:
  if (!isLoggedIn) return false

  switch (link.type) {
    case 'edgeLogin':
      navigation.push('edgeLogin', { lobbyId: link.lobbyId })
      return true

    // The login scene always handles this one:
    case 'passwordRecovery':
      return false

    case 'plugin': {
      const { direction, paymentType: pType, pluginId, providerId, path, query } = link
      const plugin = guiPlugins[pluginId]
      if (pluginId === 'custom' || plugin == null || plugin.pluginId == null) {
        showError(new Error(`No plugin named ${pluginId} exists`))
        return true
      }

      const paymentType = pType === '' ? undefined : asFiatPaymentType(pType)

      if (direction == null) return true
      if (direction === 'buy') {
        navigation.navigate('pluginListBuy', { direction: 'buy', pluginId, providerId, deepPath: path, deepQuery: query, paymentType })
      } else if (direction === 'sell') {
        navigation.navigate('pluginListSell', { direction: 'sell', pluginId, providerId, deepPath: path, deepQuery: query, paymentType })
      } else {
        throw new Error(`Invalid plugin direction ${direction}`)
      }
      return true
    }

    case 'promotion': {
      if (!state.account.accountReferralLoaded) return false
      const { installerId = '' } = link
      dispatch(activatePromotion(installerId))
      return true
    }

    case 'requestAddress': {
      if (!allWalletsLoaded) return false
      doRequestAddress(navigation, state.core.account, dispatch, link)
      return true
    }

    case 'swap': {
      navigation.navigate('exchangeTab', { screen: 'exchange' })
      return true
    }

    case 'azteco': {
      if (!allWalletsLoaded) return false
      const result = await pickWallet({ account, assets: [{ pluginId: 'bitcoin' }], navigation, showCreateWallet: true })
      if (result == null) {
        // pickWallet returning undefined means user has no matching wallet.
        // This should never happen. Even if the user doesn't have a bitcoin wallet, they will be presented with
        // the option to create one.
        return true
      }
      const { walletId } = result

      // User backed out of choosing a wallet
      if (walletId == null) return true
      const edgeWallet = currencyWallets[walletId]
      launchAzteco(navigation, edgeWallet, link.uri).catch(showError)
      return true
    }

    case 'walletConnect': {
      if (!allWalletsLoaded) return false
      const { uri, isSigning } = link
      navigation.push('wcConnections', {})
      // Hack around our router's horrible bugs:
      if (!isSigning) setTimeout(() => navigation.push('wcConnect', { uri }), 100)
      return true
    }

    case 'paymentProto': {
      if (!allWalletsLoaded) return false
      launchPaymentProto(navigation, account, link.uri, {}).catch(showError)
      return true
    }

    case 'price-change': {
      dispatch(launchPriceChangeBuySellSwapModal(navigation, link))
      return true
    }

    case 'other': {
      const matchingWalletIdsAndUris: Array<{ walletId: string; parsedUri: EdgeParsedUri; currencyCode?: string; tokenId?: string }> = []

      // Try to parse with all wallets
      for (const wallet of Object.values(currencyWallets)) {
        const parsedUri = await wallet.parseUri(link.uri).catch(e => undefined)
        if (parsedUri != null) {
          if (parsedUri.currencyCode != null && parsedUri.currencyCode !== wallet.currencyInfo.currencyCode) {
            // Check if the user has this token enabled
            const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, parsedUri.currencyCode)
            if (tokenId != null) {
              matchingWalletIdsAndUris.push({ currencyCode: parsedUri.currencyCode, walletId: wallet.id, parsedUri, tokenId })
            }
          } else {
            matchingWalletIdsAndUris.push({ currencyCode: parsedUri.currencyCode, walletId: wallet.id, parsedUri })
          }
        }
      }

      if (matchingWalletIdsAndUris.length === 0) {
        if (!allWalletsLoaded) return false

        showError(s.strings.alert_deep_link_no_wallet_for_uri)
        return true
      }

      if (matchingWalletIdsAndUris.length === 1) {
        const { walletId, parsedUri } = matchingWalletIdsAndUris[0]
        dispatch(handleWalletUris(navigation, currencyWallets[walletId], parsedUri))
        return true
      }

      const allowedWalletIds = matchingWalletIdsAndUris.map(wid => wid.walletId)
      const assets: EdgeTokenId[] = matchingWalletIdsAndUris.map(({ currencyCode: cc, tokenId, walletId }) => {
        const wallet = currencyWallets[walletId]
        const { pluginId } = wallet.currencyInfo

        if (cc == null) return { pluginId }
        return { pluginId, tokenId }
      })
      const walletListResult = await pickWallet({ account, allowedWalletIds, assets, navigation })
      if (walletListResult == null) {
        showError(s.strings.scan_camera_no_matching_wallet)
        return true
      }

      // User backed out of choosing a wallet
      if (walletListResult.walletId == null) return true
      const widUri = matchingWalletIdsAndUris.find(({ walletId }) => walletId === walletListResult.walletId)

      if (widUri == null) {
        // This should never happen. The picked wallet should come from the list of matching wallet IDs
        showError('Internal Error: Missing wallet ID for chosen wallet')
        return true
      }
      const { parsedUri, walletId } = widUri
      dispatch(handleWalletUris(navigation, currencyWallets[walletId], parsedUri))
      return true
    }

    case 'dev': {
      // @ts-expect-error
      if (!global.__DEV__) return false

      navigation.push(link.sceneName, {})
      return true
    }
  }

  return false
}

async function launchAzteco(navigation: NavigationBase, edgeWallet: EdgeCurrencyWallet, uri: string): Promise<void> {
  const address = await edgeWallet.getReceiveAddress()
  const response = await fetch(`${uri}${address.publicAddress}`)
  if (response.ok) {
    showToast(s.strings.azteco_success)
  } else if (response.status === 400) {
    showError(s.strings.azteco_invalid_code)
  } else {
    showError(s.strings.azteco_service_unavailable)
  }
  navigation.navigate('walletsTab', { screen: 'walletList' })
}
