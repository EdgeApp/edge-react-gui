// @flow
// UI/Scenes/Settings
import * as CORE_SELECTORS from '../../../Core/selectors'
import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'
import * as SETTINGS_ACTIONS from '../../Settings/action.js'
import type { AbcAccount } from 'edge-login'
import { enableTouchId, disableTouchId } from 'airbitz-core-js-ui'
import type {
  GetState,
  Dispatch
} from '../../../../../src/modules/ReduxTypes.js'

const PREFIX = 'UI/Scenes/Settings/'

const SET_PIN_MODE_START = PREFIX + 'SET_PIN_MODE_START'
const SET_PIN_START = PREFIX + 'SET_PIN_START'

const SET_DEFAULT_FIAT_START = PREFIX + 'SET_DEFAULT_FIAT_START'
const SET_MERCHANT_MODE_START = PREFIX + 'SET_MERCHANT_MODE_START'

const SET_BLUETOOTH_MODE_START = PREFIX + 'SET_BLUETOOTH_MODE_START'
const SET_BITCOIN_OVERRIDE_SERVER_START = PREFIX + 'SET_BITCOIN_OVERRIDE_SERVER_START'

export const SELECT_DEFAULT_FIAT = PREFIX + 'SELECT_DEFAULT_FIAT'

export const setPINModeRequest = (pinMode: boolean) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setPINModeStart(pinMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setPINModeRequest(account, pinMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setPINMode(pinMode)))
    .catch((error) => { console.error(error) })
}

export const setPINRequest = (pin: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setPINStart(pin))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setPINRequest(account, pin)
    .then(() => dispatch(SETTINGS_ACTIONS.setPIN(pin)))
    .catch((error) => { console.error(error) })
}

export const setAutoLogoutTimeInMinutesRequest = (autoLogoutTimeInMinutes: number) => {
  const autoLogoutTimeInSeconds = autoLogoutTimeInMinutes * 60
  return setAutoLogoutTimeInSecondsRequest(autoLogoutTimeInSeconds)
}

export const setAutoLogoutTimeInSecondsRequest = (autoLogoutTimeInSeconds: number) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setAutoLogoutTimeInSecondsRequest(account, autoLogoutTimeInSeconds)
    .then(() => dispatch(SETTINGS_ACTIONS.setAutoLogoutTimeInSeconds(autoLogoutTimeInSeconds)))
    .catch((error) => { console.error(error) })
}

export const setDefaultFiatRequest = (defaultFiat: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setDefaultFiatStart(defaultFiat))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const onSuccess = () => dispatch(SETTINGS_ACTIONS.setDefaultFiat(defaultFiat))
  const onError = (error) => console.log(error)

  return ACCOUNT_SETTINGS.setDefaultFiatRequest(account, defaultFiat)
    .then(onSuccess)
    .catch(onError)
}

export const setMerchantModeRequest = (merchantMode: boolean) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setMerchantModeStart(merchantMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setMerchantModeRequest(account, merchantMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setMerchantMode(merchantMode)))
    .catch((error) => { console.error(error) })
}

export const setBluetoothModeRequest = (bluetoothMode: boolean) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setBluetoothModeStart(bluetoothMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setBluetoothModeRequest(account, bluetoothMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setBluetoothMode(bluetoothMode)))
    .catch((error) => { console.error(error) })
}

export const checkCurrentPassword = (arg: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const isPassword = await account.checkPassword(arg)
  dispatch(SETTINGS_ACTIONS.setSettingsLock(!isPassword))
}

export const lockSettings = () => async (dispatch: Dispatch) => {
  dispatch(SETTINGS_ACTIONS.setSettingsLock(true))
}

// Denominations
export const setDenominationKeyRequest = (currencyCode: string, denominationKey: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const onSuccess = () => dispatch(SETTINGS_ACTIONS.setDenominationKey(currencyCode, denominationKey))
  const onError = (e) => console.log(e)

  return ACCOUNT_SETTINGS.setDenominationKeyRequest(account, currencyCode, denominationKey)
    .then(onSuccess)
    .catch(onError)
}

export const setBitcoinOverrideServerRequest = (overrideServer: string) => (dispatch: Dispatch) => {
  dispatch(setBitcoinOverrideServerStart(overrideServer))

  dispatch(SETTINGS_ACTIONS.setBitcoinOverrideServer(overrideServer))
}

// touch id interaction
export const updateTouchIdEnabled = (arg: boolean, account: AbcAccount) => async (dispatch: Dispatch, getState: GetState) => {
  const context = CORE_SELECTORS.getContext(getState())
  // dispatch the update for the new state for
  dispatch(SETTINGS_ACTIONS.updateTouchIdEnabled(arg))
  if (arg) {
    enableTouchId(context, account)
  } else {
    disableTouchId(context, account)
  }
}

const setPINModeStart = (pinMode: boolean) => ({
  type: SET_PIN_MODE_START,
  data: {pinMode}
})

const setPINStart = (pin: string) => ({
  type: SET_PIN_START,
  data: {pin}
})

const setDefaultFiatStart = (defaultFiat: string) => ({
  type: SET_DEFAULT_FIAT_START,
  data: {defaultFiat}
})

const setMerchantModeStart = (merchantMode: boolean) => ({
  type: SET_MERCHANT_MODE_START,
  data: {merchantMode}
})

const setBluetoothModeStart = (bluetoothMode: boolean) => ({
  type: SET_BLUETOOTH_MODE_START,
  data: {bluetoothMode}
})

const setBitcoinOverrideServerStart = (overrideServer: string) => ({
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
