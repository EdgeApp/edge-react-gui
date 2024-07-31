import { EdgeCurrencyWallet, EdgeParsedUri, EdgeTokenId } from 'edge-core-js'

import { launchPriceChangeBuySellSwapModal } from '../components/modals/PriceChangeBuySellSwapModal'
import { pickWallet } from '../components/modals/WalletListModal'
import { showError, showToast, showToastSpinner } from '../components/services/AirshipInstance'
import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { lstrings } from '../locales/strings'
import { executePlugin } from '../plugins/gui/fiatPlugin'
import { DeepLink } from '../types/DeepLinkTypes'
import { Dispatch, RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { EdgeAsset } from '../types/types'
import { logEvent } from '../util/tracking'
import { base58ToUuid } from '../util/utils'
import { activatePromotion } from './AccountReferralActions'
import { checkAndShowLightBackupModal } from './BackupModalActions'
import { DEEPLINK_MODAL_FNS } from './DeepLinkingModalActions'
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
export function retryPendingDeepLink(navigation: NavigationBase): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { pendingDeepLink } = state
    if (pendingDeepLink == null) return
    // Clear the link as we try to handle
    dispatch({ type: 'DEEP_LINK_HANDLED' })

    const handled = handleLink(navigation, dispatch, state, pendingDeepLink).catch(err => {
      console.warn(err)
      return false
    })

    // If we didn't handled the link, put it back
    if (!handled) {
      dispatch({ type: 'DEEP_LINK_RECEIVED', data: pendingDeepLink })
    }
  }
}

/**
 * Launches a link if it app is able to do so.
 */
export async function handleLink(navigation: NavigationBase, dispatch: Dispatch, state: RootState, link: DeepLink): Promise<boolean> {
  const { account, disklet } = state.core
  const { defaultIsoFiat } = state.ui.settings
  const { activeWalletIds, currencyWallets } = account
  const deviceId = base58ToUuid(state.core.context.clientId)

  // Wait for all wallets to load before handling deep links
  const allWalletsLoaded = activeWalletIds.length === Object.keys(currencyWallets).length

  switch (link.type) {
    case 'edgeLogin':
      if (!state.ui.settings.settingsLoaded) return false
      navigation.push('edgeLogin', { lobbyId: link.lobbyId })
      return true

    case 'passwordRecovery':
      await dispatch(
        logoutRequest(navigation, {
          passwordRecoveryKey: link.passwordRecoveryKey
        })
      )
      return true

    case 'plugin': {
      if (!state.ui.settings.settingsLoaded) return false
      const { pluginId, path, query } = link
      const plugin = guiPlugins[pluginId]
      if (plugin?.pluginId == null || plugin?.pluginId === 'custom') {
        showError(`No plugin named "${pluginId}" exists`)
        return true
      }

      // Check the disabled status:
      if (state.ui.exchangeInfo.buy.disablePlugins[pluginId] === true || state.ui.exchangeInfo.sell.disablePlugins[pluginId] === true) {
        showError(`Plugin "${pluginId}" is disabled`)
        return true
      }

      navigation.push('pluginView', {
        plugin,
        deepPath: path,
        deepQuery: query
      })
      return true
    }

    case 'fiatPlugin': {
      if (!state.ui.settings.settingsLoaded) return false
      const { direction = 'buy', paymentType = 'credit', pluginId, providerId } = link
      const plugin = guiPlugins[pluginId]
      if (plugin?.nativePlugin == null) {
        showError(new Error(`No fiat plugin named "${pluginId}" exists`))
        return true
      }

      // Check the disabled status:
      const disableProviders = state.ui.exchangeInfo[direction].disablePlugins[pluginId] ?? {}
      if (disableProviders === true) {
        showError(`Plugin "${pluginId}" is disabled`)
        return true
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
        onLogEvent: (event, values) => dispatch(logEvent(event, values))
      })
      return true
    }

    case 'promotion': {
      if (!state.ui.settings.settingsLoaded) return false
      if (!state.account.accountReferralLoaded) return false
      const { installerId = '' } = link
      await dispatch(activatePromotion(installerId))
      return true
    }

    case 'requestAddress': {
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      await doRequestAddress(navigation, state.core.account, dispatch, link)
      return true
    }

    case 'swap': {
      if (!state.ui.settings.settingsLoaded) return false
      navigation.navigate('swapTab', { screen: 'swapCreate' })
      return true
    }

    case 'azteco': {
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      const result = await pickWallet({ account, assets: [{ pluginId: 'bitcoin', tokenId: null }], navigation, showCreateWallet: true })
      if (result?.type !== 'wallet') {
        // pickWallet returning undefined means user has no matching wallet.
        // This should never happen. Even if the user doesn't have a bitcoin wallet, they will be presented with
        // the option to create one.
        return true
      }
      const { walletId } = result

      // User backed out of choosing a wallet
      if (walletId == null) return true
      const edgeWallet = currencyWallets[walletId]
      await launchAzteco(navigation, edgeWallet, link.uri)
      return true
    }

    case 'walletConnect': {
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      const { uri } = link
      navigation.push('wcConnections', { uri })
      return true
    }

    case 'paymentProto': {
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      await launchPaymentProto(navigation, account, link.uri, { hideScamWarning: false })
      return true
    }

    case 'price-change': {
      if (!state.ui.settings.settingsLoaded) return false
      await dispatch(launchPriceChangeBuySellSwapModal(navigation, link))
      return true
    }

    case 'other': {
      if (!state.ui.settings.settingsLoaded) return false
      const matchingWalletIdsAndUris: Array<{ walletId: string; parsedUri: EdgeParsedUri; tokenId: EdgeTokenId }> = []
      const assets: EdgeAsset[] = []

      const parseWallets = async (): Promise<void> => {
        // Try to parse with all wallets
        for (const wallet of Object.values(currencyWallets)) {
          const { pluginId } = wallet.currencyInfo
          const parsedUri = await wallet.parseUri(link.uri).catch(e => undefined)
          if (parsedUri != null) {
            const { tokenId = null } = parsedUri
            matchingWalletIdsAndUris.push({ walletId: wallet.id, parsedUri, tokenId })
            assets.push({ pluginId, tokenId })
          }
        }
      }
      const promise = parseWallets()
      await showToastSpinner(lstrings.scan_parsing_link, promise)

      // Check if the uri matches one of the wallet types that we could create. In such a case, link.uri
      // would be of the format 'dogecoin:QUE1U9n3kMYR...'
      const [linkCurrency] = link.uri.split(':')
      const createWalletAsset = CREATE_WALLET_ASSETS[linkCurrency]

      if (matchingWalletIdsAndUris.length === 0 && createWalletAsset == null) {
        if (!allWalletsLoaded) return false

        showToast(lstrings.alert_deep_link_no_wallet_for_uri)
        return true
      }

      if (matchingWalletIdsAndUris.length === 1) {
        const { walletId, parsedUri } = matchingWalletIdsAndUris[0]
        await dispatch(handleWalletUris(navigation, currencyWallets[walletId], parsedUri))
        return true
      }

      if (createWalletAsset != null) {
        assets.push(createWalletAsset)
      }

      const walletListResult = await pickWallet({ account, assets, navigation, showCreateWallet: true })
      if (walletListResult == null) {
        return true
      }

      // User backed out of choosing a wallet
      if (walletListResult.type !== 'wallet') return true

      const pickedWallet = account.currencyWallets[walletListResult.walletId]
      if (pickedWallet == null) return true

      // Reparse the uri with the final chosen wallet just in case this was a URI for a wallet
      // we didn't have
      const finalParsedUri = await pickedWallet.parseUri(link.uri)
      await dispatch(handleWalletUris(navigation, pickedWallet, finalParsedUri))
      return true
    }

    case 'scene': {
      const { sceneName, query } = link
      try {
        // @ts-expect-error
        navigation.navigate(sceneName, query)
      } catch (e) {
        showError(`Deeplink failed. Unable to navigate to: '${sceneName}' with query '${query}'`)
      }
      return true
    }

    case 'modal': {
      const { modalName } = link
      try {
        await DEEPLINK_MODAL_FNS[modalName](navigation)
      } catch (e) {
        showError(`Deeplink failed. Unable to open modal: '${modalName}'`)
      }
      return true
    }

    case 'noop': {
      return true
    }
  }

  async function launchAzteco(navigation: NavigationBase, edgeWallet: EdgeCurrencyWallet, uri: string): Promise<void> {
    if (checkAndShowLightBackupModal(account, navigation)) return

    const address = await edgeWallet.getReceiveAddress({ tokenId: null })
    const response = await fetch(`${uri}${address.publicAddress}`)
    if (response.ok) {
      showToast(lstrings.azteco_success)
    } else if (response.status === 400) {
      showError(lstrings.azteco_invalid_code)
    } else {
      showError(lstrings.azteco_service_unavailable)
    }
    navigation.navigate('homeTab', { screen: 'home' })
  }
}
