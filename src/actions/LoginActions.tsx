import { EdgeAccount } from 'edge-core-js/types'
import { hasSecurityAlerts } from 'edge-login-ui-rn'
import * as React from 'react'
import { getCurrencies } from 'react-native-localize'
import { sprintf } from 'sprintf-js'

import { readSyncedSettings } from '../actions/SettingsActions'
import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { FioCreateHandleModal } from '../components/modals/FioCreateHandleModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { WalletCreateItem } from '../components/themed/WalletList'
import { ENV } from '../env'
import { lstrings } from '../locales/strings'
import { AccountInitPayload, initialState } from '../reducers/scenes/SettingsReducer'
import { config } from '../theme/appConfig'
import { Dispatch, ThunkAction } from '../types/reduxTypes'
import { NavigationBase, NavigationProp } from '../types/routerTypes'
import { EdgeTokenId, GuiTouchIdInfo } from '../types/types'
import { logActivity } from '../util/logger'
import { logEvent } from '../util/tracking'
import { runWithTimeout } from '../util/utils'
import { loadAccountReferral, refreshAccountReferral } from './AccountReferralActions'
import { getUniqueWalletName } from './CreateWalletActions'
import { expiredFioNamesCheckDates } from './FioActions'
import { readLocalSettings } from './LocalSettingsActions'
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
      const defaultSelection = currencyCodesToEdgeTokenIds(account, currencyCodes)
      const fiatCurrencyCode = 'iso:' + defaultFiat

      const newAccountFlow = async (navigation: NavigationProp<'createWalletSelectCrypto'>, items: WalletCreateItem[]) => {
        navigation.replace('edgeTabs', {
          screen: 'walletsTab',
          params: {
            screen: 'walletList'
          }
        })
        const selectedEdgetokenIds = items.map(item => ({ pluginId: item.pluginId, tokenId: item.tokenId }))

        // New user FIO handle registration flow (if env is properly configured)
        const { freeRegApiToken = '', freeRegRefCode = '' } = typeof ENV.FIO_INIT === 'object' ? ENV.FIO_INIT : {}
        const createWalletsPromise = createCustomWallets(account, fiatCurrencyCode, selectedEdgetokenIds, dispatch)

        if (freeRegApiToken !== '' && freeRegRefCode !== '') {
          const isCreateHandle = await Airship.show<boolean>(bridge => <FioCreateHandleModal bridge={bridge} createWalletsPromise={createWalletsPromise} />)
          if (isCreateHandle) {
            navigation.navigate('fioCreateHandle', { freeRegApiToken, freeRegRefCode })
          }
        }

        await createWalletsPromise
        await updateWalletsRequest()(dispatch, getState)
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
      await updateWalletsRequest()(dispatch, getState)
    } catch (error: any) {
      showError(error)
    }
  }
}

export function logoutRequest(navigation: NavigationBase, nextLoginId?: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    Airship.clear()
    dispatch({ type: 'LOGOUT', data: { nextLoginId } })
    if (typeof account.logout === 'function') await account.logout()
    navigation.navigate('login', {})
  }
}

/**
 * Creates a wallet, with timeout, and maybe also activates it.
 */
async function safeCreateWallet(account: EdgeAccount, walletType: string, walletName: string, fiatCurrencyCode: string, dispatch: Dispatch) {
  try {
    const wallet = await runWithTimeout(
      account.createCurrencyWallet(walletType, {
        name: walletName,
        fiatCurrencyCode
      }),
      20000,
      new Error(lstrings.error_creating_wallets)
    )
    if (account.activeWalletIds.length <= 1) {
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { currencyCode: wallet.currencyInfo.currencyCode, walletId: wallet.id }
      })
    }
    dispatch(trackAccountEvent('Signup_Wallets_Created_Success'))
    logActivity(`Create Wallet (login): ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${walletName}`)

    return wallet
  } catch (error) {
    showError(error)
    dispatch(trackAccountEvent('Signup_Wallets_Created_Failed', { error }))
    throw error
  }
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
  if (edgeTokenIds.length === 0) return await createDefaultWallets(account, fiatCurrencyCode, dispatch)

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

  logEvent('Signup_Complete')
}

/**
 * Creates the default wallets inside a new account.
 */
async function createDefaultWallets(account: EdgeAccount, fiatCurrencyCode: string, dispatch: Dispatch) {
  const defaultEdgeTokenIds = currencyCodesToEdgeTokenIds(account, config.defaultWallets)
  // TODO: Run these in parallel once the Core has safer locking:
  await createCustomWallets(account, fiatCurrencyCode, defaultEdgeTokenIds, dispatch)
}
