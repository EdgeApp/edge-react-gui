// @flow

import {AbcAccount} from 'airbitz-core-types'
import {Actions} from 'react-native-router-flux'

import type {GetState, Dispatch} from '../ReduxTypes'
import {displayErrorAlert} from '../UI/components/ErrorAlert/actions'

// Login/action.js
import * as CONTEXT_API from '../Core/Context/api'
import * as CORE_SELECTORS from '../Core/selectors'
import * as ACCOUNT_API from '../Core/Account/api'
import * as ACCOUNT_ACTIONS from '../Core/Account/action.js'
import * as SETTINGS_ACTIONS from '../UI/Settings/action.js'
import * as SETTINGS_API from '../Core/Account/settings.js'
import * as WALLET_ACTIONS from '../UI/Wallets/action'
import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'
import * as ADD_TOKEN_ACTIONS from '../UI/scenes/AddToken/action.js'
import s from '../../locales/strings.js'
import {updateWalletsRequest} from '../Core/Wallets/action.js'
import PushNotification from 'react-native-push-notification'

export const initializeAccount = (account: AbcAccount, touchIdInfo: Object) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  const currencyCodes = {}
  PushNotification.configure({
    onNotification: (notification) => {
      console.log('NOTIFICATION:', notification)
    }
  })
  // set up the touch id stuff.. this will get combined with other items when we refactor this method to trim dispatches
  dispatch(SETTINGS_ACTIONS.addTouchIdInfo(touchIdInfo))
  // this needs to be refactored into single dispatch
  dispatch(SETTINGS_ACTIONS.updateOtpInfo({enabled: account.otpEnabled, otpKey: account.otpKey}))
  // adding call to determine if we have OTP set up.
  // console.log(optDetails)
  CONTEXT_API.getCurrencyPlugins(context)
    .then((currencyPlugins) => {
      currencyPlugins.forEach((plugin) => {
        plugin.currencyInfo.walletTypes.forEach((type) => {
          currencyCodes[type] = plugin.currencyInfo.currencyCode
        })
        dispatch(SETTINGS_ACTIONS.addCurrencyPlugin(plugin))
      })

      dispatch(ACCOUNT_ACTIONS.addAccount(account))
      dispatch(SETTINGS_ACTIONS.setLoginStatus(true))
      // TODO: understand why this fails flow -paulvp

      if (ACCOUNT_API.checkForExistingWallets(account)) {
        const {walletId, currencyCode} = ACCOUNT_API.getFirstActiveWalletInfo(account, currencyCodes)
        dispatch(WALLET_ACTIONS.selectWallet(walletId, currencyCode))
        dispatch(loadSettings())
        // $FlowFixMe
        dispatch(updateWalletsRequest())
        return
      }
      dispatch(createCurrencyWallet(
        s.strings.string_first_ethereum_wallet_name,
        Constants.ETHEREUM_WALLET,
        Constants.USD_FIAT
      ))
      dispatch(loadSettings())
      // $FlowFixMe
      dispatch(updateWalletsRequest())
    })
}

const loadSettings = () => (dispatch: Dispatch, getState: GetState) => {
  const {account} = getState().core
  SETTINGS_API.getSyncedSettings(account)
    .then((settings) => {
      const syncDefaults = SETTINGS_API.SYNCED_ACCOUNT_DEFAULTS
      const syncFinal = {...syncDefaults, ...settings}
      const customTokens = settings ? settings.customTokens : []
      // Add all the settings to UI/Settings
      dispatch(SETTINGS_ACTIONS.setAutoLogoutTimeInSeconds(syncFinal.autoLogoutTimeInSeconds))
      dispatch(SETTINGS_ACTIONS.setDefaultFiat(syncFinal.defaultFiat))
      dispatch(SETTINGS_ACTIONS.setMerchantMode(syncFinal.merchantMode))
      dispatch(SETTINGS_ACTIONS.setCustomTokens(syncFinal.customTokens))
      dispatch(SETTINGS_ACTIONS.setDenominationKey('BTC', syncFinal.BTC.denomination))
      dispatch(SETTINGS_ACTIONS.setDenominationKey('BCH', syncFinal.BCH.denomination))
      dispatch(SETTINGS_ACTIONS.setDenominationKey('ETH', syncFinal.ETH.denomination))
      if (customTokens) {
        customTokens.forEach((token) => {
          dispatch(ADD_TOKEN_ACTIONS.setTokenSettings(token))
          // this second dispatch will be redundant if we set 'denomination' property upon customToken creation
          dispatch(SETTINGS_ACTIONS.setDenominationKey(token.currencyCode, token.multiplier))
        })
      }
    })

  SETTINGS_API.getLocalSettings(account)
    .then((settings) => {
      const localDefaults = SETTINGS_API.LOCAL_ACCOUNT_DEFAULTS

      const localFinal = {...localDefaults, ...settings}
      // Add all the local settings to UI/Settings
      dispatch(SETTINGS_ACTIONS.setBluetoothMode(localFinal.bluetoothMode))
    })

  SETTINGS_API.getCoreSettings(account)
    .then((settings) => {
      const coreDefaults = SETTINGS_API.CORE_DEFAULTS

      const coreFinal = {...coreDefaults, ...settings}
      dispatch(SETTINGS_ACTIONS.setPINMode(coreFinal.pinMode))
      dispatch(SETTINGS_ACTIONS.setOTPMode(coreFinal.otpMode))
    })
}

export const logoutRequest = (username?: string) => (dispatch: Dispatch, getState: GetState) => {
  /* Actions.popTo(Constants.LOGIN, {username})

  const state = getState()
  dispatch(SETTINGS_ACTIONS.setLoginStatus(false))

  const account = CORE_SELECTORS.getAccount(state)
  dispatch(logout(username))
  ACCOUNT_API.logoutRequest(account) */
  Actions.popTo(Constants.LOGIN, {username})
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  dispatch(logout(username))
  account.logout()
}
export const deepLinkLogout = (backupKey: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const username = account.username
  Actions.popTo(Constants.LOGIN, {username})
  dispatch(actions.dispatchActionString(Constants.DEEP_LINK_RECEIVED, backupKey))
  // dispatch(logout(Constants.DEEP_LINK_RECEIVED))
  account.logout()
}

export const logout = (username?: string) => ({
  type: Constants.LOGOUT,
  data: {username}
})

const createCurrencyWallet = (
  walletName: string,
  walletType: string,
  fiatCurrencyCode: string
) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  dispatch(WALLET_ACTIONS.createWalletStart())

  return ACCOUNT_API.createCurrencyWalletRequest(account, walletType, {name: walletName, fiatCurrencyCode})
  .then((abcWallet) => {
    dispatch(WALLET_ACTIONS.createWalletSuccess())
    dispatch(WALLET_ACTIONS.selectWallet(abcWallet.id, abcWallet.currencyInfo.currencyCode))
  })
  .catch((error) => {
    dispatch(displayErrorAlert(error.message))
  })
}
