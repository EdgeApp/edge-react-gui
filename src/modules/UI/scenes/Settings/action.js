export const ENABLE_PIN_LOGIN = 'ENABLE_PIN_LOGIN'
export const DISABLE_PIN_LOGIN = 'DISABLE_PIN_LOGIN'
export const ENABLE_TOUCH_ID = 'ENABLE_TOUCH_ID'
export const DISABLE_TOUCH_ID = 'DISABLE_TOUCH_ID'

import * as ACCOUNT_API from '../../../Core/Account/api.js'

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
