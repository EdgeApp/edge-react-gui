// @flow

import { abs } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeMetadata, EdgeNetworkFee, EdgeSpendTarget, EdgeTransaction, JsonObject } from 'edge-core-js'
import * as React from 'react'
import { Linking } from 'react-native'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'
import { Bridgeable, update } from 'yaob'

import { trackAccountEvent, trackConversion } from '../../../../actions/TrackingActions.js'
import { selectWallet } from '../../../../actions/WalletActions'
import { ButtonsModal } from '../../../../components/modals/ButtonsModal.js'
import { type WalletListResult, WalletListModal } from '../../../../components/modals/WalletListModal.js'
import { Airship, showError, showToast } from '../../../../components/services/AirshipInstance.js'
import { SEND } from '../../../../constants/SceneKeys.js'
import s from '../../../../locales/strings'
import { type GuiPlugin, type GuiPluginQuery } from '../../../../types/GuiPluginTypes.js'
import { type Dispatch, type RootState } from '../../../../types/reduxTypes.js'
import { Actions } from '../../../../types/routerTypes.js'
import { type GuiMakeSpendInfo, type GuiWallet } from '../../../../types/types.js'

type EdgeReceiveAddress = {
  publicAddress?: string,
  segwitAddress?: string,
  legacyAddress?: string
}
type WalletDetails = {
  name: string,
  receiveAddress: {
    publicAddress: string
  },
  currencyCode: string,
  fiatCurrencyCode: string
}

type EdgeRequestSpendOptions = {
  // Specify the currencyCode to spend to this URI. Required for spending tokens
  currencyCode?: string,

  // This overrides any parameters specified in a URI such as label or message
  metadata?: EdgeMetadata,
  networkFeeOption?: 'low' | 'standard' | 'high',

  // If true, do not allow the user to change the amount to spend
  lockInputs?: boolean,

  // Do not broadcast transaction
  signOnly?: boolean,

  // Additional identifier such as a payment ID for Monero or destination tag for Ripple/XRP
  // This overrides any parameters specified in a URI
  uniqueIdentifier?: string,

  customNetworkFee?: EdgeNetworkFee,
  orderId?: string
}

type EdgeGetReceiveAddressOptions = {
  // Metadata to tag these addresses with for when funds arrive at the address
  metadata?: EdgeMetadata
}

type EdgeGetWalletHistoryResult = {
  fiatCurrencyCode: string, // the fiat currency code of all transactions in the wallet. I.e. "iso:USD"
  balance: string, // the current balance of wallet in the native amount units. I.e. "satoshis"
  transactions: EdgeTransaction[]
}

export type EdgeProviderSpendTarget = {
  exchangeAmount?: string,
  nativeAmount?: string,
  publicAddress?: string,
  otherParams?: JsonObject
}

export class EdgeProvider extends Bridgeable {
  // Private properties:
  _plugin: GuiPlugin
  _dispatch: Dispatch
  _state: RootState

  // Public properties:
  deepPath: string | void
  deepQuery: GuiPluginQuery | void
  promoCode: string | void
  restartPlugin: () => void

  constructor(
    plugin: GuiPlugin,
    state: RootState,
    dispatch: Dispatch,
    restartPlugin: () => void,
    deepPath?: string,
    deepQuery?: GuiPluginQuery,
    promoCode?: string
  ) {
    super()
    this._plugin = plugin
    this._dispatch = dispatch
    this._state = state

    this.deepPath = deepPath
    this.deepQuery = deepQuery
    this.promoCode = promoCode
    this.restartPlugin = restartPlugin
  }

  _updateState(state: RootState, deepPath?: string, deepQuery?: GuiPluginQuery, promoCode?: string): void {
    this._state = state
    this.deepPath = deepPath
    this.deepQuery = deepQuery
    this.promoCode = promoCode
    update(this)
  }

  // Set the currency wallet to interact with. This will show a wallet selector modal
  // for the user to pick a wallet within their list of wallets that match `currencyCodes`
  // Returns the currencyCode chosen by the user (store: Store)
  async chooseCurrencyWallet(allowedCurrencyCodes: string[] = []): Promise<string> {
    const selectedWallet: WalletListResult = await Airship.show(bridge => (
      <WalletListModal bridge={bridge} showCreateWallet allowedCurrencyCodes={allowedCurrencyCodes} headerTitle={s.strings.choose_your_wallet} />
    ))

    const { walletId, currencyCode } = selectedWallet
    if (walletId && currencyCode) {
      this._dispatch(selectWallet(walletId, currencyCode))
      return Promise.resolve(currencyCode)
    }

    throw new Error(s.strings.user_closed_modal_no_wallet)
  }

  // Get an address from the user's wallet
  getReceiveAddress(options: EdgeGetReceiveAddressOptions): EdgeReceiveAddress {
    const wallet: GuiWallet = this._state.ui.wallets.byId[this._state.ui.wallets.selectedWalletId]
    if (options && options.metadata) {
      wallet.receiveAddress.metadata = options.metadata
    }
    return Promise.resolve(wallet.receiveAddress)
  }

  getCurrentWalletInfo(): Promise<WalletDetails> {
    const wallet: GuiWallet = this._state.ui.wallets.byId[this._state.ui.wallets.selectedWalletId]
    const currentCode = this._state.ui.wallets.selectedCurrencyCode
    let walletName = wallet.name
    if (wallet.enabledTokens.length > 1) {
      console.log('EP: We have tokens.. what do we do with them ')
      walletName = currentCode
    }
    const returnObject: WalletDetails = {
      name: walletName,
      receiveAddress: wallet.receiveAddress,
      currencyCode: currentCode,
      fiatCurrencyCode: wallet.fiatCurrencyCode,
      currencyIcon: wallet.symbolImage,
      currencyIconDark: wallet.symbolImageDarkMono
    }
    return Promise.resolve(returnObject)
  }

  openURL(url: string): void {
    Linking.openURL(url)
  }

  openEmailApp(emailAddress: string) {
    Mailer.mail(
      {
        subject: '',
        recipients: [emailAddress],
        body: '',
        isHTML: true
      },
      (error, event) => {
        if (error) showError(error)
      }
    )
  }

  consoleLog(arg: any): void {
    console.log('EP: BridgeLog', arg)
  }

  // Write data to user's account. This data is encrypted and persisted in their Edge
  // account and transferred between devices
  async writeData(data: { [key: string]: string }) {
    const { account } = this._state.core
    const store = account.dataStore
    console.log('edgeProvider writeData: ', JSON.stringify(data))
    await Promise.all(Object.keys(data).map(key => store.setItem(this._plugin.storeId, key, data[key])))
    console.log('edgeProvider writeData Success')
    return { success: true }
  }

  // Read data back from the user's account. This can only access data written by this same plugin
  // 'keys' is an array of strings with keys to lookup.
  // Returns an object with a map of key value pairs from the keys passed in
  async readData(keys: string[]): Promise<Object> {
    const { account } = this._state.core
    const store = account.dataStore
    const returnObj = {}
    for (let i = 0; i < keys.length; i++) {
      returnObj[keys[i]] = await store.getItem(this._plugin.storeId, keys[i]).catch(e => undefined)
    }
    console.log('edgeProvider readData: ', JSON.stringify(returnObj))
    return returnObj
  }

  async exitPlugin() {
    Actions.pop()
  }

  async getWalletHistory() {
    // Get Wallet Info
    const { currencyWallets } = this._state.core.account
    const guiWallet = this._state.ui.wallets.byId[this._state.ui.wallets.selectedWalletId]
    const coreWallet = currencyWallets[guiWallet.id]
    const currencyCode = this._state.ui.wallets.selectedCurrencyCode

    // Prompt user with yes/no modal for permission
    const confirmTxShare = await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fragment_wallets_export_transactions}
        message={sprintf(s.strings.transaction_history_permission, coreWallet.name)}
        buttons={{
          ok: { label: s.strings.yes },
          cancel: { label: s.strings.no }
        }}
      />
    ))
    if (confirmTxShare !== 'ok') {
      throw new Error('User denied permission')
    }

    // Grab transactions from current wallet
    const fiatCurrencyCode = coreWallet.fiatCurrencyCode
    const balance = coreWallet.balances[currencyCode] ?? '0'

    const txs = await coreWallet.getTransactions({ currencyCode })
    const transactions: EdgeTransaction[] = []
    for (const tx of txs) {
      const newTx: EdgeTransaction = {
        currencyCode: tx.currencyCode,
        nativeAmount: tx.nativeAmount,
        networkFee: tx.networkFee,
        parentNetworkFee: tx.parentNetworkFee,
        blockHeight: tx.blockHeight,
        date: tx.date,
        signedTx: '',
        txid: tx.txid,
        ourReceiveAddresses: tx.ourReceiveAddresses,
        metadata: tx.metadata
      }
      transactions.push(newTx)
    }
    const result: EdgeGetWalletHistoryResult = {
      fiatCurrencyCode,
      balance,
      transactions
    }
    console.log('EdgeGetWalletHistoryResult', JSON.stringify(result))
    return result
  }

  // Request that the user spend to an address or multiple addresses
  async requestSpend(spendTargets: EdgeProviderSpendTarget[], options: EdgeRequestSpendOptions = {}): Promise<EdgeTransaction | void> {
    const { currencyWallets } = this._state.core.account
    const guiWallet = this._state.ui.wallets.byId[this._state.ui.wallets.selectedWalletId]
    const coreWallet = currencyWallets[guiWallet.id]

    const { currencyCode = coreWallet.currencyInfo.currencyCode, customNetworkFee, metadata, lockInputs = true, uniqueIdentifier, orderId } = options

    // Prepare the internal spend request:
    const info: GuiMakeSpendInfo = {
      currencyCode,
      customNetworkFee,
      metadata,
      lockInputs,
      uniqueIdentifier
    }

    const edgeSpendTargets: EdgeSpendTarget[] = []
    for (const spendTarget of spendTargets) {
      let nativeAmount = ''
      if (spendTarget.nativeAmount != null) {
        nativeAmount = spendTarget.nativeAmount
      } else if (spendTarget.exchangeAmount != null) {
        nativeAmount = await coreWallet.denominationToNative(spendTarget.exchangeAmount, currencyCode)
      }

      const spendTargetObj: EdgeSpendTarget = { ...spendTarget, nativeAmount }
      if (uniqueIdentifier !== null) spendTargetObj.uniqueIdentifier = uniqueIdentifier
      edgeSpendTargets.push(spendTargetObj)
      console.log(
        `requestSpend currencycode ${currencyCode} and spendTarget.publicAddress ${spendTarget.publicAddress || ''} and uniqueIdentifier ${
          uniqueIdentifier || ''
        }`
      )
    }
    info.spendTargets = edgeSpendTargets

    // Launch:
    return this._makeSpendRequest(info, coreWallet, orderId, this._state.ui.wallets.selectedCurrencyCode)
  }

  // Request that the user spend to a URI
  async requestSpendUri(uri: string, options: EdgeRequestSpendOptions = {}): Promise<EdgeTransaction | void> {
    console.log(`requestSpendUri ${uri}`)
    const { currencyWallets } = this._state.core.account
    const guiWallet = this._state.ui.wallets.byId[this._state.ui.wallets.selectedWalletId]
    const coreWallet = currencyWallets[guiWallet.id]
    const result = await coreWallet.parseUri(uri)

    const { currencyCode = result.currencyCode, customNetworkFee, metadata, lockInputs = true, uniqueIdentifier, orderId } = options

    // Prepare the internal spend request:
    const info: GuiMakeSpendInfo = {
      currencyCode,
      nativeAmount: result.nativeAmount,
      publicAddress: result.legacyAddress || result.publicAddress,
      customNetworkFee,
      metadata,
      lockInputs,
      uniqueIdentifier
    }

    // Launch:
    return this._makeSpendRequest(info, coreWallet, orderId, this._state.ui.wallets.selectedCurrencyCode)
  }

  // log body and signature and pubic address and final message (returned from signMessage)
  // log response afterwards line 451
  async signMessage(message: string) /* EdgeSignedMessage */ {
    console.log(`signMessage message:***${message}***`)
    const { currencyWallets } = this._state.core.account
    const guiWallet = this._state.ui.wallets.byId[this._state.ui.wallets.selectedWalletId]
    const coreWallet = currencyWallets[guiWallet.id]
    const signedMessage = await coreWallet.otherMethods.signMessageBase64(message, guiWallet.receiveAddress.publicAddress)
    console.log(`signMessage public address:***${guiWallet.receiveAddress.publicAddress}***`)
    console.log(`signMessage signedMessage:***${signedMessage}***`)
    return signedMessage
  }

  /**
   * Internal helper to launch the send confirmation scene.
   */
  async _makeSpendRequest(
    guiMakeSpendInfo: GuiMakeSpendInfo,
    coreWallet: EdgeCurrencyWallet,
    orderId?: string,
    selectedCurrencyCode: string
  ): Promise<EdgeTransaction | void> {
    const transaction: EdgeTransaction | void = await new Promise((resolve, reject) => {
      guiMakeSpendInfo.onDone = (error: Error | null, transaction?: EdgeTransaction) => {
        error ? reject(error) : resolve(transaction)
      }
      guiMakeSpendInfo.onBack = () => {
        resolve()
      }
      Actions.push(SEND, {
        guiMakeSpendInfo,
        selectedWalletId: coreWallet.id,
        selectedCurrencyCode
      })
    })

    if (transaction != null) {
      const { metadata } = guiMakeSpendInfo
      if (metadata != null) {
        await coreWallet.saveTxMetadata(transaction.txid, transaction.currencyCode, metadata)
      }

      Actions.pop()

      const exchangeAmount = await coreWallet.nativeToDenomination(transaction.nativeAmount, transaction.currencyCode)
      this._dispatch(
        trackConversion('EdgeProviderConversion', {
          pluginId: this._plugin.storeId,
          orderId,
          account: this._state.core.account,
          currencyCode: transaction.currencyCode,
          exchangeAmount: Number(abs(exchangeAmount))
        })
      )
    }
    return transaction
  }

  async trackConversion(opts?: { currencyCode: string, exchangeAmount: number }) {
    if (opts != null) {
      const { currencyCode, exchangeAmount } = opts
      this._dispatch(
        trackConversion('EdgeProviderConversion', {
          pluginId: this._plugin.storeId,
          account: this._state.core.account,
          currencyCode,
          exchangeAmount
        })
      )
    } else {
      this._dispatch(
        trackAccountEvent('EdgeProviderConversion', {
          pluginId: this._plugin.storeId
        })
      )
    }
  }

  hasSafariView(): Promise<boolean> {
    return SafariView.isAvailable()
  }

  // window.fetch.catch(console log then throw)
  async deprecatedAndNotSupportedDouble(request: Object, firstURL: string, url2: string): Promise<mixed> {
    console.log('Bity firstURL: ' + firstURL)
    const response = await window.fetch(firstURL, request).catch(e => {
      console.log(`throw from fetch firstURL: ${firstURL}`, e)
      throw e
    })
    console.log('Bity response1: ', response)
    if (response.status !== 201) {
      const errorData = await response.json()
      throw new Error(errorData.errors[0].code + ' ' + errorData.errors[0].message)
    }
    const secondURL = url2 + response.headers.get('Location')
    console.log('Bity secondURL: ', secondURL)
    const request2 = {
      method: 'GET',
      credentials: 'include'
    }
    const response2 = await window.fetch(secondURL, request2).catch(e => {
      console.log(`throw from fetch secondURL: ${secondURL}`, e)
      throw e
    })
    console.log('Bity response2: ', response2)
    if (response2.status !== 200) {
      throw new Error('Problem confirming order: Code n200')
    }
    const orderData = await response2.json()
    console.log('Bity orderData: ', orderData)
    if (orderData.message_to_sign) {
      const { body } = orderData.message_to_sign
      const signedTransaction = await this.signMessage(body)
      const thirdURL = url2 + orderData.message_to_sign.signature_submission_url
      const request = {
        method: 'POST',
        headers: {
          Host: 'exchange.api.bity.com',
          'Content-Type': '*/*'
        },
        body: signedTransaction
      }
      console.log('Bity thirdURL: ' + thirdURL)
      const signedTransactionResponse = await window.fetch(thirdURL, request).catch(e => {
        console.log(`throw from fetch thirdURL: ${thirdURL}`, e)
        throw e
      })
      console.log('Bity signedTransactionResponse: ', signedTransactionResponse)
      if (signedTransactionResponse.status === 400) {
        throw new Error('Could not complete transaction. Code: 470')
      }
      if (signedTransactionResponse.status === 204) {
        const bankDetailsRequest = {
          method: 'GET',
          credentials: 'include'
        }
        const detailUrl = firstURL + '/' + orderData.id
        console.log('detailURL: ' + detailUrl)
        const bankDetailResponse = await window.fetch(detailUrl, bankDetailsRequest).catch(e => {
          console.log(`throw from fetch detailUrl: ${detailUrl}`, e)
          throw e
        })
        if (bankDetailResponse.status === 200) {
          const parsedResponse = await bankDetailResponse.json()
          console.log('Bity parsedResponse: ', parsedResponse)
          return parsedResponse
        }
      }
    }
    return orderData
  }

  async openSafariView(url: string): Promise<mixed> {
    SafariView.show({ url })
  }

  async displayError(error: Error | string) {
    showError(error)
  }

  async displayToast(arg: string) {
    showToast(arg)
  }
}
