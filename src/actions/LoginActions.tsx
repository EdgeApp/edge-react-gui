import { EdgeAccount, EdgeCreateCurrencyWallet } from 'edge-core-js/types'
import { hasSecurityAlerts } from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard } from 'react-native'
import { getCurrencies } from 'react-native-localize'
import { sprintf } from 'sprintf-js'

import { readSyncedSettings } from '../actions/SettingsActions'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { FioCreateHandleModal } from '../components/modals/FioCreateHandleModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { ENV } from '../env'
import { getExperimentConfig } from '../experimentConfig'
import { lstrings } from '../locales/strings'
import { AccountInitPayload, initialState } from '../reducers/scenes/SettingsReducer'
import { WalletCreateItem } from '../selectors/getCreateWalletList'
import { config } from '../theme/appConfig'
import { Dispatch, ThunkAction } from '../types/reduxTypes'
import { NavigationBase, NavigationProp } from '../types/routerTypes'
import { GuiTouchIdInfo } from '../types/types'
import { currencyCodesToEdgeAssets } from '../util/CurrencyInfoHelpers'
import { logActivity } from '../util/logger'
import { logEvent } from '../util/tracking'
import { runWithTimeout } from '../util/utils'
import { loadAccountReferral, refreshAccountReferral } from './AccountReferralActions'
import { getUniqueWalletName } from './CreateWalletActions'
import { expiredFioNamesCheckDates } from './FioActions'
import { readLocalSettings } from './LocalSettingsActions'
import { registerNotificationsV2 } from './NotificationActions'

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
    const syncedSettings = await readSyncedSettings(account)
    const { walletsSort } = syncedSettings
    dispatch({ type: 'LOGIN', data: { account, walletSort: walletsSort } })
    await dispatch(loadAccountReferral(account))
    const newAccount = account.newAccount

    if (newAccount) {
      let { defaultFiat } = syncedSettings
      const [phoneCurrency] = getCurrencies()
      if (typeof phoneCurrency === 'string' && phoneCurrency.length >= 3) {
        defaultFiat = phoneCurrency
      }
      // Ensure the creation reason is available before creating wallets:
      const currencyCodes = getState().account.accountReferral.currencyCodes ?? config.defaultWallets
      const defaultSelection = currencyCodesToEdgeAssets(account, currencyCodes)
      const fiatCurrencyCode = 'iso:' + defaultFiat

      const newAccountFlow = async (navigation: NavigationProp<'createWalletSelectCrypto'>, items: WalletCreateItem[]) => {
        navigation.replace('edgeTabs', {
          screen: 'homeTab',
          params: {
            screen: 'home'
          }
        })
        const createWalletsPromise = createCustomWallets(account, fiatCurrencyCode, items, dispatch).catch(error => showError(error))

        // New user FIO handle registration flow (if env is properly configured)
        const { freeRegApiToken = '', freeRegRefCode = '' } = typeof ENV.FIO_INIT === 'object' ? ENV.FIO_INIT : {}
        if (freeRegApiToken !== '' && freeRegRefCode !== '') {
          const isCreateHandle = await Airship.show<boolean>(bridge => <FioCreateHandleModal bridge={bridge} createWalletsPromise={createWalletsPromise} />)
          if (isCreateHandle) {
            navigation.navigate('fioCreateHandle', { freeRegApiToken, freeRegRefCode })
          }
        }

        await createWalletsPromise
        dispatch(logEvent('Signup_Complete'))
      }

      navigation.navigate('edgeApp', {
        screen: 'edgeAppStack',
        params: {
          screen: 'createWalletSelectCryptoNewAccount',
          params: { newAccountFlow, defaultSelection }
        }
      })
    } else {
      navigation.push('edgeApp', {})
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

    // Check for security alerts:
    if (hasSecurityAlerts(account)) {
      navigation.push('securityAlerts', {})
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

      const loadedLocalSettings = await readLocalSettings(account)
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
      await dispatch(expiredFioNamesCheckDates(navigation))
    } catch (error: any) {
      showError(error)
    }
  }
}

export function logoutRequest(navigation: NavigationBase, nextLoginId?: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    Keyboard.dismiss()
    Airship.clear()
    dispatch({ type: 'LOGOUT', data: { nextLoginId } })
    if (typeof account.logout === 'function') await account.logout()
    navigation.navigate('login', { experimentConfig: await getExperimentConfig() })
  }
}

/**
 * Creates wallets inside a new account.
 */
async function createCustomWallets(account: EdgeAccount, fiatCurrencyCode: string, items: WalletCreateItem[], dispatch: Dispatch): Promise<void> {
  // Maps pluginId's to core options:
  const optionsMap = new Map<string, EdgeCreateCurrencyWallet>()
  for (const item of items) {
    const { pluginId, tokenId } = item

    // Ensure we create the wallet:
    let row = optionsMap.get(pluginId)
    if (row == null) {
      const { walletType } = account.currencyConfig[pluginId].currencyInfo
      row = {
        fiatCurrencyCode,
        name: getUniqueWalletName(account, pluginId),
        walletType
      }
      optionsMap.set(pluginId, row)
    }

    // If this is a token, add it:
    if (tokenId != null) {
      row.enabledTokenIds ??= []
      row.enabledTokenIds.push(tokenId)
    }
  }

  // Actually create the wallets:
  const options = [...optionsMap.values()]
  const results = await runWithTimeout(account.createCurrencyWallets(options), 20000, new Error(lstrings.error_creating_wallets)).catch(error => {
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
