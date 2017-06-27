const PREFIX = 'UI/Settings/'
export const UPDATE_SETTINGS = PREFIX + 'UPDATE_SETTINGS'
export const SET_AUTO_LOGOUT_TIME = PREFIX + 'SET_AUTO_LOGOUT_TIME'
export const SET_DEFAULT_FIAT_CURRENCY = PREFIX + 'SET_DEFAULT_FIAT_CURRENCY'
export const SET_MERCHANT_MODE = PREFIX + 'SET_MERCHANT_MODE'

export const updateSettings = settings => {
  return {
    TYPE: UPDATE_SETTINGS,
    data: { settings }
  }
}

export const setAutoLogoutTime = autoLogoutTimeInSeconds => {
  return {
    type: SET_AUTO_LOGOUT_TIME,
    data: { autoLogoutTimeInSeconds }
  }
}

export const setDefaultFiatCurrency = defaultFiatCurrency => {
  return {
    type: SET_DEFAULT_FIAT_CURRENCY,
    data: { defaultFiatCurrency }
  }
}

export const setMerchantMode = merchantMode => {
  return {
    type: SET_MERCHANT_MODE,
    data: { merchantMode }
  }
}
