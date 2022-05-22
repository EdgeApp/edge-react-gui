// @flow

import { abs } from 'biggystring'
import { asArray, asEither, asObject, asOptional, asString } from 'cleaners'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeNetworkFee,
  EdgeParsedUri,
  EdgeReceiveAddress,
  EdgeSpendTarget,
  EdgeTransaction,
  JsonObject
} from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'
import { Bridgeable, update } from 'yaob'

import { launchBitPay } from '../../../../actions/BitPayActions.js'
import { trackAccountEvent, trackConversion } from '../../../../actions/TrackingActions.js'
import { selectWallet } from '../../../../actions/WalletActions'
import { ButtonsModal } from '../../../../components/modals/ButtonsModal.js'
import { type WalletListResult, WalletListModal } from '../../../../components/modals/WalletListModal.js'
import { Airship, showError, showToast } from '../../../../components/services/AirshipInstance.js'
import { SEND } from '../../../../constants/SceneKeys.js'
import s from '../../../../locales/strings'
import { type GuiPlugin } from '../../../../types/GuiPluginTypes.js'
import { type Dispatch, type RootState } from '../../../../types/reduxTypes.js'
import { Actions } from '../../../../types/routerTypes.js'
import type { EdgeTokenId } from '../../../../types/types.js'
import { type GuiMakeSpendInfo } from '../../../../types/types.js'
import { type UriQueryMap } from '../../../../types/WebTypes'
import { getCurrencyIconUris } from '../../../../util/CdnUris'
import { getTokenId } from '../../../../util/CurrencyInfoHelpers.js'
import { makeCurrencyCodeTable } from '../../../../util/utils.js'

type WalletDetails = {
  name: string,
  pluginId?: string,
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

const asEdgeTokenIdExtended = asObject({
  pluginId: asString,
  tokenId: asOptional(asString),
  currencyCode: asOptional(asString)
})

const asCurrencyCodesArray = asOptional(asArray(asEither(asString, asEdgeTokenIdExtended)))
type ExtendedCurrencyCode = string | $Call<typeof asEdgeTokenIdExtended>

export class EdgeProvider extends Bridgeable {
  // Private properties:
  _plugin: GuiPlugin
  _dispatch: Dispatch
  _state: RootState

  // Public properties:
  deepPath: string | void
  deepQuery: UriQueryMap | void
  promoCode: string | void
  restartPlugin: () => void

  constructor(
    plugin: GuiPlugin,
    state: RootState,
    dispatch: Dispatch,
    restartPlugin: () => void,
    deepPath?: string,
    deepQuery?: UriQueryMap,
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

  _updateState(state: RootState, deepPath?: string, deepQuery?: UriQueryMap, promoCode?: string): void {
    this._state = state
    this.deepPath = deepPath
    this.deepQuery = deepQuery
    this.promoCode = promoCode
    update(this)
  }

  // Set the currency wallet to interact with. This will show a wallet selector modal
  // for the user to pick a wallet within their list of wallets that match `currencyCodes`
  // Returns the currencyCode chosen by the user (store: Store)
  async chooseCurrencyWallet(allowedCurrencyCodes: ExtendedCurrencyCode[] | void): Promise<ExtendedCurrencyCode> {
    // Sanity-check our untrusted input:
    asCurrencyCodesArray(allowedCurrencyCodes)

    const selectedWallet: WalletListResult = await Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        showCreateWallet
        allowedAssets={upgradeExtendedCurrencyCodes(this._state.core.account, this._plugin.fixCurrencyCodes, allowedCurrencyCodes)}
        headerTitle={s.strings.choose_your_wallet}
      />
    ))

    const { walletId, currencyCode } = selectedWallet
    if (walletId && currencyCode) {
      this._dispatch(selectWallet(walletId, currencyCode))
      // If allowedCurrencyCodes is an array of EdgeTokenIdExtended objects
      if (allowedCurrencyCodes != null && allowedCurrencyCodes.length > 0 && allowedCurrencyCodes.every(code => typeof code === 'object')) {
        const { pluginId } = this._state.core.account.currencyWallets[walletId].currencyInfo
        const tokenId = getTokenId(this._state.core.account, pluginId, currencyCode)
        return {
          pluginId,
          tokenId,
          currencyCode
        }
      }
      return currencyCode
    }

    throw new Error(s.strings.user_closed_modal_no_wallet)
  }

  // Get an address from the user's wallet
  async getReceiveAddress(options: EdgeGetReceiveAddressOptions): Promise<EdgeReceiveAddress> {
    const edgeWallet: EdgeCurrencyWallet = this._state.core.account.currencyWallets[this._state.ui.wallets.selectedWalletId]
    const receiveAddress = await edgeWallet.getReceiveAddress()
    if (options && options.metadata) {
      receiveAddress.metadata = options.metadata
    }
    return receiveAddress
  }

  async getCurrentWalletInfo(): Promise<WalletDetails> {
    const edgeWallet = this._state.core.account.currencyWallets[this._state.ui.wallets.selectedWalletId]
    const currencyCode = this._state.ui.wallets.selectedCurrencyCode
    const walletName = edgeWallet.name ?? ''
    const receiveAddress = await edgeWallet.getReceiveAddress()
    const contractAddress = edgeWallet.currencyInfo.metaTokens.find(token => token.currencyCode === currencyCode)?.contractAddress

    const icons = getCurrencyIconUris(edgeWallet.currencyInfo.pluginId, contractAddress)
    const returnObject: WalletDetails = {
      name: walletName,
      pluginId: edgeWallet.currencyInfo.pluginId,
      receiveAddress,
      currencyCode,
      fiatCurrencyCode: edgeWallet.fiatCurrencyCode.replace('iso:', ''),
      currencyIcon: icons.symbolImage,
      currencyIconDark: icons.symbolImageDarkMono
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
    const edgeWallet = currencyWallets[this._state.ui.wallets.selectedWalletId]
    const currencyCode = this._state.ui.wallets.selectedCurrencyCode

    // Prompt user with yes/no modal for permission
    const confirmTxShare = await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fragment_wallets_export_transactions}
        message={sprintf(s.strings.transaction_history_permission, edgeWallet.name ?? '')}
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
    const fiatCurrencyCode = edgeWallet.fiatCurrencyCode
    const balance = edgeWallet.balances[currencyCode] ?? '0'

    const txs = await edgeWallet.getTransactions({ currencyCode })
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
    const edgeWallet = currencyWallets[this._state.ui.wallets.selectedWalletId]

    const { currencyCode = edgeWallet.currencyInfo.currencyCode, customNetworkFee, metadata, lockInputs = true, uniqueIdentifier, orderId } = options

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
        nativeAmount = await edgeWallet.denominationToNative(spendTarget.exchangeAmount, currencyCode)
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
    return this._makeSpendRequest(info, edgeWallet, orderId, this._state.ui.wallets.selectedCurrencyCode)
  }

  // Request that the user spend to a URI
  async requestSpendUri(uri: string, options: EdgeRequestSpendOptions = {}): Promise<EdgeTransaction | void> {
    console.log(`requestSpendUri ${uri}`)
    const { currencyWallets } = this._state.core.account
    const edgeWallet = currencyWallets[this._state.ui.wallets.selectedWalletId]

    const result: EdgeParsedUri & { paymentProtocolURL?: string } = await edgeWallet.parseUri(uri)
    const { currencyCode = result.currencyCode, customNetworkFee, metadata, lockInputs = true, uniqueIdentifier, orderId } = options

    // Check is PaymentProtocolUri
    if (result.paymentProtocolURL != null) {
      await launchBitPay(result.paymentProtocolURL, { wallet: edgeWallet, metadata }).catch(showError)
      return
    }

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
    return this._makeSpendRequest(info, edgeWallet, orderId, this._state.ui.wallets.selectedCurrencyCode)
  }

  // log body and signature and pubic address and final message (returned from signMessage)
  // log response afterwards line 451
  async signMessage(message: string) /* EdgeSignedMessage */ {
    console.log(`signMessage message:***${message}***`)
    const { currencyWallets } = this._state.core.account
    const edgeWallet = currencyWallets[this._state.ui.wallets.selectedWalletId]
    const { publicAddress } = await edgeWallet.getReceiveAddress()
    const signedMessage = await edgeWallet.otherMethods.signMessageBase64(message, publicAddress)
    console.log(`signMessage public address:***${publicAddress}***`)
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

  hasSafariView(): boolean {
    return true
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
    if (Platform.OS === 'ios') SafariView.show({ url })
    else CustomTabs.openURL(url)
  }

  async displayError(error: Error | string) {
    showError(error)
  }

  async displayToast(arg: string) {
    showToast(arg)
  }
}

/**
 * Precisely identifies the assets named by a currency-code array.
 * Accepts plain currency codes, such as "ETH" or "REP",
 * scoped currency codes like "ETH-REP",
 * objects like `{ pluginId: 'ethereum', currencyCode: 'REP' }`,
 * and regular EdgeTokenId objects.
 *
 * There is a similar routine for the `WalletListModal`,
 * but we can delete that one once the app updates internally.
 * This one serves a public-facing API,
 * so it will potentially need to stick around forever.
 */
function upgradeExtendedCurrencyCodes(
  account: EdgeAccount,
  fixCurrencyCodes?: { [badString: string]: EdgeTokenId } = {},
  currencyCodes?: ExtendedCurrencyCode[]
): EdgeTokenId[] | void {
  if (currencyCodes == null || currencyCodes.length === 0) return

  // Grab all relevant tokens from the account:
  const lookup = makeCurrencyCodeTable(account)

  const out: EdgeTokenId[] = []
  for (const code of currencyCodes) {
    if (typeof code === 'string') {
      const fixed = fixCurrencyCodes[code]
      if (fixed != null) {
        //  We have a tokenId for this code
        out.push(fixed)
        continue
      }

      const [parentCode, tokenCode] = code.split('-')

      if (tokenCode == null) {
        // It's a plain code, like "REP", so add all matches:
        out.push(...lookup(parentCode))
      } else {
        // It's a scoped code, like "ETH-REP", so filter using the parent:
        const parent = lookup(parentCode).find(match => match.tokenId == null)
        if (parent == null) continue
        out.push(...lookup(tokenCode).filter(match => match.pluginId === parent.pluginId))
      }
    } else {
      const { pluginId, tokenId, currencyCode } = code

      if (currencyCode == null) {
        // The object is already in the modern format:
        out.push({ pluginId, tokenId })
      } else {
        // The object contains a scoped currency code:
        out.push(...lookup(currencyCode).filter(match => match.pluginId === pluginId))
      }
    }
  }

  return out
}
