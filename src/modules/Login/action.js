// @flow

import type { EdgeAccount } from 'edge-core-js'
import { Platform } from 'react-native'
import Locale from 'react-native-locale'
import PushNotification from 'react-native-push-notification'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { insertWalletIdsForProgress } from '../../actions/WalletActions.js'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import * as ACCOUNT_API from '../Core/Account/api'
import {
  CORE_DEFAULTS,
  LOCAL_ACCOUNT_DEFAULTS,
  LOCAL_ACCOUNT_TYPES,
  PASSWORD_RECOVERY_REMINDERS_SHOWN,
  SYNCED_ACCOUNT_DEFAULTS,
  SYNCED_ACCOUNT_TYPES,
  getCoreSettings,
  getLocalSettings,
  getSyncedSettings,
  setLocalSettings,
  setSyncedSettings
} from '../Core/Account/settings.js'
// Login/action.js
import * as CORE_SELECTORS from '../Core/selectors'
import { updateWalletsRequest } from '../Core/Wallets/action.js'
import type { Dispatch, GetState } from '../ReduxTypes'

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

export const initializeAccount = (account: EdgeAccount, touchIdInfo: Object) => async (dispatch: Dispatch, getState: GetState) => {
  const currencyPlugins = []
  const currencyCodes = {}

  for (const pluginName in account.currencyConfig) {
    const { currencyInfo } = account.currencyConfig[pluginName]
    const { currencyCode } = currencyInfo
    currencyInfo.walletTypes.forEach(type => {
      currencyCodes[type] = currencyCode
    })
    currencyPlugins.push({ pluginName, currencyInfo })
  }
  dispatch({ type: 'ACCOUNT/LOGGED_IN', data: { account, currencyPlugins } })

  account.activeWalletIds.length < 1 ? Actions[Constants.ONBOARDING]() : Actions[Constants.EDGE]()

  const walletInfos = account.allKeys
  const filteredWalletInfos = walletInfos.map(({ keys, id, ...info }) => info)
  console.log('Wallet Infos:', filteredWalletInfos)

  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  if (Platform.OS === Constants.IOS) {
    PushNotification.configure({
      onNotification: notification => {
        console.log('NOTIFICATION:', notification)
      }
    })
  }
  let accountInitObject = {
    account: account,
    touchIdInfo: touchIdInfo,
    walletId: '',
    currencyCode: '',
    currencyPlugins,
    otpInfo: { enabled: account.otpKey != null, otpKey: account.otpKey, otpResetPending: false },
    autoLogoutTimeInSeconds: 3600,
    bluetoothMode: false,
    pinLoginEnabled: false,
    pinMode: false,
    otpMode: false,
    customTokens: [],
    defaultFiat: '',
    defaultIsoFiat: '',
    merchantMode: '',
    denominationKeys: [],
    customTokensSettings: [],
    activeWalletIds: [],
    archivedWalletIds: [],
    passwordReminder: {},
    isAccountBalanceVisible: false,
    isWalletFiatBalanceVisible: false,
    spendingLimits: {},
    passwordRecoveryRemindersShown: PASSWORD_RECOVERY_REMINDERS_SHOWN
  }
  try {
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
        for (const pluginName in account.currencyConfig) {
          const { currencyInfo } = account.currencyConfig[pluginName]
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
    } else if (!state.core.deepLinking.deepLinkPending) {
      // We have a wallet
      Actions[Constants.EDGE]()
      const { walletId, currencyCode } = ACCOUNT_API.getFirstActiveWalletInfo(account, currencyCodes)
      accountInitObject.walletId = walletId
      accountInitObject.currencyCode = currencyCode
    }
    const activeWalletIds = account.activeWalletIds
    dispatch(insertWalletIdsForProgress(activeWalletIds))
    const archivedWalletIds = account.archivedWalletIds

    accountInitObject.activeWalletIds = activeWalletIds
    accountInitObject.archivedWalletIds = archivedWalletIds

    const loadedSyncedSettings = await getSyncedSettings(account)
    const mergedSyncedSettings = mergeSettings(loadedSyncedSettings, SYNCED_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_TYPES)
    if (mergedSyncedSettings.isOverWriteNeeded) {
      setSyncedSettings(account, mergedSyncedSettings)
    }
    accountInitObject = { ...accountInitObject, ...mergedSyncedSettings.finalSettings }

    if (accountInitObject.customTokens) {
      accountInitObject.customTokens.forEach(token => {
        // dispatch(ADD_TOKEN_ACTIONS.setTokenSettings(token))
        accountInitObject.customTokensSettings.push(token)
        // this second dispatch will be redundant if we set 'denomination' property upon customToken creation
        accountInitObject.denominationKeys.push({ currencyCode: token.currencyCode, denominationKey: token.multiplier })
      })
    }
    for (const key in accountInitObject) {
      if (accountInitObject[key]) {
        // avoid trying to look at property 'denomination' of undefined
        const typeofDenomination = typeof accountInitObject[key].denomination
        if (typeofDenomination === 'string') {
          accountInitObject.denominationKeys.push({ currencyCode: key, denominationKey: accountInitObject[key].denomination })
        }
      }
    }
    const loadedLocalSettings = await getLocalSettings(account)
    const mergedLocalSettings = mergeSettings(loadedLocalSettings, LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_TYPES)
    if (mergedLocalSettings.isOverWriteNeeded) {
      setLocalSettings(account, mergedSyncedSettings)
    }
    accountInitObject = { ...accountInitObject, ...mergedLocalSettings.finalSettings }

    accountInitObject.pinLoginEnabled = await context.pinLoginEnabled(account.username)

    const coreSettings = await getCoreSettings(account)
    const coreDefaults = CORE_DEFAULTS
    const coreFinal = { ...coreDefaults, ...coreSettings }
    accountInitObject.pinMode = coreFinal.pinMode
    accountInitObject.otpMode = coreFinal.otpMode

    dispatch({
      type: 'ACCOUNT_INIT_COMPLETE',
      data: { ...accountInitObject }
    })
    // $FlowFixMe
    dispatch(updateWalletsRequest())
  } catch (error) {
    console.log(error)
  }
}

export const mergeSettings = (
  loadedSettings: Object,
  defaults: Object,
  types: Object
): { finalSettings: Object, isOverwriteNeeded: boolean, isDefaultTypeIncorrect: boolean } => {
  const finalSettings = {}
  // begin process for repairing damaged settings data
  let isOverwriteNeeded = false
  let isDefaultTypeIncorrect = false
  for (const key in defaults) {
    // if the type of the setting default does not meet the enforced type
    const defaultSettingType = typeof defaults[key]
    if (defaultSettingType !== types[key]) {
      isDefaultTypeIncorrect = true
      console.error('MismatchedDefaultSettingType key: ', key, ' with defaultSettingType: ', defaultSettingType, ' and necessary type: ', types[key])
    }
    // if the type of the loaded setting does not meet the enforced type
    // eslint-disable-next-line valid-typeof
    const loadedSettingType = typeof loadedSettings[key]
    if (loadedSettingType !== types[key]) {
      isOverwriteNeeded = true
      console.warn(
        'Settings overwrite was needed for: ',
        key,
        ' with loaded value: ',
        loadedSettings[key],
        ', but needed type: ',
        types[key],
        ' so replace with: ',
        defaults[key]
      )
      // change that erroneous value to something that works (default)
      finalSettings[key] = defaults[key]
    } else {
      finalSettings[key] = loadedSettings[key]
    }
  }

  return {
    finalSettings,
    isOverwriteNeeded,
    isDefaultTypeIncorrect
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
  dispatch({ type: 'DEEP_LINK_RECEIVED', data: backupKey })
  // dispatch(logout('deepLinkReceived'))
  if (!account) {
    account.logout()
  }
}

export const logout = (username?: string) => ({
  type: 'LOGOUT',
  data: { username }
})
