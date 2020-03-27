// @flow

import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { showError } from '../components/services/AirshipInstance.js'
import { pluginUrlMap } from '../constants/plugins/GuiPlugins.js'
import { EDGE_LOGIN, PLUGIN_VIEW_DEEP, SCAN } from '../constants/SceneKeys.js'
import s from '../locales/strings.js'
import { type DeepLink } from '../types/DeepLink.js'
import { type Dispatch, type GetState, type State as ReduxState } from '../types/reduxTypes.js'
import { activatePromotion } from './AccountReferralActions.js'
import { loginWithEdge } from './EdgeLoginActions.js'
import { parseScannedUri } from './ScanActions.js'
import { selectWallet } from './WalletActions.js'

/**
 * The app has just received some type of link,
 * so try to follow it if possible, or save it for later if not.
 */
export const launchDeepLink = (link: DeepLink) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  const handled = handleLink(dispatch, state, link)

  // If we couldn't handle the link, save it for later:
  if (!handled) {
    dispatch({ type: 'DEEP_LINK_RECEIVED', data: link })
  }
}

/**
 * The deep linking manager calls this as the wallet list changes.
 * Maybe we were in the wrong state before, but now we are able
 * to launch the link.
 */
export const retryPendingDeepLink = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { pendingDeepLink } = state
  if (pendingDeepLink == null) return

  const handled = handleLink(dispatch, state, pendingDeepLink)

  // If we handled the link, clear it:
  if (handled) {
    dispatch({ type: 'DEEP_LINK_HANDLED' })
  }
}

/**
 * Launches a link if it app is able to do so.
 */
function handleLink (dispatch: Dispatch, state: ReduxState, link: DeepLink): boolean {
  const { activeWalletIds = [], username } = state.core.account
  const { byId = {}, selectedWalletId } = state.ui.wallets
  const hasCurrentWallet = byId[selectedWalletId] != null

  // We can't handle any links without an account:
  if (username == null) return false

  switch (link.type) {
    case 'edgeLogin':
      dispatch(loginWithEdge(link.lobbyId))
      Actions.push(EDGE_LOGIN)
      return true

    // The login scene always handles this one:
    case 'passwordRecovery':
      return false

    case 'plugin':
      if (link.pluginId === 'simplex') {
        const plugin = pluginUrlMap['co.edgesecure.simplex']
        Actions.push(PLUGIN_VIEW_DEEP, { plugin })
      }
      return true

    case 'promotion': {
      if (!state.account.accountReferralLoaded) return false
      const { installerId = '' } = link
      dispatch(activatePromotion(installerId))
      return true
    }

    case 'returnAddress': {
      if (!hasCurrentWallet) return false
      // The code for dealing with this is a mess, so fake a barcode scan:
      Actions.push(SCAN)
      dispatch(parseScannedUri(link.uri))
      return true
    }

    case 'other': {
      if (!hasCurrentWallet) return false
      const currencyName = link.protocol
      const currencyCode = CURRENCY_NAMES[currencyName]

      // If we don't know what this is, fake a barcode scan:
      if (currencyCode == null) {
        Actions.push(SCAN)
        dispatch(parseScannedUri(link.uri))
        return true
      }

      // See if we have a wallet that can handle this currency:
      const walletIds = Object.keys(byId)
      for (const walletId of walletIds) {
        const wallet = byId[walletId]
        if (wallet.currencyCode !== currencyCode) continue
        dispatch(selectWallet(wallet.id, wallet.currencyCode))
        Actions.push(SCAN)
        dispatch(parseScannedUri(link.uri))
        return true
      }

      // Keep waiting while wallets are loading:
      if (walletIds.length !== activeWalletIds.length) return false

      // Show an error:
      const currency = convertCurrencyStringFromCurrencyCode(currencyCode)
      const noWalletMessage = sprintf(s.strings.alert_deep_link_no_wallet, currency, currency)
      showError(noWalletMessage)
      return true
    }
  }

  return false
}

const CURRENCY_NAMES = {
  bitcoin: 'BTC',
  bitcoincash: 'BCH',
  ethereum: 'ETH',
  litecoin: 'LTC',
  dash: 'DASH',
  rsk: 'RBTC'
}

function convertCurrencyStringFromCurrencyCode (code: string): string {
  switch (code) {
    case 'BTC':
      return 'Bitcoin'
    case 'BCH':
      return 'Bitcoin Cash'
    case 'ETH':
      return 'Ethereum'
    case 'LTC':
      return 'Litecoin'
    case 'DASH':
      return 'Dash'
    case 'RBTC':
      return 'RSK'
    default:
      return code
  }
}
