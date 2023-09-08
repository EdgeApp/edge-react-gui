import { asArray, asBoolean, asMaybe, asNumber, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'
import { EdgeAccount, EdgeDenomination, EdgeSwapPluginType } from 'edge-core-js'
import { disableTouchId, enableTouchId } from 'edge-login-ui-rn'
import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { asSortOption, SortOption } from '../components/modals/WalletListSortModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { convertCurrency } from '../selectors/WalletSelectors'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { asMostRecentWallet, MostRecentWallet } from '../types/types'
import { logActivity } from '../util/logger'
import { DECIMAL_PRECISION } from '../util/utils'
import { validatePassword } from './AccountActions'
import { updateExchangeRates } from './ExchangeRateActions'
import { writeSpendingLimits } from './LocalSettingsActions'
import { registerNotificationsV2 } from './NotificationActions'

export function updateOneSetting(setting: object): ThunkAction<void> {
  return (dispatch, getState) => {
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
}

export function setAutoLogoutTimeInSecondsRequest(autoLogoutTimeInSeconds: number): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    await writeAutoLogoutTimeInSeconds(account, autoLogoutTimeInSeconds)
    dispatch({
      type: 'UI/SETTINGS/SET_AUTO_LOGOUT_TIME',
      data: { autoLogoutTimeInSeconds }
    })
  }
}

export function setDefaultFiatRequest(defaultFiat: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    // PSEUDO_CODE
    // get spendingLimits
    const spendingLimits = state.ui.settings.spendingLimits
    const { transaction } = spendingLimits
    const previousDefaultIsoFiat = state.ui.settings.defaultIsoFiat

    // update default fiat in account settings
    await writeDefaultFiatSetting(account, defaultFiat)

    // update default fiat in settings
    dispatch({
      type: 'UI/SETTINGS/SET_DEFAULT_FIAT',
      data: { defaultFiat }
    })
    const nextDefaultIsoFiat = getState().ui.settings.defaultIsoFiat
    // convert from previous fiat to next fiat
    const fiatString = convertCurrency(state, previousDefaultIsoFiat, nextDefaultIsoFiat, transaction.amount.toFixed(DECIMAL_PRECISION))
    const transactionAmount = parseFloat(fiatString)
    const nextSpendingLimits = {
      transaction: {
        ...transaction,
        amount: parseFloat(transactionAmount.toFixed(2))
      }
    }

    // update spending limits in account settings
    await writeSpendingLimits(account, nextSpendingLimits)
    // update spending limits in settings
    dispatch({
      type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS',
      data: { spendingLimits: nextSpendingLimits }
    })
    await dispatch(updateExchangeRates())
    // Update push notifications
    await dispatch(registerNotificationsV2(true))
  }
}

export function setPreferredSwapPluginId(pluginId: string | undefined): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    writePreferredSwapPluginId(account, pluginId)
      .then(() => {
        dispatch({
          type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN',
          data: pluginId
        })
        dispatch({
          type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN_TYPE',
          data: undefined
        })
      })
      .catch(showError)
  }
}

export function setPreferredSwapPluginType(swapPluginType: EdgeSwapPluginType | undefined): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    writePreferredSwapPluginType(account, swapPluginType)
      .then(() => {
        dispatch({
          type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN_TYPE',
          data: swapPluginType
        })
        dispatch({
          type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN',
          data: undefined
        })
      })
      .catch(showError)
  }
}

// Denominations
export function setDenominationKeyRequest(pluginId: string, currencyCode: string, denomination: EdgeDenomination): ThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    return await writeDenominationKeySetting(account, pluginId, currencyCode, denomination)
      .then(() =>
        dispatch({
          type: 'UI/SETTINGS/SET_DENOMINATION_KEY',
          data: { pluginId, currencyCode, denomination }
        })
      )
      .catch(showError)
  }
}

// touch id interaction
export function updateTouchIdEnabled(isTouchEnabled: boolean, account: EdgeAccount): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
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
}

export function togglePinLoginEnabled(pinLoginEnabled: boolean): ThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { context, account } = state.core

    dispatch({
      type: 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED',
      data: { pinLoginEnabled }
    })
    return await account.changePin({ enableLogin: pinLoginEnabled }).catch(async error => {
      showError(error)

      let pinLoginEnabled = false
      for (const userInfo of context.localUsers) {
        if (userInfo.loginId === account.rootLoginId && userInfo.pinLoginEnabled) {
          pinLoginEnabled = true
        }
      }

      dispatch({
        type: 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED',
        data: { pinLoginEnabled }
      })
    })
  }
}

export function showReEnableOtpModal(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const otpResetDate = account.otpResetDate
    if (!otpResetDate) return

    const resolveValue = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.title_otp_keep_modal}
        message={lstrings.otp_modal_reset_description}
        buttons={{
          confirm: { label: lstrings.otp_keep },
          cancel: { label: lstrings.otp_disable }
        }}
      />
    ))

    if (resolveValue === 'confirm') {
      // true on positive, false on negative
      // let 2FA expire
      await account.cancelOtpReset()
    } else {
      await account.disableOtp()
    } // if default of null (press backdrop) do not change anything and keep reminding
  }
}

export function showUnlockSettingsModal(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const passwordValid = await dispatch(validatePassword())
    if (passwordValid) {
      dispatch({
        type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
        data: false
      })
    }
  }
}

export function showRestoreWalletsModal(navigation: NavigationBase): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const response = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.restore_wallets_modal_title}
        message={lstrings.restore_wallets_modal_description}
        buttons={{
          confirm: { label: lstrings.restore_wallets_modal_confirm },
          cancel: { label: lstrings.restore_wallets_modal_cancel }
        }}
      />
    ))
    if (response === 'confirm') {
      const restoreKeys = account.allKeys.filter(key => key.archived || key.deleted)
      await Promise.all(
        restoreKeys
          .map(key => key.id)
          .map(
            async walletId =>
              await account.changeWalletStates({
                [walletId]: { archived: false, deleted: false }
              })
          )
      )
      logActivity(`Restore Wallets: ${account.username}`)

      navigation.navigate('walletsTab', { screen: 'walletList' })
    }
  }
}

export const asPasswordReminderLevels = asObject({
  '20': asMaybe(asBoolean, false),
  '200': asMaybe(asBoolean, false),
  '2000': asMaybe(asBoolean, false),
  '20000': asMaybe(asBoolean, false),
  '200000': asMaybe(asBoolean, false)
})

export type PasswordReminderLevels = ReturnType<typeof asPasswordReminderLevels>
export type PasswordReminderTime = keyof PasswordReminderLevels

export const asCurrencyCodeDenom = asObject({
  name: asString,
  multiplier: asString,
  symbol: asOptional(asString)
})

const asDenominationSettings = asObject(asMaybe(asObject(asMaybe(asCurrencyCodeDenom))))

export type DenominationSettings = ReturnType<typeof asDenominationSettings>
export const asSwapPluginType: Cleaner<'CEX' | 'DEX'> = asValue('CEX', 'DEX')

export type SecurityCheckedWallets = Record<string, { checked: boolean; modalShown: number }>

const asSecurityCheckedWallets: Cleaner<SecurityCheckedWallets> = asObject(
  asObject({
    checked: asBoolean,
    modalShown: asNumber
  })
)

export const asSyncedAccountSettings = asObject({
  autoLogoutTimeInSeconds: asMaybe(asNumber, 3600),
  defaultFiat: asMaybe(asString, 'USD'),
  defaultIsoFiat: asMaybe(asString, 'iso:USD'),
  preferredSwapPluginId: asMaybe(asString),
  preferredSwapPluginType: asMaybe(asSwapPluginType),
  countryCode: asMaybe(asString, ''),
  mostRecentWallets: asMaybe(asArray(asMostRecentWallet), () => []),
  passwordRecoveryRemindersShown: asMaybe(asPasswordReminderLevels, () => asPasswordReminderLevels({})),
  walletsSort: asMaybe(asSortOption, 'manual'),
  denominationSettings: asMaybe<DenominationSettings>(asDenominationSettings, () => ({})),
  securityCheckedWallets: asMaybe<SecurityCheckedWallets>(asSecurityCheckedWallets, () => ({}))
})

export type SyncedAccountSettings = ReturnType<typeof asSyncedAccountSettings>

// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = asSyncedAccountSettings({})

const SYNCED_SETTINGS_FILENAME = 'Settings.json'

// Account Settings
const writeAutoLogoutTimeInSeconds = async (account: EdgeAccount, autoLogoutTimeInSeconds: number) =>
  await readSyncedSettings(account).then(async settings => {
    const updatedSettings = { ...settings, autoLogoutTimeInSeconds }
    return await writeSyncedSettings(account, updatedSettings)
  })

const writeDefaultFiatSetting = async (account: EdgeAccount, defaultFiat: string) =>
  await readSyncedSettings(account).then(async settings => {
    const updatedSettings = {
      ...settings,
      defaultFiat,
      defaultIsoFiat: `iso:${defaultFiat}`
    }
    return await writeSyncedSettings(account, updatedSettings)
  })

const writePreferredSwapPluginId = async (account: EdgeAccount, pluginId: string | undefined) => {
  return await readSyncedSettings(account).then(async settings => {
    const updatedSettings = {
      ...settings,
      preferredSwapPluginId: pluginId == null ? '' : pluginId,
      preferredSwapPluginType: undefined
    }
    return await writeSyncedSettings(account, updatedSettings)
  })
}

const writePreferredSwapPluginType = async (account: EdgeAccount, swapPluginType: EdgeSwapPluginType | undefined) => {
  return await readSyncedSettings(account).then(async settings => {
    const updatedSettings = {
      ...settings,
      preferredSwapPluginType: swapPluginType,
      preferredSwapPluginId: ''
    }
    return await writeSyncedSettings(account, updatedSettings)
  })
}

export const writeMostRecentWalletsSelected = async (account: EdgeAccount, mostRecentWallets: MostRecentWallet[]) =>
  await readSyncedSettings(account).then(async settings => {
    const updatedSettings = { ...settings, mostRecentWallets }
    return await writeSyncedSettings(account, updatedSettings)
  })

export const writeWalletsSort = async (account: EdgeAccount, walletsSort: SortOption) =>
  await readSyncedSettings(account).then(async settings => {
    const updatedSettings = { ...settings, walletsSort }
    return await writeSyncedSettings(account, updatedSettings)
  })

export async function writePasswordRecoveryReminders(account: EdgeAccount, level: PasswordReminderTime) {
  const settings = await readSyncedSettings(account)
  const passwordRecoveryRemindersShown = {
    ...settings.passwordRecoveryRemindersShown
  }
  passwordRecoveryRemindersShown[level] = true
  const updatedSettings = { ...settings, passwordRecoveryRemindersShown }
  return await writeSyncedSettings(account, updatedSettings)
}

// Currency Settings
const writeDenominationKeySetting = async (account: EdgeAccount, pluginId: string, currencyCode: string, denomination: EdgeDenomination) =>
  await readSyncedSettings(account).then(async settings => {
    const updatedSettings = updateCurrencySettings(settings, pluginId, currencyCode, denomination)
    return await writeSyncedSettings(account, updatedSettings)
  })

// Helper Functions
export async function readSyncedSettings(account: EdgeAccount): Promise<SyncedAccountSettings> {
  try {
    if (account?.disklet?.getText == null) return SYNCED_ACCOUNT_DEFAULTS
    const text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
    const settingsFromFile = JSON.parse(text)
    return asSyncedAccountSettings(settingsFromFile)
  } catch (e: any) {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    await writeSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
    return SYNCED_ACCOUNT_DEFAULTS
  }
}

export async function writeSyncedSettings(account: EdgeAccount, settings: SyncedAccountSettings): Promise<void> {
  const text = JSON.stringify(settings)
  if (account?.disklet?.setText == null) return
  await account.disklet.setText(SYNCED_SETTINGS_FILENAME, text)
}

const updateCurrencySettings = (currentSettings: any, pluginId: string, currencyCode: string, denomination: EdgeDenomination) => {
  // update with new settings
  const updatedSettings = {
    ...currentSettings
  }
  if (updatedSettings.denominationSettings[pluginId] == null) updatedSettings.denominationSettings[pluginId] = {}
  updatedSettings.denominationSettings[pluginId][currencyCode] = denomination
  return updatedSettings
}
