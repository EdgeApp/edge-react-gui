// UI/Scenes/Settings

const PREFIX = 'UI/Scenes/Settings/'

const SET_AUTO_LOGOUT_TIME_START = PREFIX + 'SET_AUTO_LOGOUT_TIME_START'
const SET_DEFAULT_FIAT_START = PREFIX + 'SET_DEFAULT_FIAT_START'
const SET_MERCHANT_MODE_START = PREFIX + 'SET_MERCHANT_MODE_START'

const SET_BLUETOOTH_MODE_START = PREFIX + 'SET_BLUETOOTH_MODE_START'

const SET_BITCOIN_DENOMINATION_START = PREFIX + 'SET_BITCOIN_DENOMINATION_START'
const SET_BITCOIN_OVERRIDE_SERVER_START = PREFIX + 'SET_BITCOIN_OVERRIDE_SERVER_START'
const SET_ETHEREUM_DENOMINATION_START = PREFIX + 'SET_ETHEREUM_DENOMINATION_START'

import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'
import * as SETTINGS_ACTIONS from '../../Settings/action.js'

export const setAutoLogoutTimeRequest = autoLogoutTimeInSeconds => {
  return (dispatch, getState) => {
    dispatch(setAutoLogoutTimeStart(autoLogoutTimeInSeconds))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setAutoLogoutTimeRequest(account, autoLogoutTimeInSeconds)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setAutoLogoutTime(autoLogoutTimeInSeconds))
    })
    .catch(e => { console.error(e) })
  }
}

export const setDefaultFiatRequest = defaultFiat => {
  return (dispatch, getState) => {
    dispatch(setDefaultFiatStart(defaultFiat))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setDefaultFiatRequest(account, defaultFiat)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setDefaultFiat(defaultFiat))
    })
    .catch(e => { console.error(e) })
  }
}

export const setMerchantModeRequest = merchantMode => {
  return (dispatch, getState) => {
    dispatch(setMerchantModeStart(merchantMode))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setMerchantModeRequest(account, merchantMode)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setMerchantMode(merchantMode))
    })
    .catch(e => { console.error(e) })
  }
}

export const setBluetoothModeRequest = bluetoothMode => {
  return (dispatch, getState) => {
    dispatch(setBluetoothModeStart(bluetoothMode))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setBluetoothModeRequest(account, bluetoothMode)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setBluetoothMode(bluetoothMode))
    })
    .catch(e => { console.error(e) })
  }
}

export const setBitcoinDenominationRequest = denomination => {
  return (dispatch, getState) => {
    dispatch(setBitcoinDenominationStart(denomination))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setBitcoinDenominationRequest(account, denomination)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setBitcoinDenomination(denomination))
    })
    .catch(e => { console.error(e) })
  }
}

export const setBitcoinOverrideServerRequest = overrideServer => {
  return (dispatch, getState) => {
    dispatch(setBitcoinOverrideServerStart(overrideServer))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setBitcoinOverrideServerRequest(account, overrideServer)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setBitcoinOverrideServer(overrideServer))
    })
    .catch(e => { console.error(e) })
  }
}

export const setEthereumDenominationRequest = denomination => {
  return (dispatch, getState) => {
    dispatch(setEthereumDenominationStart(denomination))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setEthereumDenominationRequest(account, denomination)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setEthereumDenomination(denomination))
    })
    .catch(e => { console.error(e) })
  }
}

// Simple Actions
const setAutoLogoutTimeStart = autoLogoutTimeInSeconds => {
  return {
    type: SET_AUTO_LOGOUT_TIME_START,
    data: { autoLogoutTimeInSeconds }
  }
}

const setDefaultFiatStart = defaultFiat => {
  return {
    type: SET_DEFAULT_FIAT_START,
    data: { defaultFiat }
  }
}

const setMerchantModeStart = merchantMode => {
  return {
    type: SET_MERCHANT_MODE_START,
    data: { merchantMode }
  }
}

const setBluetoothModeStart = bluetoothMode => {
  return {
    type: SET_BLUETOOTH_MODE_START,
    data: { bluetoothMode }
  }
}

const setBitcoinDenominationStart = denomination => {
  return {
    type: SET_BITCOIN_DENOMINATION_START,
    data: { denomination }
  }
}

const setBitcoinOverrideServerStart = overrideServer => {
  return {
    type: SET_BITCOIN_OVERRIDE_SERVER_START,
    data: { overrideServer }
  }
}

const setEthereumDenominationStart = denomination => {
  return {
    type: SET_ETHEREUM_DENOMINATION_START,
    data: { denomination }
  }
}
// Settings

// Account Settings
// pinLoginEnabled         (boolean)
// fingerprintLoginEnabled (boolean)
// pinLoginCount           (integer)
// minutesAutoLogout       (integer)
// secondsAutoLogout       (integer)
// recoveryReminderCount   (integer)

// Requests Settings
// nameOnPayments (boolean)
// firstName      (string)
// lastName       (string)
// nickName       (string)

// Spend Limits
// spendRequirePinEnabled  (boolean)
// spendRequirePinSatoshis (integer)
// dailySpendLimitEnabled  (boolean)
// dailySpendLimitSatoshi  (integer)

// Currency Settings
// advancedFeatures          (boolean)
// bitcoinDenomination       (Value)?
// exchangeRateSource        (string)
// language                  (string)
// numCurrency?              (integer)
// overrideBitcoinServers    (boolean)
// overrideBitcoinServerList (string)
