const PREFIX = 'UI/Scenes/Settings/'

export const SET_AUTO_LOGOUT_TIME_START = PREFIX + 'SET_AUTO_LOGOUT_TIME_START'
export const SET_AUTO_LOGOUT_TIME_REQUEST = PREFIX + 'SET_AUTO_LOGOUT_TIME_REQUEST'

export const SET_DEFAULT_FIAT_CURRENCY_START = PREFIX + 'SET_DEFAULT_FIAT_CURRENCY_START'
export const SET_DEFAULT_FIAT_CURRENCY_REQUEST = PREFIX + 'SET_DEFAULT_FIAT_CURRENCY_REQUEST'

export const SET_MERCHANT_MODE_START = PREFIX + 'SET_MERCHANT_MODE_START'
export const SET_MERCHANT_MODE_REQUEST = PREFIX + 'SET_MERCHANT_MODE_REQUEST'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as SETTINGS_ACTIONS from '../../Settings/action.js'

export const setAutoLogoutTimeRequest = autoLogoutTimeInSeconds => {
  return (dispatch, getState) => {
    dispatch(setAutoLogoutTimeStart(autoLogoutTimeInSeconds))

    const { account } = getState().core
    ACCOUNT_API.setAutoLogoutTimeRequest(account, autoLogoutTimeInSeconds)
    .then(updatedSettingsText => {
      return SETTINGS_ACTIONS.setAutoLogoutTime(autoLogoutTimeInSeconds)
    })
    .catch(e => { console.error(e) })
  }
}

export const setAutoLogoutTimeStart = autoLogoutTimeInSeconds => {
  return {
    type: SET_AUTO_LOGOUT_TIME_START,
    data: { autoLogoutTimeInSeconds }
  }
}

export const setDefaultFiatCurrencyRequest = defaultFiatCurrency => {
  return (dispatch, getState) => {
    dispatch(setDefaultFiatCurrencyStart(defaultFiatCurrency))

    const { account } = getState().core
    ACCOUNT_API.setDefaultFiatCurrencyRequest(account, defaultFiatCurrency)
    .then(updatedSettingsText => {
      return SETTINGS_ACTIONS.setDefaultFiatCurrency(defaultFiatCurrency)
    })
    .catch(e => { console.error(e) })
  }
}

export const setDefaultFiatCurrencyStart = defaultFiatCurrency => {
  return {
    type: SET_DEFAULT_FIAT_CURRENCY_START,
    data: { defaultFiatCurrency }
  }
}

export const setMerchantModeRequest = merchantMode => {
  return (dispatch, getState) => {
    dispatch(setMerchantModeStart(merchantMode))

    const { account } = getState().core
    ACCOUNT_API.setMerchantModeRequest(account, merchantMode)
    .then(updatedSettingsText => {
      return SETTINGS_ACTIONS.setMerchantMode(merchantMode)
    })
    .catch(e => { console.error(e) })
  }
}

export const setMerchantModeStart = merchantMode => {
  return {
    type: SET_MERCHANT_MODE_START,
    data: { merchantMode }
  }
}

export const enablePinLogin = () => {
  return {
    type: ENABLE_PIN_LOGIN
  }
}

export const disablePinLogin = () => {
  return {
    type: DISABLE_PIN_LOGIN
  }
}

export const enableTouchId = () => {
  return {
    type: ENABLE_TOUCH_ID
  }
}

export const disableTouchId = () => {
  return {
    type: DISABLE_TOUCH_ID
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
