import { EdgeAccount, EdgeCreateCurrencyWallet } from 'edge-core-js/types'
import { getSupportedBiometryType, hasSecurityAlerts, isTouchEnabled, refreshTouchId, showNotificationPermissionReminder } from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard } from 'react-native'
import { getCurrencies } from 'react-native-localize'
import performance from 'react-native-performance'
import { sprintf } from 'sprintf-js'

import { readSyncedSettings } from '../actions/SettingsActions'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { FioCreateHandleModal } from '../components/modals/FioCreateHandleModal'
import { SurveyModal } from '../components/modals/SurveyModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { ENV } from '../env'
import { getExperimentConfig } from '../experimentConfig'
import { lstrings } from '../locales/strings'
import { AccountInitPayload, initialState } from '../reducers/scenes/SettingsReducer'
import { WalletCreateItem } from '../selectors/getCreateWalletList'
import { config } from '../theme/appConfig'
import { Dispatch, ThunkAction } from '../types/reduxTypes'
import { NavigationBase, NavigationProp } from '../types/routerTypes'
import { currencyCodesToEdgeAssets } from '../util/CurrencyInfoHelpers'
import { logActivity } from '../util/logger'
import { logEvent, trackError } from '../util/tracking'
import { runWithTimeout } from '../util/utils'
import { loadAccountReferral, refreshAccountReferral } from './AccountReferralActions'
import { getUniqueWalletName } from './CreateWalletActions'
import { getDeviceSettings, writeIsSurveyDiscoverShown } from './DeviceSettingsActions'
import { readLocalAccountSettings } from './LocalSettingsActions'
import { registerNotificationsV2, updateNotificationSettings } from './NotificationActions'
import { showScamWarningModal } from './ScamWarningActions'

const PER_WALLET_TIMEOUT = 5000
const MIN_CREATE_WALLET_TIMEOUT = 20000

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

export function initializeAccount(navigation: NavigationBase, account: EdgeAccount): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const rootNavigation = getRootNavigation(navigation)

    // Log in as quickly as possible, but we do need the sort order:
    const syncedSettings = await readSyncedSettings(account)
    const { walletsSort } = syncedSettings
    dispatch({ type: 'LOGIN', data: { account, walletSort: walletsSort } })
    const { newAccount } = account
    const referralPromise = dispatch(loadAccountReferral(account))

    // Track whether we showed a non-survey modal or some other interrupting UX.
    // We don't want to pester the user with too many interrupting flows.
    let hideSurvey = false

    if (newAccount) {
      await referralPromise
      let { defaultFiat } = syncedSettings

      const [phoneCurrency] = getCurrencies()
      if (typeof phoneCurrency === 'string' && phoneCurrency.length >= 3) {
        defaultFiat = phoneCurrency
      }
      // Ensure the creation reason is available before creating wallets:
      const accountReferralCurrencyCodes = getState().account.accountReferral.currencyCodes
      const defaultSelection = accountReferralCurrencyCodes != null ? currencyCodesToEdgeAssets(account, accountReferralCurrencyCodes) : config.defaultWallets
      const fiatCurrencyCode = 'iso:' + defaultFiat

      // Ensure we have initialized the account settings first so we can begin
      // keeping track of token warnings shown from the initial selected assets
      // during account creation
      await readLocalAccountSettings(account)

      const newAccountFlow = async (navigation: NavigationProp<'createWalletSelectCrypto'>, items: WalletCreateItem[]) => {
        navigation.replace('edgeTabs', { screen: 'homeTab', params: { screen: 'home' } })
        const createWalletsPromise = createCustomWallets(account, fiatCurrencyCode, items, dispatch).catch(error => showError(error))

        // New user FIO handle registration flow (if env is properly configured)
        const { freeRegApiToken = '', freeRegRefCode = '' } = typeof ENV.FIO_INIT === 'object' ? ENV.FIO_INIT : {}
        if (freeRegApiToken !== '' && freeRegRefCode !== '') {
          hideSurvey = true
          const isCreateHandle = await Airship.show<boolean>(bridge => <FioCreateHandleModal bridge={bridge} createWalletsPromise={createWalletsPromise} />)
          if (isCreateHandle) {
            navigation.navigate('fioCreateHandle', { freeRegApiToken, freeRegRefCode })
          }
        }

        await createWalletsPromise
        dispatch(logEvent('Signup_Complete'))
      }

      rootNavigation.replace('edgeApp', {
        screen: 'edgeAppStack',
        params: {
          screen: 'createWalletSelectCryptoNewAccount',
          params: { newAccountFlow, defaultSelection }
        }
      })

      performance.mark('loginEnd', { detail: { isNewAccount: newAccount } })
    } else {
      rootNavigation.replace('edgeApp', {})
      referralPromise.catch(() => console.log(`Failed to load account referral info`))

      performance.mark('loginEnd', { detail: { isNewAccount: newAccount } })
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
      hideSurvey = true
      await Airship.show<boolean>(bridge => (
        <ConfirmContinueModal
          bridge={bridge}
          title={lstrings.update_notice_deprecate_electrum_servers_title}
          body={sprintf(lstrings.update_notice_deprecate_electrum_servers_message, config.appName)}
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

    // Show the scam warning modal if needed
    if (await showScamWarningModal('firstLogin')) hideSurvey = true

    // Check for security alerts:
    if (hasSecurityAlerts(account)) {
      navigation.push('securityAlerts', {})
      hideSurvey = true
    }

    const state = getState()
    const { context } = state.core

    // Sign up for push notifications:
    dispatch(registerNotificationsV2()).catch(e => console.error(e))

    const walletInfos = account.allKeys
    const filteredWalletInfos = walletInfos.map(({ keys, id, ...info }) => info)
    console.log('Wallet Infos:', filteredWalletInfos)

    // Merge and prepare settings files:
    let accountInitObject: AccountInitPayload = {
      ...initialState,
      account,
      currencyCode: '',
      pinLoginEnabled: false,
      isTouchEnabled: await isTouchEnabled(account),
      isTouchSupported: (await getSupportedBiometryType()) !== false,
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

      accountInitObject = { ...accountInitObject, ...syncedSettings }

      const loadedLocalSettings = await readLocalAccountSettings(account)
      accountInitObject = { ...accountInitObject, ...loadedLocalSettings }

      for (const userInfo of context.localUsers) {
        if (userInfo.loginId === account.rootLoginId && userInfo.pinLoginEnabled) {
          accountInitObject.pinLoginEnabled = true
        }
      }

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
            dispatch(updateNotificationSettings(info.notificationOptIns)).catch(error => {
              trackError(error, 'LoginScene:onLogin:setDeviceSettings')
              console.error(error)
            })
          }
        })
      ) {
        hideSurvey = true
      }
    } catch (error: any) {
      showError(error)
    }

    if (!newAccount && !hideSurvey && !getDeviceSettings().isSurveyDiscoverShown) {
      // Show the survey modal once per app install, only if this isn't the
      // first login of a newly created account and the user didn't get any
      // other modals or scene changes immediately after login.
      await Airship.show(bridge => <SurveyModal bridge={bridge} />)
      await writeIsSurveyDiscoverShown(true)
    }
  }
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
async function createCustomWallets(account: EdgeAccount, fiatCurrencyCode: string, items: WalletCreateItem[], dispatch: Dispatch): Promise<void> {
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
  const timeoutMs = Math.max(options.length * PER_WALLET_TIMEOUT, MIN_CREATE_WALLET_TIMEOUT)
  const results = await runWithTimeout(account.createCurrencyWallets(options), timeoutMs, new Error(lstrings.error_creating_wallets)).catch(error => {
    dispatch(logEvent('Signup_Wallets_Created_Failed', { error }))
    throw error
  })

  for (let i = 0; i < results.length; ++i) {
    const result = results[i]
    if (!result.ok) continue
    const { walletType, name } = options[i]
    logActivity(`Create Wallet (login): ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${name}`)
  }

  dispatch(logEvent('Signup_Wallets_Created_Success'))
}
