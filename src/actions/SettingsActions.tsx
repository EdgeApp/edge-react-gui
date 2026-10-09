import {
  asArray,
  asBoolean,
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue,
  type Cleaner
} from 'cleaners'
import type {
  EdgeAccount,
  EdgeDenomination,
  EdgeSwapPluginType
} from 'edge-core-js'
import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import {
  asSortOption,
  type SortOption
} from '../components/modals/WalletListSortModal'
import {
  Airship,
  showError,
  showToast
} from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import type { SettingsState } from '../reducers/scenes/SettingsReducer'
import { convertFiatCurrency } from '../selectors/WalletSelectors'
import type { ThunkAction } from '../types/reduxTypes'
import {
  asEdgeTokenId,
  asMostRecentWallet,
  type MostRecentWallet
} from '../types/types'
import { errorMessage } from '../util/errorMessage'
import { reportWarning } from '../util/reportWarning'
import {
  readSyncedSettingsObjectOrThrow,
  SYNCED_SETTINGS_FILENAME
} from '../util/syncedSettingsFile'
import { DECIMAL_PRECISION } from '../util/utils'
import { validatePassword } from './AccountActions'
import { updateExchangeRates } from './ExchangeRateActions'
import { writeSpendingLimits } from './LocalSettingsActions'
import { registerNotificationsV2 } from './NotificationActions'

export function checkEnabledExchanges(): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    // make sure exchanges are enabled
    let isAnyExchangeEnabled = false
    const exchanges = account.swapConfig
    if (exchanges == null) return
    for (const exchange of Object.keys(exchanges)) {
      if (exchange === 'transfer') continue
      if (exchanges[exchange].enabled) {
        isAnyExchangeEnabled = true
      }
    }

    if (!isAnyExchangeEnabled) {
      Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          buttons={{ ok: { label: lstrings.string_ok_cap } }}
          title={lstrings.no_exchanges_available}
          message={lstrings.check_exchange_settings}
        />
      )).catch(() => {})
    }
  }
}

export function updateOneSetting(
  setting: Partial<SettingsState>
): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const settings = state.ui.settings
    const updatedSettings: SettingsState = {
      ...settings,
      ...setting
    }
    dispatch({
      type: 'UI/SETTINGS/UPDATE_SETTINGS',
      data: { settings: updatedSettings }
    })
  }
}

export function setAutoLogoutTimeInSecondsRequest(
  autoLogoutTimeInSeconds: number
): ThunkAction<Promise<void>> {
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

export function setDefaultFiatRequest(
  defaultFiat: string
): ThunkAction<Promise<void>> {
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
    const fiatString = convertFiatCurrency(
      state,
      previousDefaultIsoFiat,
      nextDefaultIsoFiat,
      transaction.amount.toFixed(DECIMAL_PRECISION)
    )
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

export function setPreferredSwapPluginId(
  pluginId: string | undefined
): ThunkAction<void> {
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
      .catch((error: unknown) => {
        showError(error)
      })
  }
}

export function setPreferredSwapPluginType(
  swapPluginType: EdgeSwapPluginType | undefined
): ThunkAction<void> {
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
      .catch((error: unknown) => {
        showError(error)
      })
  }
}

// Denominations
export function setDenominationKeyRequest(
  pluginId: string,
  currencyCode: string,
  denomination: EdgeDenomination
): ThunkAction<Promise<unknown>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    return await writeDenominationKeySetting(
      account,
      pluginId,
      currencyCode,
      denomination
    )
      .then(() =>
        dispatch({
          type: 'UI/SETTINGS/SET_DENOMINATION_KEY',
          data: { pluginId, currencyCode, denomination }
        })
      )
      .catch((error: unknown) => {
        showError(error)
      })
  }
}

export async function showReEnableOtpModal(
  account: EdgeAccount
): Promise<void> {
  const resolveValue = await Airship.show<'confirm' | 'cancel' | undefined>(
    bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.title_otp_keep_modal}
        message={lstrings.otp_modal_reset_description}
        buttons={{
          confirm: { label: lstrings.otp_keep },
          cancel: { label: lstrings.otp_disable }
        }}
      />
    )
  )

  if (resolveValue === 'confirm') {
    await account.cancelOtpReset()
  } else {
    await account.disableOtp()
  }
}

export function showUnlockSettingsModal(): ThunkAction<
  Promise<string | undefined>
> {
  return async dispatch => {
    const password = await dispatch(validatePassword())
    if (password != null) {
      dispatch({
        type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
        data: false
      })
    }
    return password
  }
}

export const toggleUserPausedWallet =
  (account: EdgeAccount, walletId: string): ThunkAction<Promise<void>> =>
  async dispatch => {
    let isPaused = false
    const { userPausedWallets } = await updateSyncedSettings(
      account,
      settings => {
        isPaused = settings.userPausedWallets.includes(walletId)
        return {
          ...settings,
          userPausedWallets: isPaused
            ? settings.userPausedWallets.filter(id => id !== walletId)
            : [...settings.userPausedWallets, walletId]
        }
      }
    )

    showToast(
      isPaused ? lstrings.unpause_wallet_toast : lstrings.pause_wallet_toast
    )

    dispatch({
      type: 'UI/SETTINGS/SET_USER_PAUSED_WALLETS',
      data: { userPausedWallets: [...userPausedWallets] }
    })
  }

export const setRampFiatCurrencyCode =
  (
    account: EdgeAccount,
    rampLastFiatCurrencyCode: string
  ): ThunkAction<Promise<void>> =>
  async dispatch => {
    await updateSyncedSettings(account, settings => ({
      ...settings,
      rampLastFiatCurrencyCode
    }))
    dispatch(updateOneSetting({ rampLastFiatCurrencyCode }))
  }

export const setRampCryptoSelection =
  (
    account: EdgeAccount,
    rampLastCryptoSelection: RampLastCryptoSelection | undefined
  ): ThunkAction<Promise<void>> =>
  async dispatch => {
    await updateSyncedSettings(account, settings => ({
      ...settings,
      rampLastCryptoSelection
    }))
    dispatch(updateOneSetting({ rampLastCryptoSelection }))
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

const asDenominationSettings = asObject(
  asMaybe(asObject(asMaybe(asCurrencyCodeDenom)))
)

export type DenominationSettings = ReturnType<typeof asDenominationSettings>
export const asSwapPluginType: Cleaner<'CEX' | 'DEX'> = asValue('CEX', 'DEX')

export type SecurityCheckedWallets = Record<
  string,
  { checked: boolean; modalShown: number }
>

const asSecurityCheckedWallets: Cleaner<SecurityCheckedWallets> = asObject(
  asObject({
    checked: asBoolean,
    modalShown: asNumber
  })
)

export const asRampLastCryptoSelection = asObject({
  walletId: asString,
  tokenId: asEdgeTokenId
})
export type RampLastCryptoSelection = ReturnType<
  typeof asRampLastCryptoSelection
>

export const asSyncedAccountSettings = asObject({
  autoLogoutTimeInSeconds: asMaybe(asNumber, 3600),
  defaultFiat: asMaybe(asString, 'USD'),
  defaultIsoFiat: asMaybe(asString, 'iso:USD'),
  preferredSwapPluginId: asMaybe(asString),
  preferredSwapPluginType: asMaybe(asSwapPluginType),
  countryCode: asMaybe(asString, ''),
  stateProvinceCode: asMaybe(asString),
  rampLastFiatCurrencyCode: asMaybe(asString),
  rampLastCryptoSelection: asMaybe(asRampLastCryptoSelection),
  mostRecentWallets: asMaybe(asArray(asMostRecentWallet), () => []),
  passwordRecoveryRemindersShown: asMaybe(asPasswordReminderLevels, () =>
    asPasswordReminderLevels({})
  ),
  walletsSort: asMaybe(asSortOption, 'manual'),
  denominationSettings: asMaybe<DenominationSettings>(
    asDenominationSettings,
    () => ({})
  ),
  // Flag to track one-time denomination settings cleanup migration
  denominationSettingsOptimized: asMaybe(asBoolean, false),
  securityCheckedWallets: asMaybe<SecurityCheckedWallets>(
    asSecurityCheckedWallets,
    () => ({})
  ),
  userPausedWallets: asMaybe(asArray(asString), () => [])
})

export type SyncedAccountSettings = ReturnType<typeof asSyncedAccountSettings>

// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = asSyncedAccountSettings({})

/**
 * Whether Redux's copy of the synced settings is the user's own.
 *
 * `state.ui.settings.defaultIsoFiat` and `.denominationSettings` are filled
 * once, at `initializeAccount`, by the lenient reader, and nothing refreshes
 * them afterwards — so a `Settings.json` that was present and unreadable at
 * login puts `'iso:USD'` and `{}` there for the whole session, and the export
 * derivation cannot tell that from an account that has chosen nothing. A
 * BTC wallet the user set to `bits` then exports `0.0005` and
 * `DENOMINATION=BTC` instead of `50000` and `bits`, with every row priced
 * and labelled `iso:USD`, while `edge-cli get-transactions --export-format`
 * on the same wallet refuses, because the engine reads the file strictly.
 *
 * So this records the outcome of *that* read and nothing else. It used to
 * follow whichever lenient read ran last anywhere in the app, which
 * described the file rather than Redux: a gift-card list opening after the
 * sync caught up flipped it to trusted while Redux still held the defaults,
 * and one failed read after a good login blocked every export while Redux
 * was correct. Reset on logout, because the next account's login sets it.
 */
let loginSyncedSettingsTrusted = true

/** Called on logout, so one account's login read is not another's. */
export const resetSyncedSettingsTrust = (): void => {
  loginSyncedSettingsTrusted = true
}

export const syncedSettingsAreTrusted = (): boolean =>
  loginSyncedSettingsTrusted

/**
 * The login's read: the lenient answer, with whether it can be trusted
 * recorded for `syncedSettingsAreTrusted`.
 */
export async function readSyncedSettingsForLogin(
  account: EdgeAccount
): Promise<SyncedAccountSettings> {
  try {
    const settings = await readSyncedSettingsStrict(account)
    loginSyncedSettingsTrusted = true
    return settings
  } catch (error: unknown) {
    loginSyncedSettingsTrusted = false
    reportReadFailure(error)
    return SYNCED_ACCOUNT_DEFAULTS
  }
}

/**
 * The synced settings, failing for a file that is there and unreadable.
 *
 * What counts as unreadable is `syncedSettingsFile`'s decision, shared with
 * the engine; this applies the GUI's full cleaner on top.
 */
async function readSyncedSettingsStrict(
  account: EdgeAccount
): Promise<SyncedAccountSettings> {
  if (account?.disklet?.getText == null) return SYNCED_ACCOUNT_DEFAULTS
  return asSyncedAccountSettings(await readSyncedSettingsObjectOrThrow(account))
}

function reportReadFailure(error: unknown): void {
  reportWarning(
    `Could not read synced ${SYNCED_SETTINGS_FILENAME}, using defaults: ${errorMessage(
      error
    )}`
  )
}

// Account Settings
const writeAutoLogoutTimeInSeconds = async (
  account: EdgeAccount,
  autoLogoutTimeInSeconds: number
): Promise<void> => {
  await updateSyncedSettings(account, settings => ({
    ...settings,
    autoLogoutTimeInSeconds
  }))
}

const writeDefaultFiatSetting = async (
  account: EdgeAccount,
  defaultFiat: string
): Promise<void> => {
  await updateSyncedSettings(account, settings => ({
    ...settings,
    defaultFiat,
    defaultIsoFiat: `iso:${defaultFiat}`
  }))
}

const writePreferredSwapPluginId = async (
  account: EdgeAccount,
  pluginId: string | undefined
): Promise<void> => {
  await updateSyncedSettings(account, settings => ({
    ...settings,
    preferredSwapPluginId: pluginId ?? '',
    preferredSwapPluginType: undefined
  }))
}

const writePreferredSwapPluginType = async (
  account: EdgeAccount,
  swapPluginType: EdgeSwapPluginType | undefined
): Promise<void> => {
  await updateSyncedSettings(account, settings => ({
    ...settings,
    preferredSwapPluginType: swapPluginType,
    preferredSwapPluginId: ''
  }))
}

export const writeMostRecentWalletsSelected = async (
  account: EdgeAccount,
  mostRecentWallets: MostRecentWallet[]
): Promise<void> => {
  await updateSyncedSettings(account, settings => ({
    ...settings,
    mostRecentWallets
  }))
}

export const writeWalletsSort = async (
  account: EdgeAccount,
  walletsSort: SortOption
): Promise<void> => {
  await updateSyncedSettings(account, settings => ({
    ...settings,
    walletsSort
  }))
}

export async function writePasswordRecoveryReminders(
  account: EdgeAccount,
  levels: PasswordReminderTime[]
): Promise<void> {
  await updateSyncedSettings(account, settings => {
    const passwordRecoveryRemindersShown = {
      ...settings.passwordRecoveryRemindersShown
    }
    for (const level of levels) {
      passwordRecoveryRemindersShown[level] = true
    }
    return { ...settings, passwordRecoveryRemindersShown }
  })
}

// Currency Settings
const writeDenominationKeySetting = async (
  account: EdgeAccount,
  pluginId: string,
  currencyCode: string,
  denomination: EdgeDenomination
): Promise<void> => {
  await updateSyncedSettings(account, settings =>
    updateCurrencySettings(settings, pluginId, currencyCode, denomination)
  )
}

// Helper Functions
/**
 * The lenient door: defaults for anything that could not be read.
 *
 * Right for a read-only caller — a `Settings.json` that is present and
 * unreadable must not stop a scene from rendering. Never the base of a
 * write: `updateSyncedSettings` reads for itself.
 */
export async function readSyncedSettings(
  account: EdgeAccount
): Promise<SyncedAccountSettings> {
  try {
    return await readSyncedSettingsStrict(account)
  } catch (error: unknown) {
    reportReadFailure(error)
    return SYNCED_ACCOUNT_DEFAULTS
  }
}

/**
 * Change the synced settings, starting from what the file really holds.
 *
 * The one write door, and it takes the change rather than a finished
 * object. Every writer used to read leniently, spread its one field over
 * the result and hand the whole object back — so a read that failed
 * produced `SYNCED_ACCOUNT_DEFAULTS`, and the write put `defaultIsoFiat`,
 * `denominationSettings`, `walletsSort`, `mostRecentWallets` and the rest
 * back to their defaults on the synced repo, for every device.
 * `migrateDenominationSettings` did it at every login with no user action,
 * and set the flag that stops a later login retrying. Guarding the write
 * with a trust flag did not close it: a re-read that succeeded proved the
 * file readable and then wrote the stale, defaults-based object anyway.
 *
 * Here the base is a strict read made for this write and nothing else, so
 * the change always lands on the real file. A file that cannot be read
 * stops the write and the caller's error path reports it. There is no
 * quarantine door, unlike the local copy: this file lives on the synced
 * repo, so moving it aside would propagate the removal to every device, and
 * a sync that has not finished may still bring a good copy.
 */
export async function updateSyncedSettings(
  account: EdgeAccount,
  update: (settings: SyncedAccountSettings) => SyncedAccountSettings
): Promise<SyncedAccountSettings> {
  const prev = await readSyncedSettingsStrict(account)
  const next = update(prev)
  // An update that changes nothing hands back the same object, and nothing
  // is written: a sync round trip for no change is the cost a once-per-login
  // migration would otherwise pay every login.
  if (next === prev || account?.disklet?.setText == null) return next
  await account.disklet.setText(SYNCED_SETTINGS_FILENAME, JSON.stringify(next))
  return next
}

const updateCurrencySettings = (
  currentSettings: any,
  pluginId: string,
  currencyCode: string,
  denomination: EdgeDenomination
): SyncedAccountSettings => {
  // update with new settings
  const updatedSettings = {
    ...currentSettings
  }
  updatedSettings.denominationSettings[pluginId] ??= {}
  updatedSettings.denominationSettings[pluginId][currencyCode] = denomination
  return updatedSettings
}

/**
 * One-time migration to clean up denomination settings by removing entries
 * that match the default values from currencyInfo. This reduces the size of
 * the synced settings file and speeds up subsequent logins.
 *
 * Only runs once per account - tracked via denominationSettingsOptimized flag.
 */
export async function migrateDenominationSettings(
  account: EdgeAccount
): Promise<void> {
  // Through the strict write door, rather than on the object the login's
  // lenient read produced. Taking that object meant a `Settings.json` that
  // was merely unreadable arrived here as `SYNCED_ACCOUNT_DEFAULTS`, which
  // takes the "nothing to clean, just set the flag" branch below and writes
  // the whole file out as defaults — and sets the flag, so no later login
  // retries. The throw reaches the `.catch` the caller already has.
  let needsCleanup = false
  await updateSyncedSettings(account, syncedSettings => {
    const result = optimizeDenominationSettings(account, syncedSettings)
    needsCleanup = result.needsCleanup
    return result.settings
  })

  if (needsCleanup) {
    console.log('Denomination settings cleaned up - removed default values')
  }
}

/** The migration's decision, given the file it applies to. */
function optimizeDenominationSettings(
  account: EdgeAccount,
  syncedSettings: SyncedAccountSettings
): { settings: SyncedAccountSettings; needsCleanup: boolean } {
  const { denominationSettings, denominationSettingsOptimized } = syncedSettings

  // Already migrated: the same object, which `updateSyncedSettings` does not
  // write back.
  if (denominationSettingsOptimized) {
    return { settings: syncedSettings, needsCleanup: false }
  }
  if (
    denominationSettings == null ||
    Object.keys(denominationSettings).length === 0
  ) {
    // No denomination settings to clean, just set the flag
    return {
      settings: { ...syncedSettings, denominationSettingsOptimized: true },
      needsCleanup: false
    }
  }

  // Clean up denomination settings by removing entries that match defaults
  const cleanedSettings: DenominationSettings = {}
  let needsCleanup = false

  for (const pluginId of Object.keys(denominationSettings)) {
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig == null) continue

    const { currencyInfo, allTokens } = currencyConfig
    const pluginDenoms = denominationSettings[pluginId]
    if (pluginDenoms == null) continue

    cleanedSettings[pluginId] = {}

    for (const currencyCode of Object.keys(pluginDenoms)) {
      const savedDenom = pluginDenoms[currencyCode]
      if (savedDenom == null) continue

      // Find the default denomination for this currency
      let defaultDenom: EdgeDenomination | undefined
      if (currencyCode === currencyInfo.currencyCode) {
        defaultDenom = currencyInfo.denominations[0]
      } else {
        // Look for token
        for (const tokenId of Object.keys(allTokens)) {
          const token = allTokens[tokenId]
          if (token.currencyCode === currencyCode) {
            defaultDenom = token.denominations[0]
            break
          }
        }
      }

      // Only keep if different from default
      if (
        defaultDenom == null ||
        savedDenom.multiplier !== defaultDenom.multiplier ||
        savedDenom.name !== defaultDenom.name
      ) {
        // @ts-expect-error - DenominationSettings type allows undefined
        cleanedSettings[pluginId][currencyCode] = savedDenom
      } else {
        needsCleanup = true
      }
    }

    // Remove empty plugin entries
    if (Object.keys(cleanedSettings[pluginId] ?? {}).length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete cleanedSettings[pluginId]
    }
  }

  // Cleaned settings with the optimization flag
  return {
    settings: {
      ...syncedSettings,
      denominationSettings: cleanedSettings,
      denominationSettingsOptimized: true
    },
    needsCleanup
  }
}
