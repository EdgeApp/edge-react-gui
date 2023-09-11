import Clipboard from '@react-native-clipboard/clipboard'
import { EdgeAccount, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
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
import { HomeAddress, SepaInfo } from '../../types/FormTypes'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { AppParamList, NavigationBase } from '../../types/routerTypes'
import { getNavigationAbsolutePath } from '../../util/routerUtils'
import {
  FiatPaymentType,
  FiatPluginAddressFormParams,
  FiatPluginListModalParams,
  FiatPluginRegionCode,
  FiatPluginSepaFormParams,
  FiatPluginSepaTransferParams,
  FiatPluginStartParams,
  FiatPluginUi,
  FiatPluginWalletPickerResult
} from './fiatPluginTypes'

export const executePlugin = async (params: {
  account: EdgeAccount
  deviceId: string
  direction: 'buy' | 'sell'
  disablePlugins?: NestedDisableMap
  guiPlugin: GuiPlugin
  navigation: NavigationBase
  paymentType?: FiatPaymentType
  providerId?: string
  regionCode: FiatPluginRegionCode
}): Promise<void> => {
  const { disablePlugins = {}, account, deviceId, direction, guiPlugin, navigation, paymentType, providerId, regionCode } = params
  const { forceFiatCurrencyCode, pluginId } = guiPlugin

  const tabSceneKey = direction === 'buy' ? 'buyTab' : 'sellTab'
  const listSceneKey = direction === 'buy' ? 'pluginListBuy' : 'pluginListSell'

  function maybeNavigateToCorrectTabScene() {
    const navPath = getNavigationAbsolutePath(navigation)
    if (!navPath.includes(`/edgeTabs/${tabSceneKey}`)) {
      navigation.navigate(tabSceneKey, {})
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
      if (Platform.OS === 'ios') await SafariView.show({ url: params.url })
      else await CustomTabs.openURL(params.url)
    },
    walletPicker: async (params): Promise<FiatPluginWalletPickerResult> => {
      const { headerTitle, allowedAssets, showCreateWallet } = params
      const walletListResult = await Airship.show<WalletListResult>(bridge => (
        <WalletListModal bridge={bridge} navigation={navigation} headerTitle={headerTitle} allowedAssets={allowedAssets} showCreateWallet={showCreateWallet} />
      ))
      return walletListResult
    },
    showError: async (e: Error): Promise<void> => showError(e),
    listModal: async (params: FiatPluginListModalParams): Promise<string | undefined> => {
      const result = await Airship.show<string | undefined>(bridge => (
        <RadioListModal bridge={bridge} title={params.title} selected={params.selected} items={params.items} />
      ))
      return result
    },
    enterAmount(params: AppParamList['guiPluginEnterAmount']) {
      maybeNavigateToCorrectTabScene()
      navigation.navigate('guiPluginEnterAmount', params)
    },
    addressForm: async (params: FiatPluginAddressFormParams) => {
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
          }
        })
      })
    },
    async rewardsCardDashboard(params) {
      maybeNavigateToCorrectTabScene()
      navigation.navigate('rewardsCardDashboard', params)
    },
    async rewardsCardWelcome(params) {
      maybeNavigateToCorrectTabScene()
      navigation.navigate('rewardsCardWelcome', params)
    },
    sepaForm: async (params: FiatPluginSepaFormParams) => {
      const { headerTitle, headerIconUri, onSubmit } = params
      return await new Promise((resolve, reject) => {
        maybeNavigateToCorrectTabScene()
        navigation.navigate('guiPluginSepaForm', {
          headerTitle,
          headerIconUri,
          onSubmit: async (sepaInfo: SepaInfo) => {
            if (onSubmit != null) await onSubmit(sepaInfo)
            resolve(sepaInfo)
          }
        })
      })
    },
    sepaTransferInfo: async (params: FiatPluginSepaTransferParams) => {
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
    send: async (params: SendScene2Params) => {
      // Always avoid the scam warning with plugins since we trust our plugins
      params.hiddenFeaturesMap = {
        ...params.hiddenFeaturesMap,
        scamWarning: true
      }
      return await new Promise<void>((resolve, reject) => {
        maybeNavigateToCorrectTabScene()
        navigation.navigate('send2', {
          ...params,
          onDone: (_error: Error | null, edgeTransaction?: EdgeTransaction) => {
            resolve()
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
    showToast: async (message: string) => {
      showToast(message)
    },
    exitScene: async () => {
      navigation.pop()
    }
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
    guiPlugin,
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
    regionCode,
    paymentTypes,
    forceFiatCurrencyCode,
    providerId
  }
  plugin.startPlugin(startPluginParams).catch(showError)
}
