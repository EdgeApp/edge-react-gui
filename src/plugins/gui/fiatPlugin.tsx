import { asArray, asMap, asNumber, asObject, asString } from 'cleaners'
import { EdgeAccount, EdgeDataStore } from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'

import { DisablePluginMap } from '../../actions/ExchangeInfoActions'
import { RadioListModal } from '../../components/modals/RadioListModal'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { Airship, showError, showToastSpinner } from '../../components/services/AirshipInstance'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { NavigationProp } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import {
  FiatPaymentType,
  FiatPluginEnterAmountParams,
  FiatPluginEnterAmountResponse,
  FiatPluginListModalParams,
  FiatPluginRegionCode,
  FiatPluginUi
} from './fiatPluginTypes'
import { createStore } from './pluginUtils'

export const executePlugin = async (params: {
  disablePlugins: DisablePluginMap
  account: EdgeAccount
  direction: 'buy' | 'sell'
  guiPlugin: GuiPlugin
  navigation: NavigationProp<'pluginListBuy'> | NavigationProp<'pluginListSell'>
  paymentType?: FiatPaymentType
  regionCode: FiatPluginRegionCode
}): Promise<void> => {
  const { disablePlugins, account, direction, guiPlugin, navigation, paymentType, regionCode } = params
  const { pluginId } = guiPlugin
  const isBuy = direction === 'buy'

  const showUi: FiatPluginUi = {
    showToastSpinner,
    openWebView: async (params): Promise<void> => {
      if (Platform.OS === 'ios') SafariView.show({ url: params.url })
      else CustomTabs.openURL(params.url)
    },
    // @ts-expect-error
    walletPicker: async (params): Promise<WalletListResult> => {
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
    enterAmount: async (params: FiatPluginEnterAmountParams) => {
      const { headerTitle, label1, label2, initialAmount1, convertValue, getMethods } = params
      return new Promise((resolve, reject) => {
        logEvent(isBuy ? 'Buy_Quote' : 'Sell_Quote')

        navigation.navigate('guiPluginEnterAmount', {
          headerTitle,
          label1,
          label2,
          initialAmount1,
          getMethods,
          convertValue,
          onChangeText: async () => undefined,
          onSubmit: async (value: FiatPluginEnterAmountResponse) => {
            logEvent(isBuy ? 'Buy_Quote_Next' : 'Sell_Quote_Next')
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

  const plugin = await guiPlugin.nativePlugin({ disablePlugins, showUi, account })
  if (plugin == null) {
    throw new Error(`pluginId ${pluginId} not found`)
  }

  const paymentTypes = paymentType != null ? [paymentType] : []
  const startPluginParams = {
    isBuy,
    regionCode,
    paymentTypes
  }
  plugin.startPlugin(startPluginParams)
}

// ****************************************************************************
// XXX Hack. We don't have a clean API to see if the user has a linked bank
// account. For now hard code to ask Wyre. This will change hopefully in the
// next couple months
//
// Most of code below was stolen from edge-plugins-wyre
// ****************************************************************************

const asBlockchainMap = asMap(asString)
export const asGetPaymentMethods = asObject({
  data: asArray(
    asObject({
      status: asString,
      waitingPrompts: asArray(
        asObject({
          type: asString
        })
      ),
      owner: asString,
      id: asString,
      createdAt: asNumber,
      name: asString,
      blockchains: asBlockchainMap
    })
  )
})
const asGetAccount = asObject({ status: asString })

type GetPaymentMethods = ReturnType<typeof asGetPaymentMethods>
type GetAccount = ReturnType<typeof asGetAccount>

export const checkWyreHasLinkedBank = async (dataStore: EdgeDataStore): Promise<boolean | undefined> => {
  try {
    const store = createStore('co.edgesecure.wyre', dataStore)
    let key = await store.getItem('wyreSecret').catch(e => undefined)
    if (key == null) {
      key = await store.getItem('wyreAccountId')
    }
    if (key == null) return false
    const paymentMethods = await getWyrePaymentMethods(key)
    if (paymentMethods.data.length < 1) return false
    const accountName = paymentMethods.data[0].owner.substring(8)
    const wyreAccount = await getWyreAccount(accountName, key)
    return checkWyreActive(wyreAccount, paymentMethods)
  } catch (e: any) {
    if (typeof e.message === 'string' && e.message.includes('No item named')) {
      return false
    }
    console.error(e.message)
  }
}

export function checkWyreActive(account: GetAccount, paymentMethods: GetPaymentMethods): boolean {
  if (account.status !== 'APPROVED') return false

  // Gather payment methods
  for (let i = 0; i < paymentMethods.data.length; i++) {
    // Skip all inactive payment methods
    if (paymentMethods.data[i].status !== 'ACTIVE') {
      continue
    }

    if (paymentMethods.data[i].waitingPrompts.length > 0) {
      const prompt = paymentMethods.data[i].waitingPrompts.find(wp => wp.type === 'RECONNECT_BANK')
      if (prompt != null) {
        continue
      }
    }
    return true
  }

  return false
}

async function getWyreAccount(account: string, token: string): Promise<GetAccount> {
  const timestamp = new Date().getMilliseconds()
  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }
  const url = 'https://api.sendwyre.com/v2/account/' + account + '?timestamp=' + timestamp
  // @ts-expect-error
  const result = await window.fetch(url, data)
  if (!result.ok) throw new Error('fetchError')
  if (result.status === 204) throw new Error('emptyResponse')
  const newData = asGetAccount(await result.json())
  return newData
}

async function getWyrePaymentMethods(token: string): Promise<GetPaymentMethods> {
  const request = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }
  const url = 'https://api.sendwyre.com/v2/paymentMethods' // V2_API_URL + 'apiKeys'
  const result = await fetch(url, request)
  if (!result.ok) throw new Error('fetchError')
  if (result.status === 204) throw new Error('emptyResponse')
  return asGetPaymentMethods(await result.json())
}
