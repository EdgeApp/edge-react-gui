import type { EdgeAccount, EdgeCreateCurrencyWallet } from 'edge-core-js/types'
import {
  hasSecurityAlerts,
  refreshTouchId,
  showNotificationPermissionReminder
} from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard } from 'react-native'
import { getCurrencies } from 'react-native-localize'
import performance from 'react-native-performance'
import { sprintf } from 'sprintf-js'

import {
  migrateDenominationSettings,
  readSyncedSettings,
  type SyncedAccountSettings
} from '../actions/SettingsActions'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { FioCreateHandleModal } from '../components/modals/FioCreateHandleModal'
import { SurveyModal } from '../components/modals/SurveyModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { ENV } from '../env'
import { getExperimentConfig } from '../experimentConfig'
import { lstrings } from '../locales/strings'
import type { WalletCreateItem } from '../selectors/getCreateWalletList'
import { config } from '../theme/appConfig'
import type { Dispatch, GetState, ThunkAction } from '../types/reduxTypes'
import type { EdgeAppSceneProps, NavigationBase } from '../types/routerTypes'
import { currencyCodesToEdgeAssets } from '../util/CurrencyInfoHelpers'
import { logActivity } from '../util/logger'
import { logEvent, trackError } from '../util/tracking'
import { runWithTimeout } from '../util/utils'
import {
  loadAccountReferral,
  refreshAccountReferral
} from './AccountReferralActions'
import { getUniqueWalletName } from './CreateWalletActions'
import {
  getDeviceSettings,
  writeIsSurveyDiscoverShown
} from './DeviceSettingsActions'
import { readLocalAccountSettings } from './LocalSettingsActions'
import {
  registerNotificationsV2,
  updateNotificationSettings
} from './NotificationActions'

const PER_WALLET_TIMEOUT = 5000
const MIN_CREATE_WALLET_TIMEOUT = 20000

export function initializeAccount(
  navigation: NavigationBase,
  account: EdgeAccount
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { newAccount } = account
    const rootNavigation = getRootNavigation(navigation)

    // Load all settings upfront so we can navigate immediately after LOGIN
    const [syncedSettings, localSettings] = await Promise.all([
      readSyncedSettings(account),
      readLocalAccountSettings(account)
    ])

    // Dispatch LOGIN with all settings - this enables immediate navigation
    dispatch({
      type: 'LOGIN',
      data: {
        account,
        syncedSettings,
        localSettings
      }
    })

    const referralPromise = dispatch(loadAccountReferral(account))

    // Navigate immediately - all settings are now in Redux
    if (newAccount) {
      await navigateToNewAccountFlow(
        rootNavigation,
        account,
        syncedSettings,
        referralPromise,
        dispatch,
        getState
      )
    } else {
      navigateToExistingAccountHome(rootNavigation, referralPromise)
    }

    performance.mark('loginEnd', { detail: { isNewAccount: newAccount } })

    // Track whether we showed a non-survey modal or some other interrupting UX.
    // We don't want to pester the user with too many interrupting flows.
    let hideSurvey = false

    // Show a notice for deprecated electrum server settings
    const pluginIdsNeedingUserAction: string[] = []
    for (const pluginId in account.currencyConfig) {
      const currencyConfig = account.currencyConfig[pluginId]
      const { userSettings } = currencyConfig
      if (userSettings == null) continue
      if (
        userSettings.disableFetchingServers === true &&
        userSettings.enableCustomServers == null
      ) {
        userSettings.enableCustomServers = true
        userSettings.blockbookServers = []
        userSettings.electrumServers = []
        pluginIdsNeedingUserAction.push(pluginId)
      }
    }
    if (pluginIdsNeedingUserAction.length > 0) {
      hideSurvey = true
      await Airship.show<boolean>(bridge => (
        <ConfirmContinueModal
          bridge={bridge}
          title={lstrings.update_notice_deprecate_electrum_servers_title}
          body={sprintf(
            lstrings.update_notice_deprecate_electrum_servers_message,
            config.appName
          )}
        />
      ))
        .finally(() => {
          for (const pluginId of pluginIdsNeedingUserAction) {
            const currencyConfig = account.currencyConfig[pluginId]
            const { userSettings = {} } = currencyConfig
            currencyConfig
              .changeUserSettings(userSettings)
              .catch((error: unknown) => {
                showError(error)
              })
          }
        })
        .catch((error: unknown) => {
          showError(error)
        })
    }

    // Check for security alerts:
    if (hasSecurityAlerts(account)) {
      navigation.push('securityAlerts')
      hideSurvey = true
    }

    // Sign up for push notifications:
    dispatch(registerNotificationsV2()).catch((error: unknown) => {
      console.error(error)
    })

    const walletInfos = account.allKeys
    const filteredWalletInfos = walletInfos.map(({ keys, id, ...info }) => info)
    console.log('Wallet Infos:', filteredWalletInfos)

    // Run one-time migration to clean up denomination settings in background
    migrateDenominationSettings(account, syncedSettings).catch(
      (error: unknown) => {
        console.log('Failed to migrate denomination settings:', error)
      }
    )

    await dispatch(refreshAccountReferral())

    refreshTouchId(account).catch(() => {
      // We have always failed silently here
    })

    if (
      await showNotificationPermissionReminder({
        appName: config.appName,
        onLogEvent(event, values) {
          dispatch(logEvent(event, values))
        },
        onNotificationPermit(info) {
          dispatch(updateNotificationSettings(info.notificationOptIns)).catch(
            (error: unknown) => {
              trackError(error, 'LoginScene:onLogin:setDeviceSettings')
              console.error(error)
            }
          )
        }
      })
    ) {
      hideSurvey = true
    }

    // Post login stuff: Survey modal (existing accounts only)
    if (
      !newAccount &&
      !hideSurvey &&
      !getDeviceSettings().isSurveyDiscoverShown &&
      config.disableSurveyModal !== true
    ) {
      // Show the survey modal once per app install, only if this isn't the
      // first login of a newly created account and the user didn't get any
      // other modals or scene changes immediately after login.
      await Airship.show(bridge => <SurveyModal bridge={bridge} />)
      await writeIsSurveyDiscoverShown(true)
    }
  }
}

/**
 * Navigate to wallet creation flow for new accounts.
 */
async function navigateToNewAccountFlow(
  rootNavigation: NavigationBase,
  account: EdgeAccount,
  syncedSettings: SyncedAccountSettings,
  referralPromise: Promise<void>,
  dispatch: Dispatch,
  getState: GetState
): Promise<void> {
  await referralPromise
  let { defaultFiat } = syncedSettings

  const [phoneCurrency] = getCurrencies()
  if (typeof phoneCurrency === 'string' && phoneCurrency.length >= 3) {
    defaultFiat = phoneCurrency
  }

  // Ensure the creation reason is available before creating wallets:
  const accountReferralCurrencyCodes =
    getState().account.accountReferral.currencyCodes
  const defaultSelection =
    accountReferralCurrencyCodes != null
      ? currencyCodesToEdgeAssets(account, accountReferralCurrencyCodes)
      : config.defaultWallets
  const fiatCurrencyCode = 'iso:' + defaultFiat

  // Ensure we have initialized the account settings first so we can begin
  // keeping track of token warnings shown from the initial selected assets
  // during account creation
  await readLocalAccountSettings(account)

  const newAccountFlow = async (
    navigation: EdgeAppSceneProps<
      'createWalletSelectCrypto' | 'createWalletSelectCryptoNewAccount'
    >['navigation'],
    items: WalletCreateItem[]
  ): Promise<void> => {
    navigation.replace('edgeTabs', { screen: 'home' })
    const createWalletsPromise = createCustomWallets(
      account,
      fiatCurrencyCode,
      items,
      dispatch
    ).catch((error: unknown) => {
      showError(error)
    })

    // New user FIO handle registration flow (if env is properly configured)
    const { freeRegApiToken = '', freeRegRefCode = '' } =
      typeof ENV.FIO_INIT === 'object' ? ENV.FIO_INIT : {}
    if (freeRegApiToken !== '' && freeRegRefCode !== '') {
      const isCreateHandle = await Airship.show<boolean>(bridge => (
        <FioCreateHandleModal
          bridge={bridge}
          createWalletsPromise={createWalletsPromise}
        />
      ))
      if (isCreateHandle) {
        navigation.navigate('fioCreateHandle', {
          freeRegApiToken,
          freeRegRefCode
        })
      }
    }

    await createWalletsPromise
    dispatch(
      logEvent('Signup_Complete', {
        numAccounts: getState().core.context.localUsers.length
      })
    )
  }

  rootNavigation.replace('edgeApp', {
    screen: 'edgeAppStack',
    params: {
      screen: 'createWalletSelectCryptoNewAccount',
      params: {
        newAccountFlow,
        defaultSelection,
        disableLegacy: true
      }
    }
  })
}

/**
 * Navigate to home screen for existing accounts.
 */
function navigateToExistingAccountHome(
  rootNavigation: NavigationBase,
  referralPromise: Promise<void>
): void {
  const { defaultScreen } = getDeviceSettings()
  rootNavigation.replace('edgeApp', {
    screen: 'edgeAppStack',
    params: {
      screen: 'edgeTabs',
      params:
        defaultScreen === 'home'
          ? { screen: 'home' }
          : { screen: 'walletsTab', params: { screen: 'walletList' } }
    }
  })
  referralPromise.catch(() => {
    console.log(`Failed to load account referral info`)
  })
}

export function getRootNavigation(navigation: NavigationBase): NavigationBase {
  while (true) {
    const parent: NavigationBase = navigation.getParent()
    if (parent == null) return navigation
    navigation = parent
  }
}

export function logoutRequest(
  navigation: NavigationBase,
  opts: {
    nextLoginId?: string
    passwordRecoveryKey?: string
  } = {}
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const { nextLoginId, passwordRecoveryKey } = opts
    const state = getState()
    const { account } = state.core
    Keyboard.dismiss()
    Airship.clear()
    dispatch({ type: 'LOGOUT' })
    if (typeof account.logout === 'function') await account.logout()
    const rootNavigation = getRootNavigation(navigation)
    rootNavigation.replace('login', {
      experimentConfig: await getExperimentConfig(),
      nextLoginId,
      passwordRecoveryKey
    })
  }
}

/**
 * Creates wallets inside a new account.
 */
async function createCustomWallets(
  account: EdgeAccount,
  fiatCurrencyCode: string,
  items: WalletCreateItem[],
  dispatch: Dispatch
): Promise<void> {
  // Maps pluginId's to core options:
  const optionsMap = new Map<string, EdgeCreateCurrencyWallet>()
  for (const item of items) {
    const { keyOptions, pluginId, tokenId } = item

    // Ensure we create the wallet:
    let createWallet = optionsMap.get(pluginId)
    if (createWallet == null) {
      const { walletType } = account.currencyConfig[pluginId].currencyInfo
      createWallet = {
        fiatCurrencyCode,
        keyOptions,
        name: getUniqueWalletName(account, pluginId),
        walletType
      }
      optionsMap.set(pluginId, createWallet)
    }

    // If this is a token, add it:
    if (tokenId != null) {
      createWallet.enabledTokenIds ??= []
      createWallet.enabledTokenIds.push(tokenId)
    }
  }

  // Actually create the wallets:
  const options = [...optionsMap.values()]
  const timeoutMs = Math.max(
    options.length * PER_WALLET_TIMEOUT,
    MIN_CREATE_WALLET_TIMEOUT
  )
  const results = await runWithTimeout(
    account.createCurrencyWallets(options),
    timeoutMs,
    new Error(lstrings.error_creating_wallets)
  ).catch((error: unknown) => {
    dispatch(logEvent('Signup_Wallets_Created_Failed', { error }))
    throw error
  })

  for (let i = 0; i < results.length; ++i) {
    const result = results[i]
    if (!result.ok) continue
    const { walletType, name } = options[i]
    logActivity(
      `Create Wallet (login): ${account.username} -- ${walletType} -- ${
        fiatCurrencyCode ?? ''
      } -- ${name}`
    )
  }

  dispatch(logEvent('Signup_Wallets_Created_Success'))
}
