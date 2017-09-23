// UI/Scenes/Settings
const PREFIX = 'UI/Scenes/Settings/'

const SET_PIN_MODE_START = PREFIX + 'SET_PIN_MODE_START'
const SET_PIN_START = PREFIX + 'SET_PIN_START'
const SET_OTP_MODE_START = PREFIX + 'SET_OTP_MODE_START'
const SET_OTP_START = PREFIX + 'SET_OTP_START'

const SET_DEFAULT_FIAT_START = PREFIX + 'SET_DEFAULT_FIAT_START'
const SET_MERCHANT_MODE_START = PREFIX + 'SET_MERCHANT_MODE_START'

const SET_BLUETOOTH_MODE_START = PREFIX + 'SET_BLUETOOTH_MODE_START'

const SET_BITCOIN_OVERRIDE_SERVER_START = PREFIX + 'SET_BITCOIN_OVERRIDE_SERVER_START'

import * as CORE_SELECTORS from '../../../Core/selectors'
import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'
import * as SETTINGS_ACTIONS from '../../Settings/action.js'

export const SELECT_DEFAULT_FIAT = PREFIX + 'SELECT_DEFAULT_FIAT'

export const setOTPModeRequest = (otpMode) => (dispatch, getState) => {
  dispatch(setOTPModeStart(otpMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setOTPModeRequest(account, otpMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setOTPMode(otpMode)))
    .catch((error) => { console.error(error) })
}

export const setOTPRequest = (otp) => (dispatch, getState) => {
  dispatch(setOTPStart(otp))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setOTPRequest(account, otp)
    .then(() => dispatch(SETTINGS_ACTIONS.setOTP(otp)))
    .catch((error) => { console.error(error) })
}

export const setPINModeRequest = (pinMode) => (dispatch, getState) => {
  dispatch(setPINModeStart(pinMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setPINModeRequest(account, pinMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setPINMode(pinMode)))
    .catch((error) => { console.error(error) })
}

export const setPINRequest = (pin) => (dispatch, getState) => {
  dispatch(setPINStart(pin))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setPINRequest(account, pin)
    .then(() => dispatch(SETTINGS_ACTIONS.setPIN(pin)))
    .catch((error) => { console.error(error) })
}

export const setAutoLogoutTimeInMinutesRequest = (autoLogoutTimeInMinutes) => {
  const autoLogoutTimeInSeconds = autoLogoutTimeInMinutes * 60
  return setAutoLogoutTimeInSecondsRequest(autoLogoutTimeInSeconds)
}

export const setAutoLogoutTimeInSecondsRequest = (autoLogoutTimeInSeconds) => (dispatch, getState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setAutoLogoutTimeInSecondsRequest(account, autoLogoutTimeInSeconds)
    .then(() => dispatch(SETTINGS_ACTIONS.setAutoLogoutTimeInSeconds(autoLogoutTimeInSeconds)))
    .catch((error) => { console.error(error) })
}

export const setDefaultFiatRequest = (defaultFiat) => (dispatch, getState) => {
  dispatch(setDefaultFiatStart(defaultFiat))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const onSuccess = () => dispatch(SETTINGS_ACTIONS.setDefaultFiat(defaultFiat))
  const onError = (error) => console.log(error)

  return ACCOUNT_SETTINGS.setDefaultFiatRequest(account, defaultFiat)
    .then(onSuccess)
    .catch(onError)
}

export const setMerchantModeRequest = (merchantMode) => (dispatch, getState) => {
  dispatch(setMerchantModeStart(merchantMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setMerchantModeRequest(account, merchantMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setMerchantMode(merchantMode)))
    .catch((error) => { console.error(error) })
}

export const setBluetoothModeRequest = (bluetoothMode) => (dispatch, getState) => {
  dispatch(setBluetoothModeStart(bluetoothMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setBluetoothModeRequest(account, bluetoothMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setBluetoothMode(bluetoothMode)))
    .catch((error) => { console.error(error) })
}

// Denominations
export const setDenominationKeyRequest = (currencyCode, denominationKey) => (dispatch, getState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const onSuccess = () => dispatch(SETTINGS_ACTIONS.setDenominationKey(currencyCode, denominationKey))
  const onError = (e) => console.log(e)

  return ACCOUNT_SETTINGS.setDenominationKeyRequest(account, currencyCode, denominationKey)
    .then(onSuccess)
    .catch(onError)
}

export const setBitcoinOverrideServerRequest = (overrideServer) => (dispatch, getState) => {
  dispatch(setBitcoinOverrideServerStart(overrideServer))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setBitcoinOverrideServerRequest(account, overrideServer)
    .then(() => dispatch(SETTINGS_ACTIONS.setBitcoinOverrideServer(overrideServer)))
    .catch((error) => { console.error(error) })
}

// Simple Actions
const setOTPModeStart = (otpMode) => ({
  type: SET_OTP_MODE_START,
  data: {otpMode}
})

const setOTPStart = (otp) => ({
  type: SET_OTP_START,
  data: {otp}
})

const setPINModeStart = (pinMode) => ({
  type: SET_PIN_MODE_START,
  data: {pinMode}
})

const setPINStart = (pin) => ({
  type: SET_PIN_START,
  data: {pin}
})

const setDefaultFiatStart = (defaultFiat) => ({
  type: SET_DEFAULT_FIAT_START,
  data: {defaultFiat}
})

const setMerchantModeStart = (merchantMode) => ({
  type: SET_MERCHANT_MODE_START,
  data: {merchantMode}
})

const setBluetoothModeStart = (bluetoothMode) => ({
  type: SET_BLUETOOTH_MODE_START,
  data: {bluetoothMode}
})

const setBitcoinOverrideServerStart = (overrideServer) => ({
  type: SET_BITCOIN_OVERRIDE_SERVER_START,
  data: {overrideServer}
})

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
