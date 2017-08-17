// UI/Settings
const PREFIX = 'UI/Settings/'

export const UPDATE_SETTINGS = PREFIX + 'UPDATE_SETTINGS'
export const LOAD_SETTINGS = PREFIX + 'LOAD_SETTINGS'

// Core Settings
export const SET_PIN_MODE = PREFIX + 'SET_PIN_MODE'
export const SET_PIN = PREFIX + 'SET_PIN'
export const SET_OTP_MODE = PREFIX + 'SET_OTP_MODE'
export const SET_OTP = PREFIX + 'SET_OTP'

// Synced Account Settings
export const SET_AUTO_LOGOUT_TIME = PREFIX + 'SET_AUTO_LOGOUT_TIME'
export const SET_DEFAULT_FIAT = PREFIX + 'SET_DEFAULT_FIAT'
export const SET_MERCHANT_MODE = PREFIX + 'SET_MERCHANT_MODE'

// Local Account Settings
export const SET_BLUETOOTH_MODE = PREFIX + 'SET_BLUETOOTH_MODE'

// Currency Settings
export const SET_BTC_DENOMINATION = PREFIX + 'SET_BITCOIN_DENOMINATION'
export const SET_BITCOIN_OVERRIDE_SERVER = PREFIX + 'SET_BITCOIN_OVERRIDE_SERVER'
export const SET_ETH_DENOMINATION = PREFIX + 'SET_ETHEREUM_DENOMINATION'
export const SET_REP_DENOMINATION = PREFIX + 'SET_REP_DENOMINATION'
export const SET_WINGS_DENOMINATION = PREFIX + 'SET_WINGS_DENOMINATION'
export const SET_LUN_DENOMINATION = PREFIX + 'SET_LUNYR_DENOMINATION'

// Plugins
// export const ADD_BITCOIN_PLUGIN = PREFIX + 'ADD_BITCOIN_PLUGIN'
// export const ADD_ETHEREUM_PLUGIN = PREFIX + 'ADD_ETHEREUM_PLUGIN'
export const ADD_CURRENCY_PLUGIN = PREFIX + 'ADD_CURRENCY_PLUGIN'

export const updateSettings = settings => {
  return {
    type: UPDATE_SETTINGS,
    data: { settings }
  }
}

export const loadSettings = settings => {
  return {
    type: LOAD_SETTINGS,
    data: { settings }
  }
}

export const setPINMode = pinMode => {
  return {
    type: SET_PIN_MODE,
    data: { pinMode }
  }
}

export const setPIN = pin => {
  return {
    type: SET_PIN,
    data: { pin }
  }
}

export const setOTPMode = otpMode => {
  return {
    type: SET_OTP_MODE,
    data: { otpMode }
  }
}

export const setOTP = otp => {
  return {
    type: SET_OTP,
    data: { otp }
  }
}

export const setAutoLogoutTime = autoLogoutTimeInSeconds => {
  return {
    type: SET_AUTO_LOGOUT_TIME,
    data: { autoLogoutTimeInSeconds }
  }
}

export const setDefaultFiat = defaultFiat => {
  return {
    type: SET_DEFAULT_FIAT,
    data: { defaultFiat }
  }
}

export const setMerchantMode = merchantMode => {
  return {
    type: SET_MERCHANT_MODE,
    data: { merchantMode }
  }
}

export const setBluetoothMode = bluetoothMode => {
  return {
    type: SET_BLUETOOTH_MODE,
    data: { bluetoothMode }
  }
}

// BTC Settings
export const setBitcoinOverrideServer = overrideServer => {
  return {
    type: SET_BITCOIN_OVERRIDE_SERVER,
    data: { overrideServer }
  }
}

export const setBTCDenomination = denomination => {
  return {
    type: SET_BTC_DENOMINATION,
    data: { denomination }
  }
}

// ETH Settings
export const setETHDenomination = denomination => {
  return {
    type: SET_ETH_DENOMINATION,
    data: { denomination }
  }
}

// REP Settings
export const setREPDenomination = denomination => {
  return {
    type: SET_REP_DENOMINATION,
    data: { denomination }
  }
}

// WINGS Settings
export const setWINGSDenomination = denomination => {
  return {
    type: SET_WINGS_DENOMINATION,
    data: { denomination }
  }
}

// LUN Settings
export const setLUNDenomination = denomination => {
  return {
    type: SET_LUN_DENOMINATION,
    data: { denomination }
  }
}

// Plugins
export const addCurrencyPlugin = (plugin) => {
  return {
    type: ADD_CURRENCY_PLUGIN,
    data: { plugin: plugin }
  }
}
