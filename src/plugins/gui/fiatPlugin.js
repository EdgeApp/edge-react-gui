// @flow
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal'
import { Airship, showError } from '../../components/services/AirshipInstance'
import { type GuiPlugin } from '../../types/GuiPluginTypes'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type FiatPluginEnterAmountParams, type FiatPluginEnterAmountResponse } from './fiatPluginTypes'

export const executePlugin = async (params: {
  guiPlugin: GuiPlugin,
  account: EdgeAccount,
  navigation: NavigationProp<'pluginListBuy'> | NavigationProp<'pluginListSell'>
}): Promise<void> => {
  const { guiPlugin, navigation, account } = params
  const { pluginId } = guiPlugin

  const showUi = {
    openWebView: async params => {},
    walletPicker: async (params): Promise<WalletListResult> => {
      const { headerTitle, allowedAssets } = params
      const walletListResult = await Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={headerTitle} allowedAssets={allowedAssets} />)
      return walletListResult
    },
    errorDropdown: async (e: Error) => {
      showError(e)
    },
    enterAmount: async (params: FiatPluginEnterAmountParams) => {
      const { headerTitle, label1, label2, initialAmount1, convertValue } = params
      return new Promise((resolve, reject) => {
        navigation.navigate('guiPluginEnterAmount', {
          headerTitle,
          label1,
          label2,
          initialAmount1,
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

  const plugin = await guiPlugin.nativePlugin({ showUi, account })
  if (plugin == null) {
    throw new Error(`pluginId ${pluginId} not found`)
  }

  plugin.startPlugin()
}
