// Login/action.js
import * as ACCOUNT_API from '../Core/Account/api'
import * as ACCOUNT_ACTIONS from '../Core/Account/action.js'
import * as SETTINGS_ACTIONS from '../UI/Settings/action.js'
import * as SETTINGS_API from '../Core/Account/settings.js'
import * as WALLET_ACTIONS from '../UI/Wallets/action'
// import * as TX_DETAILS_ACTIONS from '../UI/scenes/TransactionDetails/action.js'


export const initializeAccount = (account) => {
  return (dispatch) => {
    dispatch(ACCOUNT_ACTIONS.addAccount(account))
    const {
      walletId,
      currencyCode
    } = ACCOUNT_API.getFirstActiveWalletInfo(account)
    // } = ACCOUNT_API.getSecondActiveWalletInfo(account)

    dispatch(WALLET_ACTIONS.selectWallet({ walletId, currencyCode }))
    dispatch(loadSettings())
  }
}

const loadSettings = () => {
  return (dispatch, getState) => {
    const { account } = getState().core
    SETTINGS_API.getSyncedSettings(account)
    .then(settings => {
      const syncDefaults = SETTINGS_API.SYNCED_ACCOUNT_DEFAULTS
      const syncFinal = Object.assign({}, syncDefaults, settings)

      // Add all the settings to UI/Settings
      dispatch(SETTINGS_ACTIONS.setAutoLogoutTime(syncFinal.autoLogoutTimeInSeconds))
      dispatch(SETTINGS_ACTIONS.setDefaultFiat(syncFinal.defaultFiat))
      dispatch(SETTINGS_ACTIONS.setMerchantMode(syncFinal.merchantMode))

      dispatch(SETTINGS_ACTIONS.setDenominationKey('BTC', syncFinal.BTC.denomination))
      dispatch(SETTINGS_ACTIONS.setDenominationKey('ETH', syncFinal.ETH.denomination))

      dispatch(SETTINGS_ACTIONS.setDenominationKey('REP', syncFinal.REP.denomination))
      dispatch(SETTINGS_ACTIONS.setDenominationKey('WINGS', syncFinal.WINGS.denomination))
    })
    /* SETTINGS_API.getSyncedSubcategories(account)
    .then(subcategories => {
      console.log('subcategories have been loaded and are: ', subcategories)
      const syncDefaults = SETTINGS_API.SYNCED_SUBCATEGORY_DEFAULTS
      const syncFinal = Object.assign({}, syncDefaults, subcategories)
      console.log('in loadSettings, syncFinal.subcategories is: ' , syncFinal.subcategories)
      dispatch(TX_DETAILS_ACTIONS.setSubcategories(syncFinal.subcategories))
    }) */

    SETTINGS_API.getLocalSettings(account)
    .then(settings => {
      const localDefaults = SETTINGS_API.LOCAL_ACCOUNT_DEFAULTS

      const localFinal = Object.assign({}, localDefaults, settings)
      // Add all the local settings to UI/Settings
      dispatch(SETTINGS_ACTIONS.setBluetoothMode(localFinal.bluetoothMode))
    })

    SETTINGS_API.getCoreSettings(account)
    .then(settings => {
      const coreDefaults = SETTINGS_API.CORE_DEFAULTS

      const coreFinal = Object.assign({}, coreDefaults, settings)
      dispatch(SETTINGS_ACTIONS.setPINMode(coreFinal.pinMode))
      dispatch(SETTINGS_ACTIONS.setOTPMode(coreFinal.otpMode))
    })
  }
}
