// @flow

import type { AbcAccount, AbcCurrencyWallet } from 'edge-login'
import { Platform } from 'react-native'
import Locale from 'react-native-locale'
import PushNotification from 'react-native-push-notification'
import { Actions } from 'react-native-router-flux'

import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import * as ACCOUNT_API from '../Core/Account/api'
import * as SETTINGS_API from '../Core/Account/settings.js'
// Login/action.js
import * as CONTEXT_API from '../Core/Context/api'
import * as CORE_SELECTORS from '../Core/selectors'
import { updateWalletsRequest } from '../Core/Wallets/action.js'
import type { Dispatch, GetState } from '../ReduxTypes'

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

export const initializeAccount = (account: AbcAccount, touchIdInfo: Object) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  const accounts = await context.fetchLoginMessages()
  let otpResetPending = false
  for (const key in accounts) {
    if (key === account.username) {
      otpResetPending = accounts[key].otpResetPending
    }
  }
  const currencyCodes = {}
  if (Platform.OS === Constants.IOS) {
    PushNotification.configure({
      onNotification: notification => {
        console.log('NOTIFICATION:', notification)
      }
    })
  }
  const accountInitObject = {
    account: account,
    touchIdInfo: touchIdInfo,
    loginStatus: true,
    walletId: '',
    currencyCode: '',
    currencyPlugins: [],
    otpInfo: {enabled: account.otpEnabled, otpKey: account.otpKey, otpResetPending},
    autoLogoutTimeInSeconds: '',
    bluetoothMode: '',
    pinLoginEnabled: false,
    pinMode: false,
    otpMode: false,
    customTokens: '',
    defaultFiat: '',
    merchantMode: '',
    denominationKeys: [],
    customTokensSettings: [],
    activeWalletIds: [],
    archivedWalletIds: [],
    currencyWallets: {}
  }
  try {
    const currencyPlugins = await CONTEXT_API.getCurrencyPlugins(context)
    currencyPlugins.forEach(plugin => {
      plugin.currencyInfo.walletTypes.forEach(type => {
        currencyCodes[type] = plugin.currencyInfo.currencyCode
      })
      const pluginName = plugin.pluginName
      const walletTypes = plugin.currencyInfo.walletTypes
      accountInitObject.currencyPlugins.push({ pluginName, plugin, walletTypes })
    })

    if (account.activeWalletIds.length < 1) {
      // lets create the wallet
      const ethWalletName = s.strings.string_first_ethereum_wallet_name
      const btcWalletName = s.strings.string_first_bitcoin_wallet_name
      const ethWalletType = Constants.ETHEREUM_WALLET
      const btcWalletType = Constants.BITCOIN_WALLET
      let fiatCurrencyCode = Constants.USD_FIAT
      if (localeInfo.currencyCode && typeof localeInfo.currencyCode === 'string' && localeInfo.currencyCode.length >= 3) {
        fiatCurrencyCode = 'iso:' + localeInfo.currencyCode
      }
      const abcWallet = await ACCOUNT_API.createCurrencyWalletRequest(account, ethWalletType, { name: ethWalletName, fiatCurrencyCode })
      await ACCOUNT_API.createCurrencyWalletRequest(account, btcWalletType, { name: btcWalletName, fiatCurrencyCode })
      accountInitObject.walletId = abcWallet.id
      accountInitObject.currencyCode = abcWallet.currencyInfo.currencyCode
    } else {
      // We have a wallet
      const { walletId, currencyCode } = ACCOUNT_API.getFirstActiveWalletInfo(account, currencyCodes)
      accountInitObject.walletId = walletId
      accountInitObject.currencyCode = currencyCode
    }
    const { activeWalletIds, archivedWalletIds, currencyWallets } = account
    for (const walletId of Object.keys(currencyWallets)) {
      const abcWallet: AbcCurrencyWallet = currencyWallets[walletId]
      if (abcWallet.type === 'wallet:ethereum') {
        if (state.ui.wallets && state.ui.wallets.byId && state.ui.wallets.byId[walletId]) {
          const enabledTokens = state.ui.wallets.byId[walletId].enabledTokens
          abcWallet.enableTokens(enabledTokens)
        }
      }
    }
    accountInitObject.activeWalletIds = activeWalletIds
    accountInitObject.archivedWalletIds = archivedWalletIds
    accountInitObject.currencyWallets = currencyWallets

    const settings = await SETTINGS_API.getSyncedSettings(account)
    const syncDefaults = SETTINGS_API.SYNCED_ACCOUNT_DEFAULTS
    const syncFinal = { ...syncDefaults, ...settings }
    const customTokens = settings ? settings.customTokens : []
    accountInitObject.autoLogoutTimeInSeconds = syncFinal.autoLogoutTimeInSeconds
    accountInitObject.defaultFiat = syncFinal.defaultFiat
    accountInitObject.merchantMode = syncFinal.merchantMode
    accountInitObject.customTokens = syncFinal.customTokens
    accountInitObject.denominationKeys.push({ currencyCode: 'BTC', denominationKey: syncFinal.BTC.denomination })
    accountInitObject.denominationKeys.push({ currencyCode: 'BCH', denominationKey: syncFinal.BCH.denomination })
    accountInitObject.denominationKeys.push({ currencyCode: 'ETH', denominationKey: syncFinal.ETH.denomination })
    if (customTokens) {
      customTokens.forEach(token => {
        // dispatch(ADD_TOKEN_ACTIONS.setTokenSettings(token))
        accountInitObject.customTokensSettings.push(token)
        // this second dispatch will be redundant if we set 'denomination' property upon customToken creation
        accountInitObject.denominationKeys.push({ currencyCode: token.currencyCode, denominationKey: token.multiplier })
      })
    }
    const localSettings = await SETTINGS_API.getLocalSettings(account)
    const localDefaults = SETTINGS_API.LOCAL_ACCOUNT_DEFAULTS
    const localFinal = { ...localDefaults, ...localSettings }
    accountInitObject.bluetoothMode = localFinal.bluetoothMode

    accountInitObject.pinLoginEnabled = await context.pinLoginEnabled(account.username)

    const coreSettings = await SETTINGS_API.getCoreSettings(account)
    const coreDefaults = SETTINGS_API.CORE_DEFAULTS
    const coreFinal = { ...coreDefaults, ...coreSettings }
    accountInitObject.pinMode = coreFinal.pinMode
    accountInitObject.otpMode = coreFinal.otpMode
    dispatch(actions.dispatchActionObject(Constants.ACCOUNT_INIT_COMPLETE, accountInitObject))
    // $FlowFixMe
    dispatch(updateWalletsRequest())
  } catch (e) {
    console.log(e)
  }
}

export const logoutRequest = (username?: string) => (dispatch: Dispatch, getState: GetState) => {
  /* Actions.popTo(Constants.LOGIN, {username})

  const state = getState()
  dispatch(SETTINGS_ACTIONS.setLoginStatus(false))

  const account = CORE_SELECTORS.getAccount(state)
  dispatch(logout(username))
  ACCOUNT_API.logoutRequest(account) */
  Actions.popTo(Constants.LOGIN, { username })
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  dispatch(logout(username))
  account.logout()
}
export const deepLinkLogout = (backupKey: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const username = account.username
  Actions.popTo(Constants.LOGIN, { username })
  dispatch(actions.dispatchActionString(Constants.DEEP_LINK_RECEIVED, backupKey))
  // dispatch(logout(Constants.DEEP_LINK_RECEIVED))
  if (!account) {
    account.logout()
  }
}

export const logout = (username?: string) => ({
  type: Constants.LOGOUT,
  data: { username }
})
