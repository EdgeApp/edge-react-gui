// @flow

import { bns, div, eq, gt, gte, mul, toFixed } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeDenomination, EdgeMetaToken, EdgeReceiveAddress, EdgeTransaction } from 'edge-core-js'
import _ from 'lodash'
import { Linking, Platform } from 'react-native'
import SafariView from 'react-native-safari-view'

import { FEE_ALERT_THRESHOLD, FEE_COLOR_THRESHOLD, FIAT_CODES_SYMBOLS, getSymbolFromCurrency } from '../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../locales/intl.js'
import { emptyEdgeDenomination } from '../selectors/DenominationSelectors.js'
import { convertCurrency, convertCurrencyFromExchangeRates } from '../selectors/WalletSelectors.js'
import { type RootState } from '../types/reduxTypes.js'
import type { CustomTokenInfo, ExchangeData, GuiDenomination, GuiWallet, TransactionListTx } from '../types/types.js'
import { type GuiExchangeRates } from '../types/types.js'

export const DIVIDE_PRECISION = 18

export function capitalize(string: string): string {
  if (!string) return ''
  const firstLetter = string.charAt(0).toUpperCase()
  const otherLetters = string.slice(1)
  return `${firstLetter}${otherLetters}`
}

export const cutOffText = (str: string, lng: number) => {
  if (str.length >= lng) {
    return str.slice(0, lng) + '...'
  } else {
    return str
  }
}

export const findDenominationSymbol = (denoms: EdgeDenomination[], value: string) => {
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

export const getSettingsCurrencyMultiplier = (currencyCode: string, settings: Object, denominations: Object) => {
  const setCurrencyDenomination = settings[currencyCode].denomination
  const denominationsInfo = denominations[setCurrencyDenomination]
  const multiplier = denominationsInfo.multiplier
  return multiplier
}

// tokens can only have one denomination / multiplier from what I understand
export const getSettingsTokenMultiplier = (currencyCode: string, settings: Object, denomination: Object): string => {
  let multiplier
  if (denomination) {
    multiplier = denomination[settings[currencyCode].denomination].multiplier
  } else {
    const customDenom = _.find(settings.customTokens, item => item.currencyCode === currencyCode)
    if (customDenom && customDenom.denominations && customDenom.denominations[0]) {
      multiplier = customDenom.denominations[0].multiplier
    } else {
      return '1'
    }
  }
  return multiplier
}

export const getFiatSymbol = (code: string) => {
  code = code.replace('iso:', '')
  return getSymbolFromCurrency(code)
}

// will take the metaTokens property on the wallet (that comes from currencyInfo), merge with account-level custom tokens added, and only return if enabled (wallet-specific)
// $FlowFixMe
export const mergeTokens = (preferredEdgeMetaTokens: $ReadOnly<EdgeMetaToken | CustomTokenInfo>[], edgeMetaTokens: CustomTokenInfo[]) => {
  const tokensEnabled = [...preferredEdgeMetaTokens] // initially set the array to currencyInfo (from plugin), since it takes priority
  for (const x of edgeMetaTokens) {
    // loops through the account-level array
    let found = false // assumes it is not present in the currencyInfo from plugin
    for (const val of tokensEnabled) {
      // loops through currencyInfo array to see if already present
      if (x.currencyCode === val.currencyCode) {
        found = true // if present, then set 'found' to true
      }
    }
    if (!found) tokensEnabled.push(x) // if not already in the currencyInfo, then add to tokensEnabled array
  }
  return tokensEnabled
}

export const mergeTokensRemoveInvisible = (preferredEdgeMetaTokens: EdgeMetaToken[], edgeMetaTokens: CustomTokenInfo[]): EdgeMetaToken[] => {
  const tokensEnabled: EdgeMetaToken[] = [...preferredEdgeMetaTokens] // initially set the array to currencyInfo (from plugin), since it takes priority
  const tokensToAdd = []
  for (const x of edgeMetaTokens) {
    // loops through the account-level array
    if (x.isVisible !== false && _.findIndex(tokensEnabled, walletToken => walletToken.currencyCode === x.currencyCode) === -1) {
      tokensToAdd.push(x)
    }
  }

  // $FlowFixMe this is actually an error, but I don't know how to fix it:
  return tokensEnabled.concat(tokensToAdd)
}

// Used to reject non-numeric (expect '.') values in the FlipInput
export const isValidInput = (input: string): boolean =>
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_()
  !isNaN(+input) || input === '.'

// Used to limit the decimals of a displayAmount
// TODO every function that calls this function needs to be flowed
export const truncateDecimals = (input: string, precision: number, allowBlank: boolean = false): string => {
  if (input === '') {
    if (allowBlank) {
      input = ''
    } else {
      input = '0'
    }
  }
  if (!input.includes('.')) {
    return input
  }
  const [integers, decimals] = input.split('.')
  return precision > 0 ? `${integers}.${decimals.slice(0, precision)}` : integers
}

// Counts zeros after decimal place in number. '0.00036' => 3
export const zerosAfterDecimal = (input: string): number => {
  if (!input.includes('.')) return 0
  const decimals = input.split('.')[1]
  let numZeros = 0
  for (let i = 0; i <= decimals.length; i++) {
    if (decimals[i] === '0') {
      numZeros++
    } else {
      break
    }
  }
  return numZeros
}

// Adds 1 to the least significant digit of a number. '12.00256' => '12.00257'
export const roundUpToLeastSignificant = (input: string): string => {
  if (!input.includes('.')) return input
  const precision = input.split('.')[1].length
  const oneExtra = `0.${'1'.padStart(precision, '0')}`
  return bns.add(input, oneExtra)
}

export const decimalOrZero = (input: string, decimalPlaces: number): string => {
  if (gte(input, '1')) {
    // do nothing to numbers greater than one
    return input
  } else {
    const truncatedToDecimals = toFixed(input, decimalPlaces, decimalPlaces)
    if (eq(truncatedToDecimals, '0')) {
      // cut off to number of decimal places equivalent to zero?
      return '0' // then return zero
    } else {
      // if not equivalent to zero
      return truncatedToDecimals.replace(/0+$/, '') // then return the truncation
    }
  }
}

export const roundedFee = (nativeAmount: string, decimalPlacesBeyondLeadingZeros: number, multiplier: string): string => {
  if (nativeAmount === '') return nativeAmount
  const displayAmount = div(nativeAmount, multiplier, DIVIDE_PRECISION)
  const precision = zerosAfterDecimal(displayAmount) + decimalPlacesBeyondLeadingZeros
  const truncatedAmount = truncateDecimals(displayAmount, precision)
  if (gt(displayAmount, truncatedAmount)) return `${roundUpToLeastSignificant(truncatedAmount)} `
  return `${truncatedAmount} `
}

// Used to convert outputs from core into other denominations (exchangeDenomination, displayDenomination)
export const convertNativeToDenomination =
  (nativeToTargetRatio: string) =>
  (nativeAmount: string): string =>
    div(nativeAmount, nativeToTargetRatio, DIVIDE_PRECISION)

// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToDisplay = convertNativeToDenomination
// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToExchange = convertNativeToDenomination

// Used to convert amounts from display to core inputs
export const convertDisplayToNative =
  (nativeToDisplayRatio: string) =>
  (displayAmount: string): string =>
    !displayAmount ? '' : mul(displayAmount, nativeToDisplayRatio)

export const isCryptoParentCurrency = (wallet: GuiWallet, currencyCode: string) => currencyCode === wallet.currencyCode

export function getNewArrayWithoutItem<T>(array: T[], targetItem: T): T[] {
  return array.filter(item => item !== targetItem)
}

export const getNewArrayWithItem = (array: any[], item: any) => (!array.includes(item) ? [...array, item] : array)

const restrictedCurrencyCodes = ['BTC']

export function getDenomFromIsoCode(currencyCode: string): GuiDenomination {
  if (restrictedCurrencyCodes.findIndex(item => item === currencyCode) !== -1) {
    return {
      name: '',
      symbol: '',
      multiplier: '0'
    }
  }
  const symbol = getSymbolFromCurrency(currencyCode)
  const denom: GuiDenomination = {
    name: currencyCode,
    symbol,
    multiplier: '100'
  }
  return denom
}

export function getAllDenomsOfIsoCurrencies(): GuiDenomination[] {
  // Convert map to an array
  const denomArray = []

  for (const currencyCode of Object.keys(FIAT_CODES_SYMBOLS)) {
    const item = getDenomFromIsoCode(currencyCode)
    if (item.name.length) {
      denomArray.push(item)
    }
  }
  return denomArray
}

export const getSupportedFiats = (defaultCurrencyCode?: string): Array<{ label: string, value: string }> => {
  const out = []
  if (defaultCurrencyCode && FIAT_CODES_SYMBOLS[defaultCurrencyCode]) {
    out.push({
      label: `${defaultCurrencyCode} - ${FIAT_CODES_SYMBOLS[defaultCurrencyCode]}`,
      value: defaultCurrencyCode
    })
  }
  for (const currencyCode of Object.keys(FIAT_CODES_SYMBOLS)) {
    if (defaultCurrencyCode === currencyCode) {
      continue
    }
    out.push({
      label: `${currencyCode} - ${FIAT_CODES_SYMBOLS[currencyCode]}`,
      value: currencyCode
    })
  }
  return out
}

/**
 * Adds the `iso:` prefix to a currency code, if it's missing.
 * @param {*} currencyCode A currency code we believe to be a fiat value.
 */
export function fixFiatCurrencyCode(currencyCode: string) {
  // These are included in the currency-symbol-map library,
  // and therefore might sneak into contexts where we expect fiat codes:
  if (currencyCode === 'BTC' || currencyCode === 'ETH') return currencyCode

  return /^iso:/.test(currencyCode) ? currencyCode : 'iso:' + currencyCode
}

export const isCompleteExchangeData = (exchangeData: ExchangeData) =>
  !!exchangeData.primaryDisplayAmount &&
  !!exchangeData.primaryDisplayName &&
  !!exchangeData.secondaryDisplayAmount &&
  !!exchangeData.secondaryDisplaySymbol &&
  !!exchangeData.secondaryCurrencyCode

export const unspacedLowercase = (input: string) => {
  const newInput = input.replace(' ', '').toLowerCase()
  return newInput
}

export const getCurrencyInfo = (allCurrencyInfos: EdgeCurrencyInfo[], currencyCode: string): EdgeCurrencyInfo | void => {
  for (const info of allCurrencyInfos) {
    for (const denomination of info.denominations) {
      if (denomination.name === currencyCode) {
        return info
      }
    }
  }
  // loop through metaTokens only after all top-level / parent
  // cryptos have been looped through. Native / parent currency
  // takes precedence over tokens
  for (const info of allCurrencyInfos) {
    for (const token of info.metaTokens) {
      for (const denomination of token.denominations) {
        if (denomination.name === currencyCode) {
          return info
        }
      }
    }
  }
}

export const denominationToDecimalPlaces = (denomination: string): string => {
  const numberOfDecimalPlaces = (denomination.match(/0/g) || []).length
  const decimalPlaces = numberOfDecimalPlaces.toString()
  return decimalPlaces
}

export const decimalPlacesToDenomination = (decimalPlaces: string): string => {
  const numberOfDecimalPlaces: number = parseInt(decimalPlaces)
  const denomination: string = '1' + '0'.repeat(numberOfDecimalPlaces)

  // will return, '1' at the very least
  return denomination
}

export const isReceivedTransaction = (edgeTransaction: EdgeTransaction): boolean => {
  return !isSentTransaction(edgeTransaction)
}

export const isSentTransaction = (edgeTransaction: TransactionListTx | EdgeTransaction): boolean => {
  return !!edgeTransaction.nativeAmount && edgeTransaction.nativeAmount.charAt(0) === '-'
}

export type PrecisionAdjustParams = {
  exchangeSecondaryToPrimaryRatio: number,
  secondaryExchangeMultiplier: string,
  primaryExchangeMultiplier: string
}

export function precisionAdjust(params: PrecisionAdjustParams): number {
  const order = Math.floor(Math.log(params.exchangeSecondaryToPrimaryRatio) / Math.LN10 + 0.000000001) // because float math sucks like that
  const exchangeRateOrderOfMagnitude = Math.pow(10, order)

  // Get the exchange rate in tenth of pennies
  const exchangeRateString = bns.mul(exchangeRateOrderOfMagnitude.toString(), bns.mul(params.secondaryExchangeMultiplier, '10'))

  const precisionAdjust = bns.div(exchangeRateString, params.primaryExchangeMultiplier, DIVIDE_PRECISION)

  if (bns.lt(precisionAdjust, '1')) {
    const fPrecisionAdject = parseFloat(precisionAdjust)
    let order = 2 + Math.floor(Math.log(fPrecisionAdject) / Math.LN10 - 0.000000001) // because float math sucks like that
    order = Math.abs(order)
    if (order > 0) {
      return order
    }
  }
  return 0
}

export const noOp = (optionalArgument: any = null) => {
  return optionalArgument
}

export const getReceiveAddresses = (currencyWallets: { [id: string]: EdgeCurrencyWallet }): Promise<{ [id: string]: EdgeReceiveAddress }> => {
  const ids = Object.keys(currencyWallets)
  const promises = ids.map(id => {
    return currencyWallets[id].getReceiveAddress()
  })
  return Promise.all(promises).then(receiveAddresses => {
    return ids.reduce((result, id, index) => {
      return {
        ...result,
        [id]: receiveAddresses[index]
      }
    }, {})
  })
}

export const MILLISECONDS_PER_DAY = 86400000
export const daysBetween = (DateInMsA: number, dateInMsB: number) => {
  const msBetween = dateInMsB - DateInMsA
  const daysBetween = msBetween / MILLISECONDS_PER_DAY
  return daysBetween
}

// Does a shallow compare of obj1 to obj2 and returns the element name of the element which differs
// between the two. Will recursively deep compare any unequal elements specified in traverseObjects.
// Returns the element name of the unequal element or '' if objects are equal
export function getObjectDiff(obj1: Object, obj2: Object, traverseObjects?: Object, ignoreObjects?: Object): string {
  const comparedElements = {}
  for (const e of Object.keys(obj1)) {
    if (ignoreObjects && ignoreObjects[e]) {
      continue
    }
    comparedElements[e] = true
    // eslint-disable-next-line no-prototype-builtins
    if (obj2.hasOwnProperty(e)) {
      if (obj1[e] !== obj2[e]) {
        if (traverseObjects && traverseObjects[e] && typeof obj1[e] === 'object') {
          const deepDiff = getObjectDiff(obj1[e], obj2[e], traverseObjects, ignoreObjects)
          if (deepDiff) {
            // console.log(`getObjectDiff:${e}`)
            return e
          }
        } else {
          // console.log(`getObjectDiff:${e}`)
          return e
        }
      }
    } else {
      // console.log(`getObjectDiff:${e}`)
      return e
    }
  }
  for (const e of Object.keys(obj2)) {
    if ((comparedElements && comparedElements[e]) || (ignoreObjects && ignoreObjects[e])) {
      continue
    }
    // eslint-disable-next-line no-prototype-builtins
    if (obj1.hasOwnProperty(e)) {
      if (obj1[e] !== obj2[e]) {
        if (traverseObjects && traverseObjects[e] && typeof obj1[e] === 'object') {
          const deepDiff = getObjectDiff(obj2[e], obj1[e], traverseObjects)
          if (deepDiff) {
            return e
          }
        } else {
          return e
        }
      }
    } else {
      return e
    }
  }
  return ''
}

export function runWithTimeout<T>(promise: Promise<T>, ms: number, error: Error = new Error(`Timeout of ${ms}ms exceeded`)): Promise<T> {
  const timeout = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(error), ms)
    const onDone = () => clearTimeout(timer)
    promise.then(onDone, onDone)
  })
  return Promise.race([promise, timeout])
}

export function snooze(ms: number): Promise<void> {
  return new Promise((resolve: any) => setTimeout(resolve, ms))
}

export const getTotalFiatAmountFromExchangeRates = (state: RootState, isoFiatCurrencyCode: string): number => {
  const temporaryTotalCrypto: { [string]: number } = {}
  const wallets = state.ui.wallets.byId
  const settings = state.ui.settings

  // loop through each of the walletId's
  for (const parentProp of Object.keys(wallets)) {
    const wallet = wallets[parentProp]
    // loop through all of the nativeBalances, which includes both parent currency and tokens
    for (const currencyCode of Object.keys(wallet.nativeBalances)) {
      // if there is no native balance for the currency / token then assume it's zero
      if (!temporaryTotalCrypto[currencyCode]) {
        temporaryTotalCrypto[currencyCode] = 0
      }

      // get the native balance for this currency
      const nativeBalance = wallet.nativeBalances[currencyCode]
      // if it's a token and not enabled
      const isDisabledToken = currencyCode !== wallet.currencyCode && !wallet.enabledTokens.includes(currencyCode)
      if (isDisabledToken) continue
      // if it is a non-zero amount then we will process it
      if (nativeBalance && nativeBalance !== '0') {
        let denominations
        // check to see if it's a currency first
        if (settings[currencyCode]) {
          // and if so then grab the default denomiation (setting)
          denominations = settings[currencyCode].denominations
        } else {
          // otherwise find the token whose currencyCode matches the one that we are working with
          const tokenInfo = settings.customTokens.find(token => token.currencyCode === currencyCode)
          // grab the denominations array (which is equivalent of the denominations from the previous (true) clause)
          if (!tokenInfo) continue
          denominations = tokenInfo.denominations
        }
        // now go through that array of denominations and find the one whose name matches the currency
        const exchangeDenomination = denominations.find(denomination => denomination.name === currencyCode)
        if (!exchangeDenomination) continue
        // grab the multiplier, which is the ratio that we can multiply and divide by
        const nativeToExchangeRatio: string = exchangeDenomination.multiplier
        // divide the native amount (eg satoshis) by the ratio to end up with standard crypto amount (which exchanges use)
        const cryptoAmount: number = parseFloat(convertNativeToExchange(nativeToExchangeRatio)(nativeBalance))
        temporaryTotalCrypto[currencyCode] = temporaryTotalCrypto[currencyCode] + cryptoAmount
      }
    }
  }

  let total = 0
  for (const currency of Object.keys(temporaryTotalCrypto)) {
    total += convertCurrency(state, currency, isoFiatCurrencyCode, temporaryTotalCrypto[currency])
  }
  return total
}

export const isTooFarAhead = (dateInSeconds: number, currentDateInSeconds: number) => {
  const secondsPerDay = 86400
  const daysPerMonth = 30
  const monthInFuture = currentDateInSeconds + secondsPerDay * daysPerMonth
  return dateInSeconds > monthInFuture
}

export const isTooFarBehind = (dateInSeconds: number) => {
  const dateOfBitcoinGenesisInSeconds = 1230940800 // 2009-01-03T00:00:00.000Z
  return dateInSeconds < dateOfBitcoinGenesisInSeconds
}

export const autoCorrectDate = (dateInSeconds: number, currentDateInSeconds: number = Date.now() / 1000) => {
  if (isTooFarAhead(dateInSeconds, currentDateInSeconds)) return dateInSeconds / 1000
  if (isTooFarBehind(dateInSeconds)) return dateInSeconds * 1000
  return dateInSeconds
}

export const getYesterdayDateRoundDownHour = () => {
  const date = new Date()
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  const yesterday = date.setDate(date.getDate() - 1)
  return new Date(yesterday).toISOString()
}

export const getFeeDisplayed = (number: number): string => {
  const defaultAmount = 2
  const dec = number % 10

  if (dec) {
    return dec.toString().length > 2 ? number.toString() : number.toFixed(defaultAmount)
  }

  return number.toFixed(defaultAmount)
}

export function splitTransactionCategory(fullCategory: string): {
  category: string,
  subCategory: string
} {
  const splittedCategory = fullCategory.split(':')
  const categoryArray = splittedCategory.shift()
  return {
    category: categoryArray,
    subCategory: splittedCategory.length > 0 ? splittedCategory.join(':') : ''
  }
}

type AsyncFunction = void => Promise<any>

export async function asyncWaterfall(asyncFuncs: AsyncFunction[], timeoutMs: number = 5000): Promise<any> {
  let pending = asyncFuncs.length
  const promises: Promise<any>[] = []
  for (const func of asyncFuncs) {
    const index = promises.length
    promises.push(
      func().catch(e => {
        e.index = index
        throw e
      })
    )
    if (pending > 1) {
      promises.push(
        new Promise(resolve => {
          snooze(timeoutMs).then(() => {
            resolve('async_waterfall_timed_out')
          })
        })
      )
    }
    try {
      const result = await Promise.race(promises)
      if (result === 'async_waterfall_timed_out') {
        promises.pop()
        --pending
      } else {
        return result
      }
    } catch (e) {
      const i = e.index
      promises.splice(i, 1)
      promises.pop()
      --pending
      if (!pending) {
        throw e
      }
    }
  }
}

export async function openLink(url: string): Promise<void> {
  if (Platform.OS === 'ios') {
    try {
      await SafariView.isAvailable()
      return SafariView.show({ url })
    } catch (e) {
      console.log(e)
    }
  }
  const supported = await Linking.canOpenURL(url)
  if (supported) {
    Linking.openURL(url)
  } else {
    throw new Error(`Don't know how to open URI: ${url}`)
  }
}

export function debounce(func: Function, wait: number, immediate: boolean): any {
  let timeout

  return function executedFunction() {
    const context = this
    const args = arguments

    const later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }
}

export function getCustomTokenDenomination(currencyCode: string, settings: Object) {
  const customTokenCurrencyInfo = settings.customTokens.find(token => token.currencyCode === currencyCode)
  return customTokenCurrencyInfo ? customTokenCurrencyInfo.denominations[0] : emptyEdgeDenomination
}

export function getDenomination(currencyCode: string, settings: Object, type: 'display' | 'exchange') {
  const currencyInfo = settings[currencyCode]
  if (currencyInfo) {
    const denomination = currencyInfo.denominations.find(denomination => {
      if (type === 'display') {
        return denomination.multiplier === currencyInfo.denomination
      } else if (type === 'exchange') {
        return denomination.name === currencyInfo.currencyCode
      }
      return false
    })
    return denomination ?? emptyEdgeDenomination
  }
  return getCustomTokenDenomination(currencyCode, settings)
}

export function getDefaultDenomination(currencyCode: string, settings: Object): EdgeDenomination {
  return settings[currencyCode].denominations.find(denomination => denomination.name === currencyCode)
}

export function checkCurrencyCodes(fullCurrencyCode: string, currencyCode: string): boolean {
  const [parent, token] = fullCurrencyCode.split('-')
  const checkToken = token ? currencyCode.toLowerCase() === token.toLowerCase() : false
  const checkParent = !token ? currencyCode.toLowerCase() === parent.toLowerCase() : false
  return checkToken || checkParent
}

export function checkCurrencyCodesArray(currencyCode: string, currencyCodesArray: string[]): boolean {
  return !!currencyCodesArray.find(item => checkCurrencyCodes(item, currencyCode))
}

export type FilterDetailsType = { name: string, currencyCode: string, currencyName: string }

export function checkFilterWallet(details: FilterDetailsType, filterText: string, allowedCurrencyCodes?: string[], excludeCurrencyCodes?: string[]): boolean {
  const currencyCode = details.currencyCode.toLowerCase()

  if (allowedCurrencyCodes && allowedCurrencyCodes.length > 0 && !checkCurrencyCodesArray(currencyCode, allowedCurrencyCodes)) {
    return false
  }

  if (excludeCurrencyCodes && excludeCurrencyCodes.length > 0 && checkCurrencyCodesArray(currencyCode, excludeCurrencyCodes)) {
    return false
  }

  if (filterText === '') {
    return true
  }

  const walletName = details.name.replace(' ', '').toLowerCase()
  const currencyName = details.currencyName.replace(' ', '').toLowerCase()
  const filterString = filterText.replace(' ', '').toLowerCase()
  return walletName.includes(filterString) || currencyCode.includes(filterString) || currencyName.includes(filterString)
}

export function alphabeticalSort(itemA: string, itemB: string): number {
  if (itemA < itemB) {
    return -1
  } else if (itemA > itemB) {
    return 1
  } else {
    return 0
  }
}

export function maxPrimaryCurrencyConversionDecimals(primaryPrecision: number, precisionAdjustValue: number): number {
  const newPrimaryPrecision = primaryPrecision - precisionAdjustValue
  return newPrimaryPrecision >= 0 ? newPrimaryPrecision : 0
}

// Convert Transaction Fee to Display Fee
//
// returns fiatSymbol, fiatAmount, fiatStyle, cryptoSymbol and cryptoAmount when transaction fee is present
// return cryptoAmount and fiatAmount when fee is not present

export const convertToCryptoFee = (networkFee: string, displayMultiplier: string, exchangeMultiplier: string): string => {
  const cryptoFeeExchangeDenomAmount = networkFee ? convertNativeToDisplay(exchangeMultiplier)(networkFee) : ''
  const exchangeToDisplayMultiplierRatio = bns.div(exchangeMultiplier, displayMultiplier, DIVIDE_PRECISION)
  return bns.mul(cryptoFeeExchangeDenomAmount, exchangeToDisplayMultiplierRatio)
}

export const feeStyle = {
  danger: 'dangerText',
  warning: 'warningText'
}

export const convertToFiatFee = (
  networkFee: string,
  exchangeMultiplier: string,
  currencyCode: string,
  exchangeRates: GuiExchangeRates,
  isoFiatCurrencyCode: string
): { amount: string, style?: string } => {
  const cryptoFeeExchangeAmount = convertNativeToExchange(exchangeMultiplier)(networkFee)
  const fiatFeeAmount = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, isoFiatCurrencyCode, parseFloat(cryptoFeeExchangeAmount))
  const feeAmountInUSD = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, 'iso:USD', parseFloat(cryptoFeeExchangeAmount))
  return {
    amount: bns.toFixed(fiatFeeAmount, 2, 2),
    style: parseFloat(feeAmountInUSD) > FEE_ALERT_THRESHOLD ? feeStyle.danger : parseFloat(feeAmountInUSD) > FEE_COLOR_THRESHOLD ? feeStyle.warning : undefined
  }
}

export const convertTransactionFeeToDisplayFee = (
  guiWallet: GuiWallet,
  currencyCode: string,
  exchangeRates: GuiExchangeRates,
  transaction: EdgeTransaction | null,
  settings: any
): { fiatSymbol?: string, fiatAmount: string, fiatStyle?: string, cryptoSymbol?: string, cryptoAmount: string } => {
  const { fiatCurrencyCode, isoFiatCurrencyCode } = guiWallet
  const secondaryDisplayDenomination = getDenomFromIsoCode(fiatCurrencyCode)

  const networkFee = transaction ? transaction.networkFee : undefined
  const parentNetworkFee = transaction && transaction.parentNetworkFee ? transaction.parentNetworkFee : undefined

  if (!networkFee && !parentNetworkFee) {
    // if no fee
    return {
      fiatAmount: '0',
      cryptoAmount: '0'
    }
  } else if (parentNetworkFee && bns.gt(parentNetworkFee, '0')) {
    // if parentNetworkFee greater than zero
    const parentDisplayDenomination = getDenomination(guiWallet.currencyCode, settings, 'display')
    const parentExchangeDenomination = getDenomination(guiWallet.currencyCode, settings, 'exchange')
    const cryptoFeeSymbol = parentDisplayDenomination && parentDisplayDenomination.symbol ? parentDisplayDenomination.symbol : ''
    const displayMultiplier = parentDisplayDenomination ? parentDisplayDenomination.multiplier : ''
    const exchangeMultiplier = parentExchangeDenomination ? parentExchangeDenomination.multiplier : ''
    const cryptoAmount = convertToCryptoFee(parentNetworkFee, displayMultiplier, exchangeMultiplier)
    const fiatAmount = convertToFiatFee(parentNetworkFee, exchangeMultiplier, parentExchangeDenomination.name, exchangeRates, isoFiatCurrencyCode)
    return {
      fiatSymbol: secondaryDisplayDenomination.symbol,
      fiatAmount: fiatAmount.amount,
      fiatStyle: fiatAmount.style,
      cryptoSymbol: cryptoFeeSymbol,
      cryptoAmount: cryptoAmount
    }
  } else if (networkFee && bns.gt(networkFee, '0')) {
    // if networkFee greater than zero
    const primaryDisplayDenomination = getDenomination(currencyCode, settings, 'display')
    const primaryExchangeDenomination = getDenomination(currencyCode, settings, 'exchange')
    const cryptoFeeSymbol = primaryDisplayDenomination && primaryDisplayDenomination.symbol ? primaryDisplayDenomination.symbol : ''
    const displayMultiplier = primaryDisplayDenomination ? primaryDisplayDenomination.multiplier : ''
    const exchangeMultiplier = primaryExchangeDenomination ? primaryExchangeDenomination.multiplier : ''
    const cryptoAmount = convertToCryptoFee(networkFee, displayMultiplier, exchangeMultiplier)
    const fiatAmount = convertToFiatFee(networkFee, exchangeMultiplier, currencyCode, exchangeRates, isoFiatCurrencyCode)
    return {
      fiatSymbol: secondaryDisplayDenomination.symbol,
      fiatAmount: fiatAmount.amount,
      fiatStyle: fiatAmount.style,
      cryptoSymbol: cryptoFeeSymbol,
      cryptoAmount: cryptoAmount
    }
  }
  return {
    fiatAmount: '0',
    cryptoAmount: '0'
  }
}
// End of convert Transaction Fee to Display Fee

export function getCryptoAmount(
  balance: string,
  denomination: EdgeDenomination,
  exchangeDenomination: EdgeDenomination,
  fiatDenomination: EdgeDenomination,
  exchangeRate?: number,
  guiWallet: GuiWallet
): string {
  let maxConversionDecimals = 6
  if (exchangeRate) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: exchangeDenomination.multiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(bns.log10(denomination.multiplier), precisionAdjustValue)
  }
  try {
    const preliminaryCryptoAmount = truncateDecimals(bns.div(balance, denomination.multiplier, DIVIDE_PRECISION), maxConversionDecimals)
    const finalCryptoAmount = formatNumber(decimalOrZero(preliminaryCryptoAmount, maxConversionDecimals)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    return `${denomination.symbol ? denomination.symbol + ' ' : ''}${finalCryptoAmount}`
  } catch (error) {
    if (error.message === 'Cannot operate on base16 float values') {
      const errorMessage = `${error.message}: GuiWallet currency code - ${guiWallet.currencyCode}, balance - ${balance}, demonination multiplier: ${denomination.multiplier}`
      throw new Error(errorMessage)
    }
    throw new Error(error)
  }
}
