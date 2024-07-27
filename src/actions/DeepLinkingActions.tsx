import { EdgeParsedUri, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { FundAccountModal } from '../components/modals/FundAccountModal'
import { pickWallet } from '../components/modals/WalletListModal'
import { Airship, showError, showToast, showToastSpinner } from '../components/services/AirshipInstance'
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
 * @returns true if the link is handled,
 * or false if the app is in the wrong state to handle this link.
 */
async function handleLink(navigation: NavigationBase, dispatch: Dispatch, state: RootState, link: DeepLink): Promise<boolean> {
  const { account, context, disklet } = state.core
  const { defaultIsoFiat } = state.ui.settings
  const { activeWalletIds, currencyWallets, currencyWalletErrors } = account
  const deviceId = base58ToUuid(context.clientId)

  // Wait for all wallets to load before handling deep links
  const allWalletsLoaded = activeWalletIds.every(walletId => currencyWallets[walletId] != null || currencyWalletErrors[walletId] != null)

  switch (link.type) {
    case 'edgeLogin':
      if (!state.ui.settings.settingsLoaded) return false
      navigation.push('edgeLogin', {
        lobbyId: link.lobbyId
      })
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

    case 'promotion':
      if (!state.ui.settings.settingsLoaded) return false
      if (!state.account.accountReferralLoaded) return false
      await dispatch(activatePromotion(link.installerId ?? ''))
      return true

    case 'requestAddress':
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      await doRequestAddress(navigation, state.core.account, dispatch, link)
      return true

    case 'swap':
      if (!state.ui.settings.settingsLoaded) return false
      navigation.navigate('swapTab', { screen: 'swapCreate' })
      return true

    case 'azteco': {
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      const result = await pickWallet({
        account,
        assets: [{ pluginId: 'bitcoin', tokenId: null }],
        navigation,
        showCreateWallet: true
      })
      if (result?.type !== 'wallet') return true
      const wallet = currencyWallets[result.walletId]
      if (wallet == null) return true

      if (checkAndShowLightBackupModal(account, navigation)) return true

      const address = await wallet.getReceiveAddress({ tokenId: null })
      const response = await fetch(`${link.uri}${address.publicAddress}`)
      if (response.ok) {
        showToast(lstrings.azteco_success)
      } else if (response.status === 400) {
        showError(lstrings.azteco_invalid_code)
      } else {
        showError(lstrings.azteco_service_unavailable)
      }
      navigation.navigate('homeTab', { screen: 'home' })
      return true
    }

    case 'walletConnect':
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      navigation.push('wcConnections', {
        uri: link.uri
      })
      return true

    case 'paymentProto':
      if (!state.ui.settings.settingsLoaded) return false
      if (!allWalletsLoaded) return false
      await launchPaymentProto(navigation, account, link.uri, { hideScamWarning: false })
      return true

    case 'price-change': {
      if (!state.ui.settings.settingsLoaded) return false
      const { pluginId, body } = link
      const currencyCode = account.currencyConfig[pluginId].currencyInfo.currencyCode

      const result = await Airship.show<'buy' | 'sell' | 'exchange' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.price_change_notification}
          message={`${body} ${sprintf(lstrings.price_change_buy_sell_trade, currencyCode)}`}
          buttons={{
            buy: { label: lstrings.title_buy, type: 'secondary' },
            sell: { label: lstrings.title_sell },
            exchange: { label: lstrings.buy_crypto_modal_exchange }
          }}
        />
      ))

      if (result === 'buy') {
        navigation.navigate('buyTab', { screen: 'pluginListBuy' })
      } else if (result === 'sell') {
        navigation.navigate('sellTab', { screen: 'pluginListSell' })
      } else if (result === 'exchange') {
        navigation.navigate('swapTab', { screen: 'swapCreate' })
      }

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

      const result = await pickWallet({
        account,
        assets,
        navigation,
        showCreateWallet: true
      })
      if (result?.type !== 'wallet') return true
      const wallet = currencyWallets[result.walletId]
      if (wallet == null) return true

      // Re-parse the uri with the final chosen wallet
      // just in case this was a URI for a wallet we didn't have:
      const finalParsedUri = await wallet.parseUri(link.uri)
      await dispatch(handleWalletUris(navigation, wallet, finalParsedUri))
      return true
    }

    case 'scene': {
      try {
        navigation.navigate(link.sceneName as any, link.query as any)
      } catch (e) {
        showError(`Deep link failed. Unable to navigate to: '${link.sceneName}'`)
      }
      return true
    }

    case 'modal': {
      switch (link.modalName) {
        case 'fundAccount':
          await Airship.show(bridge => <FundAccountModal bridge={bridge} navigation={navigation} />)
          break
        default:
          showError(`Unknown modal: '${link.modalName}'`)
      }
      return true
    }

    case 'noop': {
      return true
    }
  }
}
