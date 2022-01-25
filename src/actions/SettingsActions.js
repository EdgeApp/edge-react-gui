// @flow

import type { EdgeAccount, EdgeDenomination } from 'edge-core-js'
import { disableTouchId, enableTouchId } from 'edge-login-ui-rn'
import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { WALLET_LIST } from '../constants/SceneKeys.js'
import s from '../locales/strings.js'
import {
  setAutoLogoutTimeInSecondsRequest as setAutoLogoutTimeInSecondsRequestAccountSettings,
  setDefaultFiatRequest as setDefaultFiatRequestAccountSettings,
  setDenominationKeyRequest as setDenominationKeyRequestAccountSettings,
  setDeveloperModeOn as setDeveloperModeOnAccountSettings,
  setPreferredSwapPluginId as setPreferredSwapPluginIdAccountSettings,
  setSpendingLimits as setSpendingLimitsAccountSettings
} from '../modules/Core/Account/settings.js'
import { convertCurrency } from '../selectors/WalletSelectors.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { DECIMAL_PRECISION } from '../util/utils.js'
import { validatePassword } from './AccountActions.js'
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
  setAutoLogoutTimeInSecondsRequestAccountSettings(account, autoLogoutTimeInSeconds)
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
      setDefaultFiatRequestAccountSettings(account, defaultFiat)
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
      setSpendingLimitsAccountSettings(account, nextSpendingLimits)
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
  setPreferredSwapPluginIdAccountSettings(account, pluginId)
    .then(() =>
      dispatch({
        type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN',
        data: pluginId
      })
    )
    .catch(showError)
}

// Denominations
export const setDenominationKeyRequest =
  (pluginId: string, currencyCode: string, denomination: EdgeDenomination) => (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core

    return setDenominationKeyRequestAccountSettings(account, pluginId, currencyCode, denomination)
      .then(() =>
        dispatch({
          type: 'UI/SETTINGS/SET_DENOMINATION_KEY',
          data: { pluginId, currencyCode, denomination }
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
    await enableTouchId(account)
  } else {
    await disableTouchId(account)
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
        cancel: { label: s.strings.otp_disable }
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

export const showUnlockSettingsModal = () => async (dispatch: Dispatch, getState: GetState) => {
  const passwordValid = await dispatch(validatePassword())
  if (passwordValid) {
    dispatch({
      type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
      data: false
    })
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
        cancel: { label: s.strings.restore_wallets_modal_cancel }
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
  setDeveloperModeOnAccountSettings(account, developerModeOn)
    .then(() => {
      if (developerModeOn) {
        dispatch({ type: 'DEVELOPER_MODE_ON' })
        return
      }
      dispatch({ type: 'DEVELOPER_MODE_OFF' })
    })
    .catch(showError)
}
