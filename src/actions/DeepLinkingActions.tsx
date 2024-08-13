import { EdgeParsedUri, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { FundAccountModal } from '../components/modals/FundAccountModal'
import { pickWallet } from '../components/modals/WalletListModal'
import { Airship, showError, showToast, showToastSpinner } from '../components/services/AirshipInstance'
import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { lstrings } from '../locales/strings'
import { executePlugin, fiatProviderDeeplinkHandler } from '../plugins/gui/fiatPlugin'
import { config } from '../theme/appConfig'
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
    await handleLink(navigation, dispatch, state, link)
  }
}

/**
 * Launches a link if it app is able to do so.
 * @returns true if the link is handled,
 * or false if the app is in the wrong state to handle this link.
 */
async function handleLink(navigation: NavigationBase, dispatch: Dispatch, state: RootState, link: DeepLink): Promise<void> {
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
      if (state.ui.exchangeInfo.buy.disablePlugins[pluginId] === true || state.ui.exchangeInfo.sell.disablePlugins[pluginId] === true) {
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
      const { direction = 'buy', paymentType = 'credit', pluginId, providerId } = link
      const plugin = guiPlugins[pluginId]
      if (plugin?.nativePlugin == null) {
        showError(new Error(`No fiat plugin named "${pluginId}" exists`))
        break
      }

      // Check the disabled status:
      const disableProviders = state.ui.exchangeInfo[direction].disablePlugins[pluginId] ?? {}
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
        onLogEvent: (event, values) => dispatch(logEvent(event, values))
      })
      break
    }

    case 'fiatProvider': {
      fiatProviderDeeplinkHandler(link)
      break
    }

    case 'promotion':
      await dispatch(activatePromotion(link.installerId ?? ''))
      break

    case 'requestAddress':
      await doRequestAddress(navigation, state.core.account, dispatch, link)
      break

    case 'swap':
      navigation.navigate('swapTab', { screen: 'swapCreate' })
      break

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

      const address = await wallet.getReceiveAddress({ tokenId: null })
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
      await launchPaymentProto(navigation, account, link.uri, { hideScamWarning: false })
      break

    case 'price-change': {
      const { pluginId, body } = link
      const currencyCode = account.currencyConfig[pluginId].currencyInfo.currencyCode
      let result
      if (config.disableSwaps === true) {
        result = await Airship.show<'buy' | 'sell' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.price_change_notification}
            message={`${body} ${sprintf(lstrings.price_change_buy_sell_trade, currencyCode)}`}
            buttons={{
              buy: { label: lstrings.title_buy, type: 'secondary' },
              sell: { label: lstrings.title_sell }
            }}
          />
        ))
      } else {
        result = await Airship.show<'buy' | 'sell' | 'exchange' | undefined>(bridge => (
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
      }

      if (result === 'buy') {
        navigation.navigate('buyTab', { screen: 'pluginListBuy' })
      } else if (result === 'sell') {
        navigation.navigate('sellTab', { screen: 'pluginListSell' })
      } else if (result === 'exchange') {
        navigation.navigate('swapTab', { screen: 'swapCreate' })
      }

      break
    }

    case 'other': {
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
        showToast(lstrings.alert_deep_link_no_wallet_for_uri)
        break
      }

      if (matchingWalletIdsAndUris.length === 1) {
        const { walletId, parsedUri } = matchingWalletIdsAndUris[0]
        await dispatch(handleWalletUris(navigation, currencyWallets[walletId], parsedUri))
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
        showError(`Deep link failed. Unable to navigate to: '${link.sceneName}'`)
      }
      break
    }

    case 'modal': {
      switch (link.modalName) {
        case 'fundAccount':
          await Airship.show(bridge => <FundAccountModal bridge={bridge} navigation={navigation} />)
          break
        default:
          showError(`Unknown modal: '${link.modalName}'`)
      }
      break
    }

    default:
      break
  }
}
