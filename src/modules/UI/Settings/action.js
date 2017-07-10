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
export const SET_BITCOIN_DENOMINATION = PREFIX + 'SET_BITCOIN_DENOMINATION'
export const SET_BITCOIN_OVERRIDE_SERVER = PREFIX + 'SET_BITCOIN_OVERRIDE_SERVER'
export const SET_ETHEREUM_DENOMINATION = PREFIX + 'SET_ETHEREUM_DENOMINATION'
export const SET_SHITCOIN_DENOMINATION = PREFIX + 'SET_SHITCOIN_DENOMINATION'

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

export const setBitcoinDenomination = denomination => {
  return {
    type: SET_BITCOIN_DENOMINATION,
    data: { denomination }
  }
}

export const setBitcoinOverrideServer = overrideServer => {
  return {
    type: SET_BITCOIN_OVERRIDE_SERVER,
    data: { overrideServer }
  }
}

export const setEthereumDenomination = denomination => {
  return {
    type: SET_ETHEREUM_DENOMINATION,
    data: { denomination }
  }
}

export const setShitcoinDenomination = denomination => {
  return {
    type: SET_SHITCOIN_DENOMINATION,
    data: { denomination }
  }
}