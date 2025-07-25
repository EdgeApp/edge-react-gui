import { abs, div, mul } from 'biggystring'
import { asArray, asOptional } from 'cleaners'
import {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeParsedUri,
  EdgeReceiveAddress,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTokenId,
  EdgeTransaction,
  JsonObject
} from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { launchPaymentProto } from '../../actions/PaymentProtoActions'
import { ButtonsModal } from '../../components/modals/ButtonsModal'
import {
  WalletListModal,
  WalletListResult
} from '../../components/modals/WalletListModal'
import {
  Airship,
  showError,
  showToast
} from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { Dispatch } from '../../types/reduxTypes'
import { NavigationBase } from '../../types/routerTypes'
import { EdgeAsset, MapObject } from '../../types/types'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { CryptoAmount } from '../../util/CryptoAmount'
import {
  getCurrencyCode,
  getCurrencyCodeMultiplier
} from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { makeCurrencyCodeTable } from '../../util/tokenIdTools'
import { logEvent } from '../../util/tracking'
import { CurrencyConfigMap, removeIsoPrefix } from '../../util/utils'
import { asExtendedCurrencyCode } from './types/edgeProviderCleaners'
import {
  EdgeGetReceiveAddressOptions,
  EdgeGetWalletHistoryResult,
  EdgeProviderDeepLink,
  EdgeProviderMethods,
  EdgeProviderSpendTarget,
  EdgeRequestSpendOptions,
  ExtendedCurrencyCode,
  WalletDetails
} from './types/edgeProviderTypes'

const asCurrencyCodesArray = asOptional(asArray(asExtendedCurrencyCode))

export class EdgeProviderServer implements EdgeProviderMethods {
  // Private properties:
  _account: EdgeAccount
  _defaultIsoFiat: string
  _dispatch: Dispatch
  _navigation: NavigationBase
  _plugin: GuiPlugin
  _reloadWebView: () => void
  _selectedTokenId: EdgeTokenId
  _selectedWallet: EdgeCurrencyWallet | undefined

  // Public properties:
  deepLink: EdgeProviderDeepLink

  constructor(opts: {
    account: EdgeAccount
    deepLink: EdgeProviderDeepLink
    defaultIsoFiat: string
    dispatch: Dispatch
    navigation: NavigationBase
    plugin: GuiPlugin
    reloadWebView: () => void
    selectedTokenId: string | null
    selectedWallet?: EdgeCurrencyWallet
  }) {
    const {
      account,
      deepLink,
      defaultIsoFiat,
      dispatch,
      navigation,
      plugin,
      reloadWebView,
      selectedTokenId,
      selectedWallet
    } = opts

    this._account = account
    this._defaultIsoFiat = defaultIsoFiat
    this._dispatch = dispatch
    this._navigation = navigation
    this._plugin = plugin
    this._reloadWebView = reloadWebView
    this._selectedTokenId = selectedTokenId
    this._selectedWallet = selectedWallet
    this.deepLink = deepLink
  }

  async getDeepLink(): Promise<EdgeProviderDeepLink> {
    return this.deepLink
  }

  // Set the currency wallet to interact with. This will show a wallet selector modal
  // for the user to pick a wallet within their list of wallets that match `currencyCodes`
  // Returns the currencyCode chosen by the user (store: Store)
  async chooseCurrencyWallet(
    allowedCurrencyCodes?: ExtendedCurrencyCode[]
  ): Promise<ExtendedCurrencyCode> {
    const account = this._account

    // Sanity-check our untrusted input:
    asCurrencyCodesArray(allowedCurrencyCodes)

    const allObjects = (allowedCurrencyCodes ?? ['']).every(
      code => typeof code === 'object'
    )
    const allStrings = (allowedCurrencyCodes ?? ['']).every(
      code => typeof code === 'string'
    )

    if (!allObjects && !allStrings) {
      throw new Error('Cannot mix string and object currency specifiers')
    }

    const allowedAssets = upgradeExtendedCurrencyCodes(
      account.currencyConfig,
      this._plugin.fixCurrencyCodes,
      allowedCurrencyCodes
    )
    if (allowedAssets == null) {
      throw new Error('No allowed assets specified')
    }

    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={this._navigation}
        showCreateWallet
        allowedAssets={allowedAssets}
        headerTitle={lstrings.choose_your_wallet}
      />
    ))
    if (result?.type === 'wallet') {
      const { walletId, tokenId } = result

      this._selectedWallet = account.currencyWallets[walletId]
      const currencyCode = getCurrencyCode(this._selectedWallet, tokenId)
      if (this._selectedWallet == null)
        throw new Error(`Missing wallet for walletId`)
      const chainCode = this._selectedWallet.currencyInfo.currencyCode
      const tokenCode = currencyCode
      const { pluginId } = this._selectedWallet.currencyInfo
      this._selectedTokenId = tokenId

      const unfixCode = unfixCurrencyCode(
        this._plugin.fixCurrencyCodes,
        pluginId,
        tokenId
      )
      if (unfixCode != null) {
        return unfixCode
      }

      if (allObjects) {
        // If allowedCurrencyCodes is an array of EdgeTokenIdExtended objects
        return {
          pluginId,
          tokenId,
          currencyCode
        }
      }

      const flowHack: any = allowedCurrencyCodes
      const stringCodes: string[] = flowHack
      const returnCurrencyCode = getReturnCurrencyCode(
        stringCodes,
        chainCode,
        tokenCode
      )

      if (returnCurrencyCode == null) {
        throw new Error(
          `Internal error. Tokencode ${tokenCode} selected but not in allowedCurrencyCodes`
        )
      }
      return returnCurrencyCode
    }
    throw new Error(lstrings.user_closed_modal_no_wallet)
  }

  // Get an address from the user's wallet
  async getReceiveAddress(
    options: EdgeGetReceiveAddressOptions = {}
  ): Promise<EdgeReceiveAddress> {
    const wallet = this._selectedWallet
    if (wallet == null) throw new Error('No selected wallet')

    const receiveAddress = await wallet.getReceiveAddress({ tokenId: null })
    if (options.metadata != null) {
      receiveAddress.metadata = options.metadata
    }
    return receiveAddress
  }

  async getCurrentWalletInfo(): Promise<WalletDetails> {
    const tokenId = this._selectedTokenId
    const wallet = this._selectedWallet
    if (wallet == null) throw new Error('No selected wallet')

    const { currencyConfig, currencyInfo } = wallet
    const { currencyCode } =
      tokenId == null ? currencyInfo : currencyConfig.allTokens[tokenId]
    const walletName = getWalletName(wallet)
    const receiveAddress = await wallet.getReceiveAddress({ tokenId: null })
    const icons = getCurrencyIconUris(wallet.currencyInfo.pluginId, tokenId)

    const returnObject: WalletDetails = {
      name: walletName,
      pluginId: currencyInfo.pluginId,
      receiveAddress,
      chainCode: currencyInfo.currencyCode,
      currencyCode,
      fiatCurrencyCode: removeIsoPrefix(this._defaultIsoFiat),
      currencyIcon: icons.symbolImage,
      currencyIconDark: icons.symbolImageDarkMono
    }
    return await Promise.resolve(returnObject)
  }

  async openURL(url: string): Promise<void> {
    await Linking.openURL(url)
  }

  async openEmailApp(emailAddress: string): Promise<void> {
    Mailer.mail(
      {
        subject: '',
        recipients: [emailAddress],
        body: '',
        isHTML: true
      },
      (error, event) => {
        if (String(error) === 'not_available') {
          showError(lstrings.error_no_email_account)
          return
        }

        if (error) showError(error)
      }
    )
  }

  async consoleLog(arg: any): Promise<void> {
    console.log('EP: BridgeLog', arg)
  }

  // Write data to user's account. This data is encrypted and persisted in their Edge
  // account and transferred between devices
  async writeData(data: { [key: string]: string | undefined }): Promise<void> {
    const account = this._account
    const store = account.dataStore
    console.log('edgeProvider writeData: ', JSON.stringify(data))
    await Promise.all(
      Object.keys(data).map(async key => {
        const val = data[key]
        if (val != null) {
          return await store.setItem(this._plugin.storeId, key, val)
        } else {
          return await store.deleteItem(this._plugin.storeId, key)
        }
      })
    )
    console.log('edgeProvider writeData Success')
  }

  // Read data back from the user's account. This can only access data written by this same plugin
  // 'keys' is an array of strings with keys to lookup.
  // Returns an object with a map of key value pairs from the keys passed in
  async readData(keys: string[]): Promise<MapObject<string | undefined>> {
    const account = this._account
    const store = account.dataStore
    const returnObj: MapObject<string | undefined> = {}
    for (const key of keys) {
      returnObj[key] = await store
        .getItem(this._plugin.storeId, key)
        .catch(e => undefined)
    }
    console.log('edgeProvider readData: ', JSON.stringify(returnObj))
    return returnObj
  }

  async exitPlugin() {
    this._navigation.pop()
  }

  async getWalletHistory() {
    const tokenId = this._selectedTokenId
    const wallet = this._selectedWallet
    if (wallet == null) throw new Error('No selected wallet')

    // Prompt user with yes/no modal for permission
    const confirmTxShare = await Airship.show<'ok' | 'cancel' | undefined>(
      bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.fragment_wallets_export_transactions}
          message={sprintf(
            lstrings.transaction_history_permission,
            getWalletName(wallet)
          )}
          buttons={{
            ok: { label: lstrings.yes },
            cancel: { label: lstrings.no }
          }}
        />
      )
    )
    if (confirmTxShare !== 'ok') {
      throw new Error('User denied permission')
    }

    // Grab transactions from current wallet
    const balance = wallet.balanceMap.get(tokenId) ?? '0'

    const txs = await wallet.getTransactions({ tokenId })
    const result: EdgeGetWalletHistoryResult = {
      fiatCurrencyCode: this._defaultIsoFiat,
      balance,
      transactions: txs.map(cleanTx)
    }
    console.log('EdgeGetWalletHistoryResult', JSON.stringify(result))
    return result
  }

  // Request that the user spend to an address or multiple addresses
  async requestSpend(
    providerSpendTargets: EdgeProviderSpendTarget[],
    options: EdgeRequestSpendOptions = {}
  ): Promise<EdgeTransaction | undefined> {
    const {
      customNetworkFee,
      metadata,
      lockInputs = true,
      uniqueIdentifier,
      orderId
    } = options

    const tokenId = this._selectedTokenId
    const wallet = this._selectedWallet
    if (wallet == null) throw new Error('No selected wallet')

    const { currencyConfig, currencyInfo } = wallet
    const { currencyCode } =
      tokenId == null ? currencyInfo : currencyConfig.allTokens[tokenId]

    // PUBLIC ADDRESS URI
    const spendTargets: EdgeSpendTarget[] = []
    for (const target of providerSpendTargets) {
      let { exchangeAmount, nativeAmount, publicAddress, otherParams } = target

      if (exchangeAmount != null) {
        const multiplier = getCurrencyCodeMultiplier(
          wallet.currencyConfig,
          currencyCode
        )
        nativeAmount = mul(exchangeAmount, multiplier)
      }
      spendTargets.push({
        publicAddress,
        nativeAmount,
        otherParams: otherParams as JsonObject,
        memo: uniqueIdentifier,
        uniqueIdentifier
      })
    }

    const spendInfo: EdgeSpendInfo = {
      customNetworkFee,
      metadata,
      spendTargets,
      tokenId
    }
    return await this._requestSpendCommon({ lockInputs, orderId, spendInfo })
  }

  // Request that the user spend to a URI
  async requestSpendUri(
    uri: string,
    options: EdgeRequestSpendOptions = {}
  ): Promise<EdgeTransaction | undefined> {
    console.log(`requestSpendUri ${uri}`)
    const account = this._account
    const {
      customNetworkFee,
      metadata,
      lockInputs = true,
      uniqueIdentifier,
      orderId
    } = options

    const tokenId = this._selectedTokenId
    const wallet = this._selectedWallet
    if (wallet == null) throw new Error('No selected wallet')

    const { currencyConfig, currencyInfo } = wallet
    const { currencyCode: selectedCurrencyCode } =
      tokenId == null ? currencyInfo : currencyConfig.allTokens[tokenId]

    const result: EdgeParsedUri & { paymentProtocolURL?: string } =
      await wallet.parseUri(uri)
    const { legacyAddress, publicAddress, nativeAmount } = result
    const { currencyCode = result.currencyCode } = options

    // Check is PaymentProtocolUri
    if (result.paymentProtocolURL != null) {
      await launchPaymentProto(
        this._navigation,
        account,
        result.paymentProtocolURL,
        {
          tokenId,
          wallet: this._selectedWallet,
          metadata
        }
      ).catch(error => showError(error))
      return
    }

    if (currencyCode !== selectedCurrencyCode) {
      throw new Error(
        'URI currency code mismatch from chooseCurrencyWallet selected code'
      )
    }

    // PUBLIC ADDRESS URI
    const spendInfo: EdgeSpendInfo = {
      customNetworkFee,
      metadata,
      spendTargets: [
        {
          // Prioritize legacyAddress first since the existence of a legacy address means that a legacy address
          // was scanned. Plugins may translate a legacy address into a publicAddress and provide that as well
          publicAddress: legacyAddress ?? publicAddress,
          memo: uniqueIdentifier,
          nativeAmount
        }
      ],
      tokenId
    }
    return await this._requestSpendCommon({ lockInputs, orderId, spendInfo })
  }

  /**
   * Internal helper to launch the send confirmation scene.
   */
  async _requestSpendCommon({
    lockInputs,
    orderId,
    spendInfo
  }: {
    lockInputs: boolean
    orderId?: string
    spendInfo: EdgeSpendInfo
  }): Promise<EdgeTransaction | undefined> {
    const wallet = this._selectedWallet
    if (wallet == null) throw new Error('No selected wallet')
    const { tokenId } = spendInfo

    return await new Promise((resolve, reject) => {
      const lockTilesMap = lockInputs
        ? { address: true, amount: true, wallet: true }
        : undefined

      this._navigation.navigate('send2', {
        walletId: wallet.id,
        tokenId,
        spendInfo,
        lockTilesMap,
        onBack: () => resolve(undefined),
        onDone: (error, transaction) => {
          if (error != null) {
            reject(error)
            return
          }
          if (transaction == null) {
            reject(new Error('Missing transaction'))
            return
          }
          // Do not expose the entire wallet to the plugin:
          resolve(cleanTx(transaction))
          const multiplier = getCurrencyCodeMultiplier(
            wallet.currencyConfig,
            transaction.currencyCode
          )
          const exchangeAmount = div(
            transaction.nativeAmount,
            multiplier,
            multiplier.length
          )
          this._dispatch(
            logEvent('EdgeProvider_Conversion_Success', {
              conversionValues: {
                conversionType: 'crypto',
                cryptoAmount: new CryptoAmount({
                  currencyConfig: wallet.currencyConfig,
                  currencyCode: transaction.currencyCode,
                  exchangeAmount: abs(exchangeAmount)
                }),
                swapProviderId: this._plugin.storeId,
                orderId
              }
            })
          )
        }
      })
    })
  }

  // log body and signature and pubic address and final message (returned from signMessage)
  // log response afterwards line 451
  async signMessage(message: string) /* EdgeSignedMessage */ {
    console.log(`signMessage message:***${message}***`)

    const wallet = this._selectedWallet
    if (wallet == null) throw new Error('No selected wallet')

    const { publicAddress } = await wallet.getReceiveAddress({ tokenId: null })
    const signedMessage = await wallet.signMessage(message, {
      otherParams: { publicAddress }
    })
    console.log(`signMessage public address:***${publicAddress}***`)
    console.log(`signMessage signedMessage:***${signedMessage}***`)
    return signedMessage
  }

  async hasSafariView(): Promise<boolean> {
    return true
  }

  async openSafariView(url: string): Promise<void> {
    if (Platform.OS === 'ios') await SafariView.show({ url })
    else await CustomTabs.openURL(url)
  }

  async displayError(error: Error | string): Promise<void> {
    showError(error)
  }

  async displayToast(arg: string): Promise<void> {
    showToast(arg)
  }

  async restartPlugin(): Promise<void> {
    this._reloadWebView()
  }
}

/**
 * Precisely identifies the assets named by a currency-code array.
 * Accepts plain currency codes, such as "ETH" or "REP",
 * scoped currency codes like "ETH-REP",
 * objects like `{ pluginId: 'ethereum', currencyCode: 'REP' }`,
 * and regular EdgeAsset objects.
 *
 * There is a similar routine for the `WalletListModal`,
 * but we can delete that one once the app updates internally.
 * This one serves a public-facing API,
 * so it will potentially need to stick around forever.
 */
export function upgradeExtendedCurrencyCodes(
  currencyConfigMap: CurrencyConfigMap,
  fixCurrencyCodes: { [badString: string]: EdgeAsset } = {},
  currencyCodes?: ExtendedCurrencyCode[]
): EdgeAsset[] | undefined {
  if (currencyCodes == null || currencyCodes.length === 0) return

  // Grab all relevant tokens from the account:
  const codeLookup = makeCurrencyCodeTable(currencyConfigMap)

  const out: EdgeAsset[] = []
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
        // It's a plain code, like "BTC" or "USDC". If the code matches a chain (ie. "BTC, "ETH", or "DOGE"), add that to the list.
        // Otherwise, code is a token. Only add it to the list if there's a matching chainCode of "ETH" and it doesn't match any
        // mainnet coin.
        //
        // For all other chains, tokenCodes need to be specified with their parent chain. ie "MATIC-USDC"

        // Find all the matching coins that are parent chains
        const mainnets = codeLookup(parentCode).filter(
          match => match.tokenId == null
        )

        // Find all the matching coins that are tokens of ETH
        const ethParent = codeLookup(parentCode).filter(
          match => match.pluginId === 'ethereum' && match.tokenId != null
        )

        // If there is a match for both mainnet coins and ETH tokens, then don't add this currencyCode
        if (mainnets.length > 0 && ethParent.length > 0) continue

        out.push(...mainnets, ...ethParent)
      } else {
        // It's a scoped code, like "ETH-REP", so filter using the parent:
        const parent = codeLookup(parentCode).find(
          match => match.tokenId == null
        )
        if (parent == null) continue
        out.push(
          ...codeLookup(tokenCode).filter(
            match => match.pluginId === parent.pluginId
          )
        )
      }
    } else {
      const { pluginId } = code

      if ('tokenId' in code) {
        const { tokenId } = code
        // The object is already in the modern format:
        out.push({ pluginId, tokenId })
      } else {
        const { currencyCode } = code
        // The object contains a scoped currency code:
        out.push(
          ...codeLookup(currencyCode).filter(
            match => match.pluginId === pluginId
          )
        )
      }
    }
  }

  return out
}

function unfixCurrencyCode(
  fixCurrencyCodes: { [badString: string]: EdgeAsset } = {},
  pluginId: string,
  tokenId: EdgeTokenId
): string | undefined {
  return Object.keys(fixCurrencyCodes).find(
    uid =>
      fixCurrencyCodes[uid].pluginId === pluginId &&
      fixCurrencyCodes[uid].tokenId === tokenId
  )
}

export function getReturnCurrencyCode(
  allowedCurrencyCodes: string[] | undefined,
  chainCode: string,
  tokenCode: string
): string | undefined {
  let returnCurrencyCode

  // See if there's a match with a double code
  returnCurrencyCode = (allowedCurrencyCodes ?? []).find(
    m => m === `${chainCode}-${tokenCode}`
  )

  if (returnCurrencyCode == null) {
    if (chainCode === tokenCode) {
      // Try to match mainnet single codes if a mainnet coin was chosen
      returnCurrencyCode = (allowedCurrencyCodes ?? []).find(
        m => m === chainCode
      )
    } else if (chainCode === 'ETH') {
      // Special case for ETH. Users can specify a single code token
      returnCurrencyCode = (allowedCurrencyCodes ?? []).find(
        m => m === tokenCode
      )
    }
  }

  return returnCurrencyCode
}

function cleanTx(tx: EdgeTransaction): EdgeTransaction {
  const newTx: EdgeTransaction = {
    blockHeight: tx.blockHeight,
    confirmations: tx.confirmations,
    currencyCode: tx.currencyCode,
    date: tx.date,
    // feeRateUsed: tx.feeRateUsed,
    isSend: tx.isSend,
    memos: [],
    metadata: tx.metadata,
    nativeAmount: tx.nativeAmount,
    networkFee: tx.networkFee,
    networkFees: [],
    // networkFeeOption: tx.networkFeeOption,
    ourReceiveAddresses: tx.ourReceiveAddresses,
    parentNetworkFee: tx.parentNetworkFee,
    signedTx: '',
    // requestedCustomFee: tx.requestedCustomFee,
    txid: tx.txid,
    tokenId: tx.tokenId,
    walletId: tx.walletId
  }
  return newTx
}
