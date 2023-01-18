import { EdgeAccount } from 'edge-core-js/types'
import { hasSecurityAlerts } from 'edge-login-ui-rn'
import * as React from 'react'
import { getCurrencies } from 'react-native-localize'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { WalletCreateItem } from '../components/themed/WalletList'
import s from '../locales/strings'
import {
  getLocalSettings,
  getSyncedSettings,
  LOCAL_ACCOUNT_DEFAULTS,
  LOCAL_ACCOUNT_TYPES,
  PASSWORD_RECOVERY_REMINDERS_SHOWN,
  setLocalSettings
} from '../modules/Core/Account/settings'
import { initialState as passwordReminderInitialState } from '../reducers/PasswordReminderReducer'
import { AccountInitPayload } from '../reducers/scenes/SettingsReducer'
import { config } from '../theme/appConfig'
import { Dispatch, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { EdgeTokenId, GuiTouchIdInfo } from '../types/types'
import { logActivity } from '../util/logger'
import { runWithTimeout } from '../util/utils'
import { loadAccountReferral, refreshAccountReferral } from './AccountReferralActions'
import { getUniqueWalletName } from './CreateWalletActions'
import { expiredFioNamesCheckDates } from './FioActions'
import { registerNotificationsV2 } from './NotificationActions'
import { trackAccountEvent } from './TrackingActions'
import { updateWalletsRequest } from './WalletActions'

function getFirstActiveWalletInfo(account: EdgeAccount): { walletId: string; currencyCode: string } {
  // Find the first wallet:
  const [walletId] = account.activeWalletIds
  const walletKey = account.allKeys.find(key => key.id === walletId)

  // Find the matching currency code:
  if (walletKey != null) {
    for (const pluginId of Object.keys(account.currencyConfig)) {
      const { currencyInfo } = account.currencyConfig[pluginId]
      if (currencyInfo.walletType === walletKey.type) {
        return { walletId, currencyCode: currencyInfo.currencyCode }
      }
    }
  }

  // The user has no wallets:
  return { walletId: '', currencyCode: '' }
}

export function initializeAccount(navigation: NavigationBase, account: EdgeAccount, touchIdInfo: GuiTouchIdInfo): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    // Log in as quickly as possible, but we do need the sort order:
    const syncedSettings = await getSyncedSettings(account)
    const { walletsSort } = syncedSettings
    dispatch({ type: 'LOGIN', data: { account, walletSort: walletsSort } })
    await dispatch(loadAccountReferral(account))
    const newAccount = account.newAccount

    if (newAccount) {
      let defaultFiat = syncedSettings.defaultFiat
      const [phoneCurrency] = getCurrencies()
      if (typeof phoneCurrency === 'string' && phoneCurrency.length >= 3) {
        defaultFiat = phoneCurrency
      }
      // Ensure the creation reason is available before creating wallets:
      const currencyCodes = getState().account.accountReferral.currencyCodes ?? config.defaultWallets
      const defaultSelection = currencyCodesToEdgeTokenIds(account, currencyCodes)
      const fiatCurrencyCode = 'iso:' + defaultFiat

      const newAccountFlow = async (items: WalletCreateItem[]) => {
        navigation.replace('edge', {})
        const selectedEdgetokenIds = items.map(item => ({ pluginId: item.pluginId, tokenId: item.tokenId }))
        await createCustomWallets(account, fiatCurrencyCode, selectedEdgetokenIds, dispatch)
        await updateWalletsRequest()(dispatch, getState)
      }

      navigation.push('createWalletSelectCrypto', { newAccountFlow, defaultSelection })
    } else {
      navigation.push('edge', {})
    }

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
      await Airship.show<boolean>(bridge => (
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

    // Check for security alerts:
    if (hasSecurityAlerts(account)) {
      navigation.push('securityAlerts', {})
    }

    const state = getState()
    const { context } = state.core

    // Sign up for push notifications:
    await dispatch(registerNotificationsV2())

    const walletInfos = account.allKeys
    const filteredWalletInfos = walletInfos.map(({ keys, id, ...info }) => info)
    console.log('Wallet Infos:', filteredWalletInfos)

    // Merge and prepare settings files:
    let accountInitObject: AccountInitPayload = {
      account,
      autoLogoutTimeInSeconds: 3600,
      countryCode: '',
      currencyCode: '',
      defaultFiat: '',
      defaultIsoFiat: '',
      denominationSettings: {},
      developerModeOn: false,
      spamFilterOn: true,
      isAccountBalanceVisible: false,
      mostRecentWallets: [],
      passwordRecoveryRemindersShown: PASSWORD_RECOVERY_REMINDERS_SHOWN,
      passwordReminder: passwordReminderInitialState,
      pinLoginEnabled: false,
      preferredSwapPluginId: undefined,
      preferredSwapPluginType: undefined,
      spendingLimits: { transaction: { isEnabled: false, amount: 0 } },
      touchIdInfo,
      walletId: '',
      walletsSort: 'manual'
    }
    try {
      if (!newAccount) {
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

      accountInitObject = { ...accountInitObject, ...syncedSettings }

      const loadedLocalSettings = await getLocalSettings(account)
      const localSettings = { ...loadedLocalSettings }
      const mergedLocalSettings = mergeSettings(localSettings, LOCAL_ACCOUNT_DEFAULTS, LOCAL_ACCOUNT_TYPES)
      if (mergedLocalSettings.isOverwriteNeeded && syncedSettings != null) {
        setLocalSettings(account, syncedSettings)
      }
      accountInitObject = { ...accountInitObject, ...mergedLocalSettings.finalSettings }

      accountInitObject.pinLoginEnabled = await context.pinLoginEnabled(account.username)

      const defaultDenominationSettings = state.ui.settings.denominationSettings
      const syncedDenominationSettings = syncedSettings?.denominationSettings ?? {}
      const mergedDenominationSettings = {}

      for (const plugin of Object.keys(defaultDenominationSettings)) {
        // @ts-expect-error
        mergedDenominationSettings[plugin] = {}
        // @ts-expect-error
        for (const code of Object.keys(defaultDenominationSettings[plugin])) {
          // @ts-expect-error
          mergedDenominationSettings[plugin][code] = {
            // @ts-expect-error
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

      dispatch(refreshAccountReferral())
      dispatch(expiredFioNamesCheckDates(navigation))
      await updateWalletsRequest()(dispatch, getState)
    } catch (error: any) {
      showError(error)
    }
  }
}

export const mergeSettings = (
  loadedSettings: any,
  defaults: any,
  types: any
): { finalSettings: AccountInitPayload; isOverwriteNeeded: boolean; isDefaultTypeIncorrect: boolean } => {
  const finalSettings: any = {}
  // begin process for repairing damaged settings data
  let isOverwriteNeeded = false
  let isDefaultTypeIncorrect = false
  for (const key of Object.keys(defaults)) {
    // if the of the setting default does not meet the enforced type
    const defaultSettingType = typeof defaults[key]
    if (defaultSettingType !== types[key]) {
      isDefaultTypeIncorrect = true
      console.error('MismatchedDefaultSettingType key: ', key, ' with defaultSettingType: ', defaultSettingType, ' and necessary type: ', types[key])
    }

    // if the of the loaded setting does not meet the enforced type
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

export function logoutRequest(username?: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    Actions.popTo('login')
    Airship.clear()
    const state = getState()
    const { account } = state.core
    dispatch({ type: 'LOGOUT', data: { username } })
    if (typeof account.logout === 'function') await account.logout()
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
  logActivity(`Create Wallet (login): ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${walletName}`)

  return wallet
}

// The `currencyCodes` are in the format "ETH:DAI",
const currencyCodesToEdgeTokenIds = (account: EdgeAccount, currencyCodes: string[]): EdgeTokenId[] => {
  const chainCodePluginIdMap = Object.keys(account.currencyConfig).reduce(
    (map: { [chainCode: string]: string }, pluginId) => {
      const chainCode = account.currencyConfig[pluginId].currencyInfo.currencyCode
      if (map[chainCode] == null) map[chainCode] = pluginId
      return map
    },
    { BNB: 'binancesmartchain' } // HACK: Prefer BNB Smart Chain over Beacon Chain if provided a BNB currency code)
  )

  const edgeTokenIds: EdgeTokenId[] = []

  for (const code of currencyCodes) {
    const [parent, child] = code.split(':')
    const pluginId = chainCodePluginIdMap[parent]
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig == null) continue

    // Add the mainnet EdgeTokenId if we haven't yet
    if (edgeTokenIds.find(edgeTokenId => edgeTokenId.tokenId == null && edgeTokenId.pluginId === pluginId) == null) {
      edgeTokenIds.push({ pluginId })
    }

    // Add tokens
    if (child != null) {
      const tokenId = Object.keys(currencyConfig.builtinTokens).find(tokenId => currencyConfig.builtinTokens[tokenId].currencyCode === child)
      if (tokenId != null) edgeTokenIds.push({ pluginId, tokenId })
    }
  }

  return edgeTokenIds
}

/**
 * Creates wallets inside a new account.
 */
async function createCustomWallets(account: EdgeAccount, fiatCurrencyCode: string, edgeTokenIds: EdgeTokenId[], dispatch: Dispatch) {
  if (edgeTokenIds.length === 0) return createDefaultWallets(account, fiatCurrencyCode, dispatch)

  const pluginIdTokenIdMap: { [pluginId: string]: string[] } = {}

  for (const edgeTokenId of edgeTokenIds) {
    const { pluginId, tokenId } = edgeTokenId
    if (pluginIdTokenIdMap[pluginId] == null) pluginIdTokenIdMap[pluginId] = []
    if (tokenId != null) pluginIdTokenIdMap[pluginId].push(tokenId)
  }

  for (const pluginId of Object.keys(pluginIdTokenIdMap)) {
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig == null) continue

    const walletName = getUniqueWalletName(account, pluginId)
    const wallet = await safeCreateWallet(account, currencyConfig.currencyInfo.walletType, walletName, fiatCurrencyCode, dispatch)
    if (pluginIdTokenIdMap[pluginId].length > 0) await wallet.changeEnabledTokenIds(pluginIdTokenIdMap[pluginId])
  }
}

/**
 * Creates the default wallets inside a new account.
 */
async function createDefaultWallets(account: EdgeAccount, fiatCurrencyCode: string, dispatch: Dispatch) {
  const defaultEdgeTokenIds = currencyCodesToEdgeTokenIds(account, config.defaultWallets)
  // TODO: Run these in parallel once the Core has safer locking:
  await createCustomWallets(account, fiatCurrencyCode, defaultEdgeTokenIds, dispatch)

  dispatch(trackAccountEvent('SignupWalletsCreated'))
}
