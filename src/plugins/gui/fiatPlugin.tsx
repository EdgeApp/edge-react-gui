import Clipboard from '@react-native-clipboard/clipboard'
import { Disklet } from 'disklet'
import { EdgeAccount, EdgeTransaction } from 'edge-core-js'
import { PluginPromotion } from 'edge-info-server'
import * as React from 'react'
import { Linking, Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'

import { DisablePluginMap, NestedDisableMap } from '../../actions/ExchangeInfoActions'
import { launchPaymentProto, LaunchPaymentProtoParams } from '../../actions/PaymentProtoActions'
import { addressWarnings } from '../../actions/ScanActions'
import { ButtonsModal } from '../../components/modals/ButtonsModal'
import { RadioListModal } from '../../components/modals/RadioListModal'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { SendScene2Params } from '../../components/scenes/SendScene2'
import { Airship, showError, showToast, showToastSpinner } from '../../components/services/AirshipInstance'
import { requestPermissionOnSettings } from '../../components/services/PermissionsManager'
import { FiatPluginEnterAmountParams } from '../../plugins/gui/scenes/FiatPluginEnterAmountScene'
import { FiatProviderLink } from '../../types/DeepLinkTypes'
import { HomeAddress, SepaInfo } from '../../types/FormTypes'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { NavigationBase } from '../../types/routerTypes'
import { getHistoricalRate } from '../../util/exchangeRates'
import { getNavigationAbsolutePath } from '../../util/routerUtils'
import { BuyConversionValues, OnLogEvent, SellConversionValues, TrackingEventName } from '../../util/tracking'
import { datelog } from '../../util/utils'
import {
  FiatDirection,
  FiatPaymentType,
  FiatPluginListModalParams,
  FiatPluginPermissions,
  FiatPluginRegionCode,
  FiatPluginStartParams,
  FiatPluginUi,
  FiatPluginUtils,
  FiatPluginWalletPickerResult,
  LinkHandler,
  SaveTxActionParams,
  SaveTxMetadataParams
} from './fiatPluginTypes'

export const SendErrorNoTransaction = 'SendErrorNoTransaction'
export const SendErrorBackPressed = 'SendErrorBackPressed'

const deeplinkListeners: { listener: { direction: FiatDirection; providerId: string; deeplinkHandler: LinkHandler } | null } = { listener: null }

export const fiatProviderDeeplinkHandler = (link: FiatProviderLink) => {
  if (deeplinkListeners.listener == null) {
    showError(`No buy/sell interface currently open to handle fiatProvider deeplink`)
    return
  }
  const { direction, providerId, deeplinkHandler } = deeplinkListeners.listener
  if (link.providerId !== providerId) {
    showError(`Deeplink providerId ${link.providerId} does not match expected providerId ${providerId}`)
    return
  }

  if (link.direction !== direction) {
    showError(`Deeplink direction ${link.direction} does not match expected direction ${direction}`)
    return
  }

  // Close the SafariView if it's open. Otherwise we can't see the Edge app interface
  if (Platform.OS === 'ios') {
    SafariView.dismiss()
  }
  deeplinkHandler(link)
}

export const executePlugin = async (params: {
  account: EdgeAccount
  disklet: Disklet
  defaultIsoFiat: string
  deviceId: string
  direction: 'buy' | 'sell'
  disablePlugins?: NestedDisableMap
  forcedWalletResult?: WalletListResult
  guiPlugin: GuiPlugin
  longPress?: boolean
  navigation: NavigationBase
  paymentType?: FiatPaymentType
  pluginPromotion?: PluginPromotion
  providerId?: string
  regionCode: FiatPluginRegionCode
  onLogEvent: OnLogEvent
}): Promise<void> => {
  const {
    disablePlugins = {},
    account,
    defaultIsoFiat,
    deviceId,
    direction,
    disklet,
    forcedWalletResult,
    guiPlugin,
    longPress = false,
    navigation,
    paymentType,
    pluginPromotion,
    providerId,
    regionCode,
    onLogEvent
  } = params
  const { defaultFiatAmount, forceFiatCurrencyCode, pluginId } = guiPlugin
  const isBuy = direction === 'buy'

  const tabSceneKey = isBuy ? 'buyTab' : 'sellTab'
  const listSceneKey = isBuy ? 'pluginListBuy' : 'pluginListSell'

  function maybeNavigateToCorrectTabScene() {
    const navPath = getNavigationAbsolutePath(navigation)
    if (!navPath.includes(`/edgeTabs/${tabSceneKey}`)) {
      navigation.navigate(tabSceneKey)
      navigation.navigate(listSceneKey, {})
    }
  }

  const showUi: FiatPluginUi = {
    addressWarnings,
    buttonModal: async params => {
      return await Airship.show(bridge => <ButtonsModal bridge={bridge} {...params} />)
    },
    showToastSpinner,
    openWebView: async (params): Promise<void> => {
      maybeNavigateToCorrectTabScene()
      navigation.navigate('guiPluginWebView', params)
    },

    openExternalWebView: async (params): Promise<void> => {
      const { deeplinkHandler, providerId, redirectExternal, url } = params
      datelog(`**** openExternalWebView ${url} deeplinkHandler:${deeplinkHandler}`)
      if (deeplinkHandler != null) {
        if (providerId == null) throw new Error('providerId is required for deeplinkHandler')
        deeplinkListeners.listener = { direction, providerId, deeplinkHandler }
      }
      if (redirectExternal === true) {
        await Linking.openURL(url)
        return
      }
      if (Platform.OS === 'ios') await SafariView.show({ url })
      else await CustomTabs.openURL(params.url)
    },
    walletPicker: async (params): Promise<FiatPluginWalletPickerResult | undefined> => {
      const { headerTitle, allowedAssets, showCreateWallet } = params

      const result =
        forcedWalletResult == null
          ? await Airship.show<WalletListResult>(bridge => (
              <WalletListModal
                bridge={bridge}
                navigation={navigation}
                headerTitle={headerTitle}
                allowedAssets={allowedAssets}
                showCreateWallet={showCreateWallet}
              />
            ))
          : forcedWalletResult

      if (result?.type === 'wallet') return result
    },
    showError: async (e: unknown): Promise<void> => showError(e),
    listModal: async (params: FiatPluginListModalParams): Promise<string | undefined> => {
      const result = await Airship.show<string | undefined>(bridge => (
        <RadioListModal bridge={bridge} title={params.title} selected={params.selected} items={params.items} />
      ))
      return result
    },
    enterAmount(params: FiatPluginEnterAmountParams) {
      maybeNavigateToCorrectTabScene()
      navigation.navigate('guiPluginEnterAmount', params)
    },
    addressForm: async params => {
      const { countryCode, headerTitle, headerIconUri, onSubmit } = params
      return await new Promise((resolve, reject) => {
        maybeNavigateToCorrectTabScene()
        navigation.navigate('guiPluginAddressForm', {
          countryCode,
          headerTitle,
          headerIconUri,
          onSubmit: async (homeAddress: HomeAddress) => {
            if (onSubmit != null) await onSubmit(homeAddress)
            resolve(homeAddress)
          },
          onClose: async () => {
            resolve(undefined)
          }
        })
      })
    },
    requestPermission: async (permissions: FiatPluginPermissions, displayName: string, mandatory: boolean = true) => {
      for (const permission of permissions) {
        const deniedPermission = await requestPermissionOnSettings(disklet, permission, displayName, mandatory)
        if (deniedPermission) {
          return false
        }
      }
      return true
    },
    async rewardsCardDashboard(params) {
      maybeNavigateToCorrectTabScene()
      navigation.navigate('rewardsCardDashboard', params)
    },
    async rewardsCardWelcome(params) {
      maybeNavigateToCorrectTabScene()
      navigation.navigate('rewardsCardWelcome', params)
    },
    sepaForm: async params => {
      const { headerTitle, headerIconUri, doneLabel, onDone } = params
      return await new Promise((resolve, reject) => {
        maybeNavigateToCorrectTabScene()
        navigation.navigate('guiPluginSepaForm', {
          headerTitle,
          headerIconUri,
          doneLabel,
          onDone: async (sepaInfo: SepaInfo) => {
            if (onDone != null) await onDone(sepaInfo)
            resolve(sepaInfo)
          },
          onClose: () => {
            resolve(undefined)
          }
        })
      })
    },
    sepaTransferInfo: async params => {
      return await new Promise((resolve, reject) => {
        const { headerTitle, headerIconUri, promptMessage, transferInfo, onDone } = params
        maybeNavigateToCorrectTabScene()
        navigation.navigate('guiPluginInfoDisplay', {
          headerTitle,
          promptMessage,
          transferInfo,
          headerIconUri,
          onDone: async () => {
            if (onDone != null) await onDone()
            resolve()
          }
        })
      })
    },
    saveTxMetadata: async ({ txid, walletId, tokenId, metadata }: SaveTxMetadataParams) => {
      const wallet = account.currencyWallets[walletId]
      if (wallet == null) throw new Error(`Unknown walletId:${walletId}`)

      if (metadata != null) {
        await wallet.saveTxMetadata({ txid, tokenId, metadata })
      }
    },
    saveTxAction: async ({ txid, walletId, tokenId, assetAction, savedAction }: SaveTxActionParams) => {
      const wallet = account.currencyWallets[walletId]
      if (wallet == null) throw new Error(`Unknown walletId:${walletId}`)
      await wallet.saveTxAction({ txid, tokenId, assetAction, savedAction })
    },
    send: async (params: SendScene2Params) => {
      // Always avoid the scam warning with plugins since we trust our plugins
      params.hiddenFeaturesMap = {
        ...params.hiddenFeaturesMap,
        scamWarning: true
      }
      return await new Promise<EdgeTransaction>((resolve, reject) => {
        maybeNavigateToCorrectTabScene()
        navigation.navigate('send2', {
          ...params,
          onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
            if (error != null) {
              reject(error)
            } else if (edgeTransaction != null) {
              resolve(edgeTransaction)
            } else {
              reject(new Error(SendErrorNoTransaction))
            }
          },
          onBack: () => {
            reject(new Error(SendErrorBackPressed))
          }
        })
      })
    },
    sendPaymentProto: async (params: { uri: string; params: LaunchPaymentProtoParams }) => {
      // Always avoid the scam warning with plugins since we trust our plugins
      await launchPaymentProto(navigation, account, params.uri, { ...params.params, hideScamWarning: true })
    },
    setClipboard: async (value: string) => {
      Clipboard.setString(value)
    },
    showToast: async (message: string, autoHideMs?: number) => {
      showToast(message, autoHideMs)
    },
    trackConversion: async (event: TrackingEventName, opts: { conversionValues: BuyConversionValues | SellConversionValues }) => {
      onLogEvent(event, opts)
    },
    exitScene: async () => {
      navigation.pop()
    },
    waitForAnimationFrame: async () => {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }

  const pluginUtils: FiatPluginUtils = {
    getHistoricalRate
  }

  if (guiPlugin.nativePlugin == null) {
    throw new Error('executePlugin: missing nativePlugin')
  }

  const filteredDisablePlugins: DisablePluginMap = {}
  for (const key of Object.keys(disablePlugins)) {
    if (disablePlugins[key] === true) filteredDisablePlugins[key] = true
  }
  const plugin = await guiPlugin.nativePlugin({
    account,
    deviceId,
    disablePlugins: filteredDisablePlugins,
    longPress,
    guiPlugin,
    pluginUtils,
    showUi
  })
  if (plugin == null) {
    throw new Error(`pluginId ${pluginId} not found`)
  }

  // TODO: Pick one or the other - paymentType or paymentTypes.
  // We currently always use 'paymentType' and then mask it as 'paymentTypes'
  // here. The 'paymentTypes' defined in buy/sellList.json gets ignored, causing
  // confusion.
  const paymentTypes = paymentType != null ? [paymentType] : []
  const startPluginParams: FiatPluginStartParams = {
    direction,
    defaultIsoFiat,
    regionCode,
    paymentTypes,
    forceFiatCurrencyCode,
    defaultFiatAmount,
    pluginPromotion,
    providerId
  }
  await plugin.startPlugin(startPluginParams)
  deeplinkListeners.listener = null
}
