// @flow
import type {
  GetState,
  Dispatch
} from '../ReduxTypes'
import {
  AbcAccount
} from 'airbitz-core-types'

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
import strings from '../../locales/default'
// import * as TX_DETAILS_ACTIONS from '../UI/scenes/TransactionDetails/action.js'
export const LOGOUT = 'LOGOUT'

import {Actions} from 'react-native-router-flux'

export const initializeAccount = (account: AbcAccount) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  const currencyCodes = {}
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
      if (ACCOUNT_API.checkForExistingWallets(account)) {
        const {walletId, currencyCode} = ACCOUNT_API.getFirstActiveWalletInfo(account, currencyCodes)
        dispatch(WALLET_ACTIONS.selectWallet(walletId, currencyCode))
        dispatch(loadSettings())
        return
      }
      // TODO: Allen - Turn on when Bitcoin is turned back on
      // await dispatch(actions.createCurrencyWallet(strings.enUS['strings_first_bitcoin_44_wallet_name'], Constants.BITCOIN_44_WALLET, Constants.USD_FIAT, false)) //name.. walletType, fiat currency. TODO: get fiat to react to device.
      dispatch(actions.createCurrencyWallet(
        strings.enUS['string_first_ethereum_wallet_name'],
        Constants.ETHEREUM_WALLET, Constants.USD_FIAT,
        false, true
      ))
      dispatch(loadSettings())
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

      // dispatch(SETTINGS_ACTIONS.setDenominationKey('REP', syncFinal.REP.denomination))
      // dispatch(SETTINGS_ACTIONS.setDenominationKey('WINGS', syncFinal.WINGS.denomination))
    })
    /* SETTINGS_API.getSyncedSubcategories(account)
    .then(subcategories => {
      // console.log('subcategories have been loaded and are: ', subcategories)
      const syncDefaults = SETTINGS_API.SYNCED_SUBCATEGORY_DEFAULTS
      const syncFinal = Object.assign({}, syncDefaults, subcategories)
      // console.log('in loadSettings, syncFinal.subcategories is: ' , syncFinal.subcategories)
      dispatch(TX_DETAILS_ACTIONS.setSubcategories(syncFinal.subcategories))
    }) */

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
  Actions.popTo(Constants.LOGIN, {username})

  const state = getState()
  dispatch(SETTINGS_ACTIONS.setLoginStatus(false))

  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_API.logoutRequest(account)
   .then(() => {
     dispatch(logout(username))
   })
}

export const logout = (username?: string) => ({
  type: LOGOUT,
  data: {username}
})
