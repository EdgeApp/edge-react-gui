// @flow

import { createInputModal, createSecureTextModal, createYesNoModal, showModal } from 'edge-components'
import type { EdgeAccount } from 'edge-core-js'
import { disableTouchId, enableTouchId } from 'edge-login-ui-rn'
import React from 'react'
import { Image } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'

import iconImage from '../assets/images/otp/OTP-badge_sm.png'
import { CURRENCY_PLUGIN_NAMES, ION_ICONS, LOCKED_ICON, WALLET_LIST } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import { restoreWalletsRequest } from '../modules/Core/Account/api.js'
import * as ACCOUNT_SETTINGS from '../modules/Core/Account/settings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import { updateExchangeRates } from '../modules/ExchangeRates/action.js'
import { sendLogs } from '../modules/Logs/action.js'
import type { Dispatch, GetState, State } from '../modules/ReduxTypes.js'
import * as SETTINGS_ACTIONS from '../modules/Settings/SettingsActions.js'
import { displayErrorAlert } from '../modules/UI/components/ErrorAlert/actions.js'
import { Icon } from '../modules/UI/components/Icon/Icon.ui.js'
import { convertCurrency } from '../modules/UI/selectors.js'
import { newSpendingLimits } from '../reducers/SpendingLimitsReducer.js'
import { THEME, colors } from '../theme/variables/airbitz.js'
import { disableOtp, keepOtp } from './OtpActions.js'

const setPINModeStart = (pinMode: boolean) => ({
  type: 'UI/SCENES/SETTINGS/SET_PIN_MODE_START',
  data: { pinMode }
})

const setPINStart = (pin: string) => ({
  type: 'UI/SCENES/SETTINGS/SET_PIN_START',
  data: { pin }
})

const setDefaultFiatStart = (defaultFiat: string) => ({
  type: 'UI/SCENES/SETTINGS/SET_DEFAULT_FIAT_START',
  data: { defaultFiat }
})

const setMerchantModeStart = (merchantMode: boolean) => ({
  type: 'UI/SCENES/SETTINGS/SET_MERCHANT_MODE_START',
  data: { merchantMode }
})

const setBluetoothModeStart = (bluetoothMode: boolean) => ({
  type: 'UI/SCENES/SETTINGS/SET_BLUETOOTH_MODE_START',
  data: { bluetoothMode }
})

export const setPINModeRequest = (pinMode: boolean) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setPINModeStart(pinMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setPINModeRequest(account, pinMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setPINMode(pinMode)))
    .catch(error => {
      console.error(error)
    })
}

export const setPINRequest = (pin: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setPINStart(pin))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setPINRequest(account, pin)
    .then(() => dispatch(SETTINGS_ACTIONS.setPIN(pin)))
    .catch(error => {
      console.error(error)
    })
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
    .catch(error => {
      console.error(error)
    })
}

export const setDefaultFiatRequest = (defaultFiat: string) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setDefaultFiatStart(defaultFiat))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  // PSEUDO_CODE
  // get spendingLimits
  const spendingLimits = state.ui.settings.spendingLimits
  const { transaction } = spendingLimits
  const previousDefaultIsoFiat = state.ui.settings.defaultIsoFiat

  Promise.resolve()
    .then(() => {
      // update default fiat in account settings
      ACCOUNT_SETTINGS.setDefaultFiatRequest(account, defaultFiat)
    })
    .then(() => {
      // update default fiat in settings
      dispatch(SETTINGS_ACTIONS.setDefaultFiat(defaultFiat))
      const nextDefaultIsoFiat = getState().ui.settings.defaultIsoFiat
      // convert from previous fiat to next fiat
      return convertCurrency(state, previousDefaultIsoFiat, nextDefaultIsoFiat, transaction.amount)
    })
    .then(transactionAmount => {
      const nextSpendingLimits = {
        transaction: {
          ...transaction,
          amount: parseFloat(transactionAmount.toFixed(2))
        }
      }

      // update spending limits in account settings
      ACCOUNT_SETTINGS.setSpendingLimits(account, nextSpendingLimits)
      // update spending limits in settings
      dispatch(newSpendingLimits(nextSpendingLimits))
      dispatch(updateExchangeRates())
    })
    .catch(e => console.log(e))
}

export const setMerchantModeRequest = (merchantMode: boolean) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setMerchantModeStart(merchantMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setMerchantModeRequest(account, merchantMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setMerchantMode(merchantMode)))
    .catch(error => {
      console.error(error)
    })
}

export const setBluetoothModeRequest = (bluetoothMode: boolean) => (dispatch: Dispatch, getState: GetState) => {
  dispatch(setBluetoothModeStart(bluetoothMode))

  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  ACCOUNT_SETTINGS.setBluetoothModeRequest(account, bluetoothMode)
    .then(() => dispatch(SETTINGS_ACTIONS.setBluetoothMode(bluetoothMode)))
    .catch(error => {
      console.error(error)
    })
}

export const checkCurrentPassword = (arg: string) => async (dispatch: Dispatch, getState: GetState) => {
  const clearPasswordError = { confirmPasswordError: '' }
  dispatch({ type: 'SET_CONFIRM_PASSWORD_ERROR', data: clearPasswordError })
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const isPassword = await account.checkPassword(arg)
  dispatch(SETTINGS_ACTIONS.setSettingsLock(!isPassword))
  if (!isPassword) {
    dispatch({ type: 'SET_CONFIRM_PASSWORD_ERROR', data: { confirmPasswordError: s.strings.fragmet_invalid_password } })
  }
}

export const lockSettings = () => async (dispatch: Dispatch) => {
  dispatch(SETTINGS_ACTIONS.setSettingsLock(true))
}

// Denominations
export const setDenominationKeyRequest = (currencyCode: string, denominationKey: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const onSuccess = () => dispatch(SETTINGS_ACTIONS.setDenominationKey(currencyCode, denominationKey))
  const onError = e => console.log(e)

  return ACCOUNT_SETTINGS.setDenominationKeyRequest(account, currencyCode, denominationKey)
    .then(onSuccess)
    .catch(onError)
}

// touch id interaction
export const updateTouchIdEnabled = (arg: boolean, account: EdgeAccount) => async (dispatch: Dispatch, getState: GetState) => {
  const folder = CORE_SELECTORS.getFolder(getState())
  // dispatch the update for the new state for
  dispatch(SETTINGS_ACTIONS.updateTouchIdEnabled(arg))
  if (arg) {
    enableTouchId(folder, account)
  } else {
    disableTouchId(folder, account)
  }
}

export function togglePinLoginEnabled (pinLoginEnabled: boolean) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const context = CORE_SELECTORS.getContext(state)
    const account = CORE_SELECTORS.getAccount(state)

    dispatch(SETTINGS_ACTIONS.togglePinLoginEnabled(pinLoginEnabled))
    return account.changePin({ enableLogin: pinLoginEnabled }).catch(async error => {
      const pinLoginEnabled = await context.pinLoginEnabled(account.username)

      // TODO: Make a proper error action so we can avoid the double dispatch:
      dispatch(SETTINGS_ACTIONS.togglePinLoginEnabled(pinLoginEnabled))
      console.log(error)
      dispatch(displayErrorAlert(error.message))
    })
  }
}

export const showReEnableOtpModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const otpResetDate = account.otpResetDate
  if (!otpResetDate) return
  // Use `showModal` to put the modal component on screen:
  const modal = createYesNoModal({
    title: s.strings.title_otp_keep_modal,
    message: s.strings.otp_modal_reset_description,
    icon: <Image source={iconImage} />,
    yesButtonText: s.strings.otp_keep,
    noButtonText: s.strings.otp_disable
  })
  const resolveValue = await showModal(modal)
  if (resolveValue === true) {
    // true on positive, false on negative
    // let 2FA expire
    dispatch(keepOtp())
  } else if (resolveValue === false) {
    dispatch(disableOtp())
  } // if default of null (press backdrop) do not change anything and keep reminding
}

export const enableCustomNodes = (currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state: State = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    await currencyPlugin.changeUserSettings({ ...currencyPlugin.userSettings, disableFetchingServers: true })
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
}

export const disableCustomNodes = (currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state: State = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    await currencyPlugin.changeUserSettings({ ...currencyPlugin.userSettings, disableFetchingServers: false })
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
}

export const saveCustomNodesList = (currencyCode: string, nodesList: Array<string>) => async (dispatch: Dispatch, getState: GetState) => {
  const state: State = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    await currencyPlugin.changeUserSettings({ ...currencyPlugin.userSettings, electrumServers: nodesList })
  } catch (e) {
    console.log(e)
    throw new Error('Unable to save plugin setting')
  }
}

export const showUnlockSettingsModal = () => async (dispatch: Dispatch, getState: GetState) => {
  try {
    const input = {
      label: s.strings.confirm_password_text,
      autoCorrect: false,
      returnKeyType: 'go',
      initialValue: '',
      autoFocus: true
    }
    const yesButton = {
      title: s.strings.string_done_cap
    }
    const noButton = {
      title: s.strings.string_cancel_cap
    }
    const validateInput = async (input): Promise<{ success: boolean, message: string }> => {
      const state = getState()
      const account = CORE_SELECTORS.getAccount(state)
      const isPassword = await account.checkPassword(input)
      if (isPassword) {
        dispatch({ type: 'PASSWORD_USED' })
        return {
          success: true,
          message: ''
        }
      } else {
        return {
          success: false,
          message: s.strings.password_reminder_invalid
        }
      }
    }
    const unlockSettingsModal = createSecureTextModal({
      icon: <Icon style={{ position: 'relative', left: 1 }} type={ION_ICONS} name={LOCKED_ICON} color={THEME.COLORS.PRIMARY} size={30} />,
      title: s.strings.enter_your_password,
      input,
      yesButton,
      noButton,
      validateInput
    })
    const resolveValue = await showModal(unlockSettingsModal)
    if (resolveValue) {
      dispatch(SETTINGS_ACTIONS.setSettingsLock(false))
    }
  } catch (e) {
    throw new Error('Unable to unlock settings')
  }
}

export const showSendLogsModal = () => async (dispatch: Dispatch, getState: GetState) => {
  try {
    const input = {
      label: s.strings.settings_modal_text_entry_notes,
      autoCorrect: false,
      returnKeyType: 'go',
      initialValue: '',
      autoFocus: true
    }
    const yesButton = {
      title: s.strings.string_done_cap
    }
    const noButton = {
      title: s.strings.string_cancel_cap
    }
    // use standard icon instead?
    const unlockSettingsModal = createInputModal({
      icon: (
        <IonIcon
          name="ios-paper-plane"
          size={24}
          color={colors.primary}
          style={[
            {
              backgroundColor: THEME.COLORS.TRANSPARENT,
              zIndex: 1015,
              elevation: 1015
            }
          ]}
        />
      ),
      title: s.strings.settings_button_send_logs,
      input,
      yesButton,
      noButton
    })
    const notes = await showModal(unlockSettingsModal)
    if (notes) {
      dispatch(sendLogs(notes))
    }
  } catch (e) {
    throw new Error('Send logs failed, please contact support')
  }
}

export const showRestoreWalletsModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = state.core.account
  const restoreWalletsModal = createYesNoModal({
    title: s.strings.restore_wallets_modal_title,
    icon: <Icon type={'entypo'} name="wallet" size={30} />,
    message: s.strings.restore_wallets_modal_description,
    noButtonText: s.strings.restore_wallets_modal_cancel,
    yesButtonText: s.strings.restore_wallets_modal_confirm
  })
  const response = await showModal(restoreWalletsModal)
  if (response) {
    await restoreWalletsRequest(account)
    Actions[WALLET_LIST]()
  }
}
