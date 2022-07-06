// @flow
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'

import { RadioListModal } from '../../components/modals/RadioListModal'
import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal'
import { Airship, showError, showToastSpinner } from '../../components/services/AirshipInstance'
import { type GuiPlugin } from '../../types/GuiPluginTypes'
import { type NavigationProp } from '../../types/routerTypes.js'
import {
  type FiatPaymentType,
  type FiatPluginEnterAmountParams,
  type FiatPluginEnterAmountResponse,
  type FiatPluginListModalParams,
  type FiatPluginRegionCode,
  type FiatPluginUi,
  type FiatTxDirection
} from './fiatPluginTypes'

export const executePlugin = async (params: {
  guiPlugin: GuiPlugin,
  regionCode: FiatPluginRegionCode,
  paymentType?: FiatPaymentType,
  direction: FiatTxDirection,
  account: EdgeAccount,
  navigation: NavigationProp<'pluginListBuy'> | NavigationProp<'pluginListSell'>
}): Promise<void> => {
  const { guiPlugin, navigation, account, regionCode, paymentType, direction } = params
  const { pluginId } = guiPlugin

  const showUi: FiatPluginUi = {
    showToastSpinner,
    openWebView: async (params): Promise<void> => {
      if (Platform.OS === 'ios') SafariView.show({ url: params.url })
      else CustomTabs.openURL(params.url)
    },
    walletPicker: async (params): Promise<WalletListResult> => {
      const { headerTitle, allowedAssets } = params
      const walletListResult = await Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={headerTitle} allowedAssets={allowedAssets} />)
      return walletListResult
    },
    showError: async (e: Error): Promise<void> => showError(e),
    listModal: async (params: FiatPluginListModalParams): Promise<string | void> => {
      const result = await Airship.show(bridge => <RadioListModal bridge={bridge} title={params.title} selected={params.selected} items={params.items} />)
      return result
    },
    enterAmount: async (params: FiatPluginEnterAmountParams) => {
      const { headerTitle, label1, label2, initialAmount1, convertValue, getMethods } = params
      return new Promise((resolve, reject) => {
        navigation.navigate('guiPluginEnterAmount', {
          headerTitle,
          label1,
          label2,
          initialAmount1,
          getMethods,
          convertValue,
          onChangeText: async () => undefined,
          onSubmit: async (value: FiatPluginEnterAmountResponse) => {
            resolve(value)
          }
        })
      })
    },
    popScene: async () => {
      navigation.pop()
    }
  }

  if (guiPlugin.nativePlugin == null) {
    throw new Error('executePlugin: missing nativePlugin')
  }

  const plugin = await guiPlugin.nativePlugin({ showUi, account, direction })
  if (plugin == null) {
    throw new Error(`pluginId ${pluginId} not found`)
  }

  const paymentTypes = paymentType != null ? [paymentType] : []
  const startPluginParams = {
    regionCode,
    paymentTypes
  }
  plugin.startPlugin(startPluginParams)
}
