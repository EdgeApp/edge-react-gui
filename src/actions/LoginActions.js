// @flow

import { type EdgeAccount, type EdgeCurrencyInfo } from 'edge-core-js/types'
import { hasSecurityAlerts } from 'edge-login-ui-rn'
import * as React from 'react'
import { getCurrencies } from 'react-native-localize'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { USD_FIAT } from '../constants/WalletAndCurrencyConstants.js'
import s from '../locales/strings.js'
import {
  getLocalSettings,
  getSyncedSettings,
  LOCAL_ACCOUNT_DEFAULTS,
  LOCAL_ACCOUNT_TYPES,
  PASSWORD_RECOVERY_REMINDERS_SHOWN,
  setLocalSettings
} from '../modules/Core/Account/settings.js'
import { initialState as passwordReminderInitialState } from '../reducers/PasswordReminderReducer.js'
import { type AccountInitPayload } from '../reducers/scenes/SettingsReducer.js'
import { config } from '../theme/appConfig.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { type GuiTouchIdInfo } from '../types/types.js'
import { runWithTimeout } from '../util/utils.js'
import { loadAccountReferral, refreshAccountReferral } from './AccountReferralActions.js'
import { attachToUser } from './DeviceIdActions.js'
import { expiredFioNamesCheckDates } from './FioActions.js'
import { trackAccountEvent } from './TrackingActions.js'
import { updateWalletsRequest } from './WalletActions.js'

function getFirstActiveWalletInfo(account: EdgeAccount): { walletId: string, currencyCode: string } {
  // Find the first wallet:
  const walletId = account.activeWalletIds[0]
  const walletKey = account.allKeys.find(key => key.id === walletId)
  if (!walletKey) {
    throw new Error('Cannot find a walletInfo for the active wallet')
  }

  // Find the matching currency code:
  const currencyCodes = {}
  for (const pluginId of Object.keys(account.currencyConfig)) {
    const { currencyInfo } = account.currencyConfig[pluginId]
    currencyCodes[currencyInfo.walletType] = currencyInfo.currencyCode
  }
  const currencyCode = currencyCodes[walletKey.type]

  return { walletId, currencyCode }
}

export const initializeAccount = (account: EdgeAccount, touchIdInfo: GuiTouchIdInfo) => async (dispatch: Dispatch, getState: GetState) => {
  // Show a notice for deprecated electrum server settings
  const pluginIdsNeedingUserAction: string[] = []
  for (const pluginId in account.currencyConfig) {
    const currencyConfig = account.currencyConfig[pluginId]
    const { userSettings } = currencyConfig
    if (userSettings == null) continue
    if (userSettings.disableFetchingServers === true && userSettings.enableCustomServers == null) {
      userSettings.enableCustomServers = true
      userSettings.blockbookServers = []
      userSettings.electrumServers = []
      pluginIdsNeedingUserAction.push(pluginId)
    }
  }
  if (pluginIdsNeedingUserAction.length > 0) {
    await Airship.show(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        title={s.strings.update_notice_deprecate_electrum_servers_title}
        body={sprintf(s.strings.update_notice_deprecate_electrum_servers_message, config.appName)}
      />
    ))
      .finally(async () => {
        for (const pluginId of pluginIdsNeedingUserAction) {
          const currencyConfig = account.currencyConfig[pluginId]
          const { userSettings = {} } = currencyConfig
          await currencyConfig.changeUserSettings(userSettings)
        }
      })
      .catch(err => showError(err))
  }

  dispatch({ type: 'LOGIN', data: account })

  Actions.push('edge')
  if (hasSecurityAlerts(account)) {
    Actions.push('securityAlerts')
  }

  const state = getState()
  const { context } = state.core

  dispatch(attachToUser())

  const walletInfos = account.allKeys
  const filteredWalletInfos = walletInfos.map(({ keys, id, ...info }) => info)
  console.log('Wallet Infos:', filteredWalletInfos)

  let accountInitObject: AccountInitPayload = {
    account,
    autoLogoutTimeInSeconds: 3600,
    countryCode: '',
    currencyCode: '',
    defaultFiat: '',
    defaultIsoFiat: '',
    denominationSettings: {},
    developerModeOn: false,
    isAccountBalanceVisible: false,
    mostRecentWallets: [],
    passwordRecoveryRemindersShown: PASSWORD_RECOVERY_REMINDERS_SHOWN,
    passwordReminder: passwordReminderInitialState,
    pinLoginEnabled: false,
    preferredSwapPluginId: undefined,
    spendingLimits: { transaction: { isEnabled: false, amount: 0 } },
    touchIdInfo,
    walletId: '',
    walletsSort: 'manual'
  }
  try {
    let newAccount = false
    let defaultFiat = USD_FIAT
    if (account.activeWalletIds.length < 1) {
      const [phoneCurrency] = getCurrencies()
      if (typeof phoneCurrency === 'string' && phoneCurrency.length >= 3) {
        defaultFiat = phoneCurrency
      }

      newAccount = true
    } else {
      // We have a wallet
      const { walletId, currencyCode } = getFirstActiveWalletInfo(account)
      accountInitObject.walletId = walletId
      accountInitObject.currencyCode = currencyCode
    }
    const activeWalletIds = account.activeWalletIds
    dispatch({
      type: 'INSERT_WALLET_IDS_FOR_PROGRESS',
      data: { activeWalletIds }
    })

    const syncedSettings = await getSyncedSettings(account)
    accountInitObject = { ...accountInitObject, ...syncedSettings }

    const loadedLocalSettings = await getLocalSettings(account)
    const localSettings = { ...loadedLocalSettings }
    const mergedLocalSettings = mergeSettings(localSettings, LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_TYPES)
    if (mergedLocalSettings.isOverwriteNeeded && syncedSettings != null) {
      setLocalSettings(account, syncedSettings)
    }
    accountInitObject = { ...accountInitObject, ...mergedLocalSettings.finalSettings }

    accountInitObject.pinLoginEnabled = await context.pinLoginEnabled(account.username)

    if (newAccount) {
      accountInitObject.defaultFiat = defaultFiat
      accountInitObject.defaultIsoFiat = 'iso:' + defaultFiat
    }

    const defaultDenominationSettings = state.ui.settings.denominationSettings
    const syncedDenominationSettings = syncedSettings?.denominationSettings ?? {}
    const mergedDenominationSettings = {}

    for (const plugin of Object.keys(defaultDenominationSettings)) {
      mergedDenominationSettings[plugin] = {}
      for (const code of Object.keys(defaultDenominationSettings[plugin])) {
        mergedDenominationSettings[plugin][code] = {
          ...defaultDenominationSettings[plugin][code],
          ...(syncedDenominationSettings?.[plugin]?.[code] ?? {})
        }
      }
    }
    accountInitObject.denominationSettings = { ...mergedDenominationSettings }

    dispatch({
      type: 'ACCOUNT_INIT_COMPLETE',
      data: { ...accountInitObject }
    })

    if (newAccount) {
      // Ensure the creation reason is available before creating wallets:
      await dispatch(loadAccountReferral(account))
      const { currencyCodes } = getState().account.accountReferral
      const fiatCurrencyCode = 'iso:' + defaultFiat
      if (currencyCodes && currencyCodes.length > 0) {
        await createCustomWallets(account, fiatCurrencyCode, currencyCodes, dispatch)
      } else {
        await createDefaultWallets(account, fiatCurrencyCode, dispatch)
      }
      dispatch(refreshAccountReferral())
    } else {
      // Load the creation reason more lazily:
      dispatch(loadAccountReferral(account)).then(() => dispatch(refreshAccountReferral()))
    }

    dispatch(expiredFioNamesCheckDates())
    await updateWalletsRequest()(dispatch, getState)
  } catch (error) {
    showError(error)
  }
}

export const mergeSettings = (
  loadedSettings: Object,
  defaults: Object,
  types: Object,
  account?: Object
): { finalSettings: AccountInitPayload, isOverwriteNeeded: boolean, isDefaultTypeIncorrect: boolean } => {
  const finalSettings: any = {}
  // begin process for repairing damaged settings data
  let isOverwriteNeeded = false
  let isDefaultTypeIncorrect = false
  for (const key of Object.keys(defaults)) {
    // if the type of the setting default does not meet the enforced type
    const defaultSettingType = typeof defaults[key]
    if (defaultSettingType !== types[key]) {
      isDefaultTypeIncorrect = true
      console.error('MismatchedDefaultSettingType key: ', key, ' with defaultSettingType: ', defaultSettingType, ' and necessary type: ', types[key])
    }

    // if the type of the loaded setting does not meet the enforced type
    // eslint-disable-next-line valid-typeof
    const loadedSettingType = typeof loadedSettings[key]
    if (loadedSettingType !== types[key]) {
      isOverwriteNeeded = true
      console.warn(
        'Settings overwrite was needed for: ',
        key,
        ' with loaded value: ',
        loadedSettings[key],
        ', but needed type: ',
        types[key],
        ' so replace with: ',
        defaults[key]
      )
      // change that erroneous value to something that works (default)
      finalSettings[key] = defaults[key]
    } else {
      finalSettings[key] = loadedSettings[key]
    }
  }

  return {
    finalSettings,
    isOverwriteNeeded,
    isDefaultTypeIncorrect
  }
}

export const logoutRequest =
  (username?: string) =>
  async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    Actions.popTo('login')
    Airship.clear()
    const state = getState()
    const { account } = state.core
    dispatch({ type: 'LOGOUT', data: { username } })
    if (typeof account.logout === 'function') await account.logout()
  }

/**
 * Finds the currency info for a currency code.
 */
function findCurrencyInfo(account: EdgeAccount, currencyCode: string): EdgeCurrencyInfo | void {
  for (const pluginId of Object.keys(account.currencyConfig)) {
    const { currencyInfo } = account.currencyConfig[pluginId]
    if (currencyInfo.currencyCode.toUpperCase() === currencyCode) {
      return currencyInfo
    }
  }
}

/**
 * Creates a wallet, with timeout, and maybe also activates it.
 */
async function safeCreateWallet(account: EdgeAccount, walletType: string, walletName: string, fiatCurrencyCode: string, dispatch: Dispatch) {
  const wallet = await runWithTimeout(
    account.createCurrencyWallet(walletType, {
      name: walletName,
      fiatCurrencyCode
    }),
    20000,
    new Error(s.strings.error_creating_wallets)
  )
  if (account.activeWalletIds.length <= 1) {
    dispatch({
      type: 'UI/WALLETS/SELECT_WALLET',
      data: { currencyCode: wallet.currencyInfo.currencyCode, walletId: wallet.id }
    })
  }
  global.logActivity(`Create Wallet (login): ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${walletName}`)

  return wallet
}

/**
 * Creates the custom default wallets inside a new account.
 * The `currencyCodes` are in the format "ETH:DAI",
 * so we may need to enable tokens on some of the created wallets.
 */
async function createCustomWallets(account: EdgeAccount, fiatCurrencyCode: string, currencyCodes: string[], dispatch: Dispatch) {
  const currencyInfos = []
  for (const code of currencyCodes) {
    const [parent] = code.split(':')
    if (currencyInfos.find(info => info.currencyCode === parent)) continue
    const currencyInfo = findCurrencyInfo(account, parent)
    if (currencyInfo != null) currencyInfos.push(currencyInfo)
  }

  if (currencyInfos.length === 0) {
    return createDefaultWallets(account, fiatCurrencyCode, dispatch)
  }

  for (const currencyInfo of currencyInfos) {
    const walletName = sprintf(s.strings.my_crypto_wallet_name, currencyInfo.displayName)
    const wallet = await safeCreateWallet(account, currencyInfo.walletType, walletName, fiatCurrencyCode, dispatch)

    const tokenCodes = []
    for (const code of currencyCodes) {
      const [parent, child] = code.split(':')
      if (parent === currencyInfo.currencyCode && child != null) tokenCodes.push(child)
      if (tokenCodes.length > 0) {
        await wallet.changeEnabledTokens(tokenCodes)
      }
    }
  }
}

/**
 * Creates the default wallets inside a new account.
 */
async function createDefaultWallets(account: EdgeAccount, fiatCurrencyCode: string, dispatch: Dispatch) {
  // TODO: Run these in parallel once the Core has safer locking:
  await createCustomWallets(account, fiatCurrencyCode, config.defaultWallets, dispatch)

  dispatch(trackAccountEvent('SignupWalletsCreated'))
}
