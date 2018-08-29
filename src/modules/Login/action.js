// @flow

import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import _ from 'lodash'
import { Platform } from 'react-native'
import Locale from 'react-native-locale'
import PushNotification from 'react-native-push-notification'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import * as ACCOUNT_API from '../Core/Account/api'
import { loggedIn } from '../Core/Account/reducer.js'
import * as SETTINGS_API from '../Core/Account/settings.js'
// Login/action.js
import * as CORE_SELECTORS from '../Core/selectors'
import { updateWalletsRequest } from '../Core/Wallets/action.js'
import type { Dispatch, GetState } from '../ReduxTypes'
import { insertWalletIdsForProgress } from '../UI/Wallets/action.js'
import { getReceiveAddresses } from '../utils.js'

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

export const initializeAccount = (account: EdgeAccount, touchIdInfo: Object) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch(loggedIn(account))

  const walletInfos = account.allKeys
  const filteredWalletInfos = walletInfos.map(({ keys, id, ...info }) => info)
  console.log('Wallet Infos:', filteredWalletInfos)

  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  let otpResetPending = false
  try {
    const accounts = await context.fetchLoginMessages()
    for (const key in accounts) {
      if (key === account.username) {
        otpResetPending = accounts[key].otpResetPending
      }
    }
  } catch (e) {
    console.log(e)
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
    walletId: '',
    currencyCode: '',
    currencyPlugins: [],
    otpInfo: { enabled: account.otpKey != null, otpKey: account.otpKey, otpResetPending },
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
    currencyWallets: {},
    passwordReminder: {},
    isAccountBalanceVisible: false,
    isWalletFiatBalanceVisible: false,
    spendingLimits: {},
    passwordRecoveryRemindersShown: SETTINGS_API.PASSWORD_RECOVER_REMINDERS_SHOWN
  }
  try {
    for (const pluginName in account.currencyTools) {
      const { currencyInfo } = account.currencyTools[pluginName]
      const { currencyCode } = currencyInfo
      currencyInfo.walletTypes.forEach(type => {
        currencyCodes[type] = currencyCode
      })
      accountInitObject.currencyPlugins.push({ pluginName, currencyInfo })
    }
    if (account.activeWalletIds.length < 1) {
      // we are going to assume that since there is no wallets, this is a first time user
      Actions[Constants.ONBOARDING]()
      // set the property on the user so that we can launch on boarding
      // lets create the wallet
      const ethWalletName = s.strings.string_first_ethereum_wallet_name
      const btcWalletName = s.strings.string_first_bitcoin_wallet_name
      const bchWalletName = s.strings.string_first_bitcoincash_wallet_name
      const ethWalletType = Constants.ETHEREUM_WALLET
      const btcWalletType = Constants.BITCOIN_WALLET
      const bchWalletType = Constants.BITCOINCASH_WALLET
      let fiatCurrencyCode = Constants.USD_FIAT
      if (localeInfo.currencyCode && typeof localeInfo.currencyCode === 'string' && localeInfo.currencyCode.length >= 3) {
        fiatCurrencyCode = 'iso:' + localeInfo.currencyCode
      }
      let edgeWallet
      if (global.currencyCode) {
        let walletType, walletName
        // We got installed via a currencyCode referral. Only create one wallet of that type
        for (const pluginName in account.currencyTools) {
          const { currencyInfo } = account.currencyTools[pluginName]
          if (currencyInfo.currencyCode.toLowerCase() === global.currencyCode.toLowerCase()) {
            walletType = currencyInfo.walletTypes[0]
            walletName = sprintf(s.strings.my_crypto_wallet_name, currencyInfo.currencyName)
            edgeWallet = await ACCOUNT_API.createCurrencyWalletRequest(account, walletType, { name: walletName, fiatCurrencyCode })
            global.firebase && global.firebase.analytics().logEvent(`Signup_Wallets_Created`)
          }
        }
      }
      if (!edgeWallet) {
        edgeWallet = await ACCOUNT_API.createCurrencyWalletRequest(account, btcWalletType, { name: btcWalletName, fiatCurrencyCode })
        await ACCOUNT_API.createCurrencyWalletRequest(account, bchWalletType, { name: bchWalletName, fiatCurrencyCode })
        await ACCOUNT_API.createCurrencyWalletRequest(account, ethWalletType, { name: ethWalletName, fiatCurrencyCode })
        global.firebase && global.firebase.analytics().logEvent(`Signup_Wallets_Created`)
      }
      accountInitObject.walletId = edgeWallet.id
      accountInitObject.currencyCode = edgeWallet.currencyInfo.currencyCode
    } else {
      // We have a wallet
      Actions[Constants.EDGE]()
      const { walletId, currencyCode } = ACCOUNT_API.getFirstActiveWalletInfo(account, currencyCodes)
      accountInitObject.walletId = walletId
      accountInitObject.currencyCode = currencyCode
    }
    const activeWalletIds = account.activeWalletIds
    dispatch(insertWalletIdsForProgress(activeWalletIds))
    const archivedWalletIds = account.archivedWalletIds
    const currencyWallets = account.currencyWallets

    accountInitObject.activeWalletIds = activeWalletIds
    accountInitObject.archivedWalletIds = archivedWalletIds
    accountInitObject.currencyWallets = currencyWallets

    for (const walletId of Object.keys(currencyWallets)) {
      const edgeWallet: EdgeCurrencyWallet = currencyWallets[walletId]
      if (edgeWallet.type === 'wallet:ethereum') {
        if (state.ui.wallets && state.ui.wallets.byId && state.ui.wallets.byId[walletId]) {
          const enabledTokens = state.ui.wallets.byId[walletId].enabledTokens
          const customTokens = state.ui.settings.customTokens
          const enabledNotHiddenTokens = enabledTokens.filter(token => {
            let isVisible = true // assume we will enable token
            const tokenIndex = _.findIndex(customTokens, item => item.currencyCode === token)
            // if token is not supposed to be visible, not point in enabling it
            if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
            return isVisible
          })
          edgeWallet.enableTokens(enabledNotHiddenTokens)
        }
      }
    }

    const settings = await SETTINGS_API.getSyncedSettings(account)
    const syncDefaults = SETTINGS_API.SYNCED_ACCOUNT_DEFAULTS
    const syncFinal = { ...syncDefaults, ...settings }
    const customTokens = settings ? settings.customTokens : []
    accountInitObject.autoLogoutTimeInSeconds = syncFinal.autoLogoutTimeInSeconds
    accountInitObject.defaultFiat = syncFinal.defaultFiat
    accountInitObject.merchantMode = syncFinal.merchantMode
    accountInitObject.customTokens = syncFinal.customTokens
    accountInitObject.passwordRecoveryRemindersShown = syncFinal.passwordRecoveryRemindersShown
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
    accountInitObject.passwordReminder = localFinal.passwordReminder
    accountInitObject.isAccountBalanceVisible = localFinal.isAccountBalanceVisible
    accountInitObject.isWalletFiatBalanceVisible = localFinal.isWalletFiatBalanceVisible
    accountInitObject.spendingLimits = localFinal.spendingLimits

    accountInitObject.pinLoginEnabled = await context.pinLoginEnabled(account.username)

    const coreSettings = await SETTINGS_API.getCoreSettings(account)
    const coreDefaults = SETTINGS_API.CORE_DEFAULTS
    const coreFinal = { ...coreDefaults, ...coreSettings }
    accountInitObject.pinMode = coreFinal.pinMode
    accountInitObject.otpMode = coreFinal.otpMode

    const receiveAddresses = await getReceiveAddresses(currencyWallets)

    dispatch(
      actions.dispatchActionObject(Constants.ACCOUNT_INIT_COMPLETE, {
        ...accountInitObject,
        receiveAddresses
      })
    )
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
