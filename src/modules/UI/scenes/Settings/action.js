// UI/Scenes/Settings
const PREFIX = 'UI/Scenes/Settings/'

const SET_PIN_MODE_START = PREFIX + 'SET_PIN_MODE_START'
const SET_PIN_START = PREFIX + 'SET_PIN_START'
const SET_OTP_MODE_START = PREFIX + 'SET_OTP_MODE_START'
const SET_OTP_START = PREFIX + 'SET_OTP_START'

const SET_AUTO_LOGOUT_TIME_START = PREFIX + 'SET_AUTO_LOGOUT_TIME_START'
const SET_DEFAULT_FIAT_START = PREFIX + 'SET_DEFAULT_FIAT_START'
const SET_MERCHANT_MODE_START = PREFIX + 'SET_MERCHANT_MODE_START'

const SET_BLUETOOTH_MODE_START = PREFIX + 'SET_BLUETOOTH_MODE_START'

const SET_BITCOIN_OVERRIDE_SERVER_START = PREFIX + 'SET_BITCOIN_OVERRIDE_SERVER_START'

import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'
import * as SETTINGS_ACTIONS from '../../Settings/action.js'

export const setOTPModeRequest = otpMode => {
  return (dispatch, getState) => {
    dispatch(setOTPModeStart(otpMode))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setOTPModeRequest(account, otpMode)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setOTPMode(otpMode))
    })
    .catch(e => { console.error(e) })
  }
}

export const setOTPRequest = otp => {
  return (dispatch, getState) => {
    dispatch(setOTPStart(otp))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setOTPRequest(account, otp)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setOTP(otp))
    })
    .catch(e => { console.error(e) })
  }
}

export const setPINModeRequest = pinMode => {
  return (dispatch, getState) => {
    dispatch(setPINModeStart(pinMode))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setPINModeRequest(account, pinMode)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setPINMode(pinMode))
    })
    .catch(e => { console.error(e) })
  }
}

export const setPINRequest = pin => {
  return (dispatch, getState) => {
    dispatch(setPINStart(pin))

    const { account } = getState().core
    ACCOUNT_SETTINGS.setPINRequest(account, pin)
    .then(() => {
      return dispatch(SETTINGS_ACTIONS.setPIN(pin))
    })
    .catch(e => { console.error(e) })
  }
}

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

// Denominations
export const setDenominationKeyRequest = (currencyCode, denominationKey) => {
  return (dispatch, getState) => {
    const { account } = getState().core
    const onSuccess = () => dispatch(SETTINGS_ACTIONS.setDenominationKey(currencyCode, denominationKey))
    const onError = (e) => console.log(e)

    return ACCOUNT_SETTINGS.setDenominationKeyRequest(account, currencyCode, denominationKey)
    .then(onSuccess)
    .catch(onError)
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

// Simple Actions
const setOTPModeStart = otpMode => {
  return {
    type: SET_OTP_MODE_START,
    data: { otpMode }
  }
}

const setOTPStart = otp => {
  return {
    type: SET_OTP_START,
    data: { otp }
  }
}

const setPINModeStart = pinMode => {
  return {
    type: SET_PIN_MODE_START,
    data: { pinMode }
  }
}

const setPINStart = pin => {
  return {
    type: SET_PIN_START,
    data: { pin }
  }
}

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

const setBitcoinOverrideServerStart = overrideServer => {
  return {
    type: SET_BITCOIN_OVERRIDE_SERVER_START,
    data: { overrideServer }
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
