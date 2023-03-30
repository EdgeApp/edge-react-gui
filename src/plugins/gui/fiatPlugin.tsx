import { asArray, asMap, asNumber, asObject, asString } from 'cleaners'
import { EdgeAccount, EdgeDataStore, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'

import { DisablePluginMap, NestedDisableMap } from '../../actions/ExchangeInfoActions'
import { RadioListModal } from '../../components/modals/RadioListModal'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { SendScene2Params } from '../../components/scenes/SendScene2'
import { Airship, showError, showToastSpinner } from '../../components/services/AirshipInstance'
import { HomeAddress, SepaInfo } from '../../types/FormTypes'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { NavigationBase } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import {
  FiatPaymentType,
  FiatPluginAddressFormParams,
  FiatPluginEnterAmountParams,
  FiatPluginEnterAmountResponse,
  FiatPluginListModalParams,
  FiatPluginRegionCode,
  FiatPluginSepaFormParams,
  FiatPluginSepaTransferParams,
  FiatPluginUi
} from './fiatPluginTypes'
import { createStore } from './pluginUtils'

export const executePlugin = async (params: {
  account: EdgeAccount
  direction: 'buy' | 'sell'
  disablePlugins?: NestedDisableMap
  guiPlugin: GuiPlugin
  navigation: NavigationBase
  paymentType?: FiatPaymentType
  providerId?: string
  regionCode: FiatPluginRegionCode
}): Promise<void> => {
  const { disablePlugins = {}, account, direction, guiPlugin, navigation, paymentType, providerId, regionCode } = params
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
      const { headerTitle, label1, label2, initialAmount1, convertValue, getMethods, onSubmit } = params
      return await new Promise((resolve, reject) => {
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
            if (onSubmit != null) await onSubmit(value)
            resolve(value)
          }
        })
      })
    },
    addressForm: async (params: FiatPluginAddressFormParams) => {
      const { countryCode, headerTitle, headerIconUri, onSubmit } = params
      return await new Promise((resolve, reject) => {
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
    sepaForm: async (params: FiatPluginSepaFormParams) => {
      const { headerTitle, headerIconUri, onSubmit } = params
      return await new Promise((resolve, reject) => {
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
      return await new Promise<void>((resolve, reject) => {
        navigation.navigate('send2', {
          ...params,
          onDone: (_error: Error | null, edgeTransaction?: EdgeTransaction) => {
            resolve()
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

  const filteredDisablePlugins: DisablePluginMap = {}
  for (const key of Object.keys(disablePlugins)) {
    if (disablePlugins[key] === true) filteredDisablePlugins[key] = true
  }
  const plugin = await guiPlugin.nativePlugin({
    account,
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
  const startPluginParams = {
    direction,
    regionCode,
    paymentTypes,
    providerId
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
