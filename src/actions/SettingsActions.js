// @flow

import { createSecureTextModal } from 'edge-components'
import type { EdgeAccount } from 'edge-core-js'
import { disableTouchId, enableTouchId } from 'edge-login-ui-rn'
import * as React from 'react'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { launchModal } from '../components/common/ModalProvider.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { WALLET_LIST } from '../constants/SceneKeys.js'
import { CURRENCY_PLUGIN_NAMES } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import * as ACCOUNT_SETTINGS from '../modules/Core/Account/settings.js'
import { convertCurrency } from '../selectors/WalletSelectors.js'
import { THEME } from '../theme/variables/airbitz.js'
import { type Dispatch, type GetState, type RootState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { DECIMAL_PRECISION } from '../util/utils.js'
import { updateExchangeRates } from './ExchangeRateActions.js'

export const updateOneSetting = (setting: Object) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const settings = state.ui.settings
  const updatedSettings = {
    ...settings,
    ...setting
  }
  dispatch({
    type: 'UI/SETTINGS/UPDATE_SETTINGS',
    data: { settings: updatedSettings }
  })
}

export const setAutoLogoutTimeInSecondsRequest = (autoLogoutTimeInSeconds: number) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  ACCOUNT_SETTINGS.setAutoLogoutTimeInSecondsRequest(account, autoLogoutTimeInSeconds)
    .then(() =>
      dispatch({
        type: 'UI/SETTINGS/SET_AUTO_LOGOUT_TIME',
        data: { autoLogoutTimeInSeconds }
      })
    )
    .catch(showError)
}

export const setDefaultFiatRequest = (defaultFiat: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

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
      dispatch({
        type: 'UI/SETTINGS/SET_DEFAULT_FIAT',
        data: { defaultFiat }
      })
      const nextDefaultIsoFiat = getState().ui.settings.defaultIsoFiat
      // convert from previous fiat to next fiat
      const fiatString = convertCurrency(state, previousDefaultIsoFiat, nextDefaultIsoFiat, transaction.amount.toFixed(DECIMAL_PRECISION))
      return parseFloat(fiatString)
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
      dispatch({
        type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
        data: { spendingLimits: nextSpendingLimits }
      })
      dispatch(updateExchangeRates())
    })
    .catch(showError)
}

export const setPreferredSwapPluginId = (pluginId: string | void) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  ACCOUNT_SETTINGS.setPreferredSwapPluginId(account, pluginId)
    .then(() =>
      dispatch({
        type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN',
        data: pluginId
      })
    )
    .catch(showError)
}

// Denominations
export const setDenominationKeyRequest = (currencyCode: string, denominationKey: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  return ACCOUNT_SETTINGS.setDenominationKeyRequest(account, currencyCode, denominationKey)
    .then(() =>
      dispatch({
        type: 'UI/SETTINGS/SET_DENOMINATION_KEY',
        data: { currencyCode, denominationKey }
      })
    )
    .catch(showError)
}

// touch id interaction
export const updateTouchIdEnabled = (isTouchEnabled: boolean, account: EdgeAccount) => async (dispatch: Dispatch, getState: GetState) => {
  // dispatch the update for the new state for
  dispatch({
    type: 'UI/SETTINGS/CHANGE_TOUCH_ID_SETTINGS',
    data: { isTouchEnabled }
  })
  if (isTouchEnabled) {
    enableTouchId(account)
  } else {
    disableTouchId(account)
  }
}

export function togglePinLoginEnabled(pinLoginEnabled: boolean) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { context, account } = state.core

    dispatch({
      type: 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED',
      data: { pinLoginEnabled }
    })
    return account.changePin({ enableLogin: pinLoginEnabled }).catch(async error => {
      showError(error)

      const pinLoginEnabled = await context.pinLoginEnabled(account.username)
      dispatch({
        type: 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED',
        data: { pinLoginEnabled }
      })
    })
  }
}

export const showReEnableOtpModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const otpResetDate = account.otpResetDate
  if (!otpResetDate) return

  const resolveValue = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.title_otp_keep_modal}
      message={s.strings.otp_modal_reset_description}
      buttons={{
        confirm: { label: s.strings.otp_keep },
        cancel: { label: s.strings.otp_disable, type: 'secondary' }
      }}
    />
  ))

  if (resolveValue === 'confirm') {
    // true on positive, false on negative
    // let 2FA expire
    account.cancelOtpReset()
  } else {
    account.disableOtp()
  } // if default of null (press backdrop) do not change anything and keep reminding
}

export const enableCustomNodes = (currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state: RootState = getState()
  const { account } = state.core
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    await currencyPlugin.changeUserSettings({ ...currencyPlugin.userSettings, disableFetchingServers: true })
  } catch (error) {
    showError(error)
  }
}

export const disableCustomNodes = (currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state: RootState = getState()
  const { account } = state.core
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    await currencyPlugin.changeUserSettings({ ...currencyPlugin.userSettings, disableFetchingServers: false })
  } catch (error) {
    showError(error)
  }
}

export const saveCustomNodesList = (currencyCode: string, nodesList: string[]) => async (dispatch: Dispatch, getState: GetState) => {
  const state: RootState = getState()
  const { account } = state.core
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  try {
    await currencyPlugin.changeUserSettings({ ...currencyPlugin.userSettings, electrumServers: nodesList })
  } catch (error) {
    showError(error)
  }
}

export const showUnlockSettingsModal = () => async (dispatch: Dispatch, getState: GetState) => {
  try {
    const input = {
      label: s.strings.enter_your_password,
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
      const { account } = state.core
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
      icon: <AntDesignIcon style={{ position: 'relative', left: 1 }} name="lock" color={THEME.COLORS.PRIMARY} size={30} />,
      title: s.strings.confirm_password_text,
      input,
      yesButton,
      noButton,
      validateInput
    })
    const resolveValue = await launchModal(unlockSettingsModal)
    if (resolveValue) {
      dispatch({
        type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
        data: false
      })
    }
  } catch (error) {
    showError(error)
  }
}

export const showRestoreWalletsModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const response = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.restore_wallets_modal_title}
      message={s.strings.restore_wallets_modal_description}
      buttons={{
        confirm: { label: s.strings.restore_wallets_modal_confirm },
        cancel: { label: s.strings.restore_wallets_modal_cancel, type: 'secondary' }
      }}
    />
  ))
  if (response === 'confirm') {
    const restoreKeys = account.allKeys.filter(key => key.archived || key.deleted)
    await Promise.all(
      restoreKeys
        .map(key => key.id)
        .map(walletId =>
          account.changeWalletStates({
            [walletId]: { archived: false, deleted: false }
          })
        )
    )
    Actions.jump(WALLET_LIST)
  }
}

export const setDeveloperModeOn = (developerModeOn: boolean) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  ACCOUNT_SETTINGS.setDeveloperModeOn(account, developerModeOn)
    .then(() => {
      if (developerModeOn) {
        dispatch({ type: 'DEVELOPER_MODE_ON' })
        return
      }
      dispatch({ type: 'DEVELOPER_MODE_OFF' })
    })
    .catch(showError)
}
