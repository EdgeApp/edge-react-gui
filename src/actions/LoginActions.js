// @flow

import { type EdgeAccount, type EdgeCurrencyInfo } from 'edge-core-js/types'
import { hasSecurityAlerts } from 'edge-login-ui-rn'
import { getCurrencies } from 'react-native-localize'
import { sprintf } from 'sprintf-js'

import { Airship, showError } from '../components/services/AirshipInstance.js'
import { EDGE, LOGIN, SECURITY_ALERTS_SCENE } from '../constants/SceneKeys.js'
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
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { type CustomTokenInfo, type GuiTouchIdInfo } from '../types/types.js'
import { runWithTimeout } from '../util/utils.js'
import { loadAccountReferral, refreshAccountReferral } from './AccountReferralActions.js'
import { attachToUser } from './DeviceIdActions.js'
import { expiredFioNamesCheckDates } from './FioActions.js'
import { trackAccountEvent } from './TrackingActions.js'
import { checkEnabledTokensArray, getEnabledTokens, setWalletEnabledTokens, updateWalletsEnabledTokens, updateWalletsRequest } from './WalletActions.js'

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
  dispatch({ type: 'LOGIN', data: account })

  Actions.push(EDGE)
  if (hasSecurityAlerts(account)) {
    Actions.push(SECURITY_ALERTS_SCENE)
  }

  const state = getState()
  const { context } = state.core

  dispatch(attachToUser())

  const walletInfos = account.allKeys
  const filteredWalletInfos = walletInfos.map(({ keys, id, ...info }) => info)
  console.log('Wallet Infos:', filteredWalletInfos)

  let accountInitObject: AccountInitPayload = {
    account,
    activeWalletIds: [],
    archivedWalletIds: [],
    autoLogoutTimeInSeconds: 3600,
    countryCode: '',
    currencyCode: '',
    customTokens: [],
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
    walletsSort: 'default'
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
    const archivedWalletIds = account.archivedWalletIds

    accountInitObject.activeWalletIds = activeWalletIds
    accountInitObject.archivedWalletIds = archivedWalletIds

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

    accountInitObject.customTokens.forEach(token => {
      if (token.walletType != null) {
        const pluginId = token.walletType.replace('wallet:', '')
        const denom = token.denominations.find(denom => denom.name === token.currencyCode)
        if (denom != null) {
          if (accountInitObject.denominationSettings[pluginId] == null) {
            accountInitObject.denominationSettings[pluginId] = {}
          }
          accountInitObject.denominationSettings[pluginId][token.currencyCode] = denom
        }
      }
    })

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
    for (const wId of activeWalletIds) {
      await getEnabledTokens(wId)(dispatch, getState)
    }
    updateWalletsEnabledTokens(getState)
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

  // Filter conflicting tokens out of synced settings:
  if (finalSettings.customTokens && account != null) {
    const { currencyConfig } = account
    finalSettings.customTokens = finalSettings.customTokens.filter((customToken: CustomTokenInfo) => {
      for (const pluginId of Object.keys(currencyConfig)) {
        const { currencyInfo } = currencyConfig[pluginId]
        if (customToken.currencyCode === currencyInfo.currencyCode) return false
      }
      return true
    })
  }

  return {
    finalSettings,
    isOverwriteNeeded,
    isDefaultTypeIncorrect
  }
}

export const logoutRequest = (username?: string) => (dispatch: Dispatch, getState: GetState) => {
  Actions.popTo(LOGIN)
  Airship.clear()
  const state = getState()
  const { account } = state.core
  dispatch({ type: 'LOGOUT', data: { username } })
  if (typeof account.logout === 'function') account.logout()
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
  return wallet
}

/**
 * Creates the custom default wallets inside a new account.
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
        dispatch(setWalletEnabledTokens(wallet.id, tokenCodes, []))
        dispatch(checkEnabledTokensArray(wallet.id, tokenCodes))
      }
    }
  }
}

/**
 * Creates the default wallets inside a new account.
 */
async function createDefaultWallets(account: EdgeAccount, fiatCurrencyCode: string, dispatch: Dispatch) {
  // TODO: Run these in parallel once the Core has safer locking:
  if (!account.allKeys.find(({ type }) => type === 'wallet:bitcoin')) {
    await safeCreateWallet(account, 'wallet:bitcoin', s.strings.string_first_bitcoin_wallet_name, fiatCurrencyCode, dispatch)
  }

  if (!account.allKeys.find(({ type }) => type === 'wallet:bitcoincash')) {
    await safeCreateWallet(account, 'wallet:bitcoincash', s.strings.string_first_bitcoincash_wallet_name, fiatCurrencyCode, dispatch)
  }

  if (!account.allKeys.find(({ type }) => type === 'wallet:ethereum')) {
    await safeCreateWallet(account, 'wallet:ethereum', s.strings.string_first_ethereum_wallet_name, fiatCurrencyCode, dispatch)
  }

  dispatch(trackAccountEvent('SignupWalletsCreated'))
}
