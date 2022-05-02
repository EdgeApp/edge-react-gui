// @flow

import { abs, add, div, eq, gt, gte, lt, mul, toFixed } from 'biggystring'
import { asArray, asEither, asMaybe, asObject, asOptional, asString } from 'cleaners'
import type { EdgeCurrencyConfig, EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import { Linking, Platform } from 'react-native'
import SafariView from 'react-native-safari-view'

import { FEE_ALERT_THRESHOLD, FEE_COLOR_THRESHOLD, FIAT_CODES_SYMBOLS, FIAT_PRECISION, getSymbolFromCurrency } from '../constants/WalletAndCurrencyConstants.js'
import { formatNumber, toLocaleDate, toLocaleDateTime, toLocaleTime } from '../locales/intl.js'
import s from '../locales/strings.js'
import { getExchangeDenomination } from '../selectors/DenominationSelectors.js'
import { convertCurrency, convertCurrencyFromExchangeRates } from '../selectors/WalletSelectors.js'
import { type RootState } from '../types/reduxTypes.js'
import type { EdgeTokenIdExtended, GuiDenomination, TransactionListTx } from '../types/types.js'
import { type GuiExchangeRates } from '../types/types.js'
import { getWalletFiat } from '../util/CurrencyWalletHelpers.js'

export const DECIMAL_PRECISION = 18
export const DEFAULT_TRUNCATE_PRECISION = 6

export const normalizeForSearch = (str: string, delimiter: string = '') => str.replace(/\s/g, delimiter).toLowerCase()

export function capitalize(string: string): string {
  if (!string) return ''
  const firstLetter = string.charAt(0).toUpperCase()
  const otherLetters = string.slice(1)
  return `${firstLetter}${otherLetters}`
}

// Replaces extra chars with '...' either in the middle or end of the input string
export const truncateString = (input: string | number, maxLength: number, isMidTrunc?: boolean = false) => {
  const inputStr = typeof input !== 'string' ? String(input) : input
  const strLen = inputStr.length
  if (strLen >= maxLength) {
    const delimStr = s.strings.util_truncate_delimeter
    if (isMidTrunc) {
      const segmentLen = Math.round(maxLength / 2)
      const seg1 = inputStr.slice(0, segmentLen)
      const seg2 = inputStr.slice(-1 * segmentLen)
      return seg1 + delimStr + seg2
    } else {
      return inputStr.slice(0, maxLength) + delimStr
    }
  } else {
    return inputStr
  }
}

export const displayFiatAmount = (fiatAmount?: number, precision?: number = 2, noGrouping?: boolean = true) => {
  if (fiatAmount == null || fiatAmount === 0) return precision > 0 ? formatNumber('0.' + '0'.repeat(precision)) : '0'
  const initialAmount = fiatAmount.toFixed(precision)
  const absoluteAmount = abs(initialAmount)
  return formatNumber(toFixed(absoluteAmount, 2, precision), { noGrouping })
}

// Used to reject non-numeric (expect '.') values in the FlipInput
export const isValidInput = (input: string): boolean =>
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_()
  !isNaN(+input) || input === '.'

// Used to limit the decimals of a displayAmount
// TODO every function that calls this function needs to be flowed
export const truncateDecimals = (input: string, precision: number = DEFAULT_TRUNCATE_PRECISION, allowBlank: boolean = false): string => {
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
    if (eq(decimals[i], '0')) {
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
  return add(input, oneExtra)
}

export const zeroString = (input: any): boolean => input == null || typeof input !== 'string' || input === '' || eq(input, '0')

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

export const removeHexPrefix = (s: string) => s.replace(/^0x/, '')

export const isHex = (h: string) => /^[0-9A-F]+$/i.test(h)

export const hexToDecimal = (num: string) => {
  const numberString = num.toLowerCase().startsWith('0x') ? num : `0x${num}`
  return add(numberString, '0', 10)
}

export const roundedFee = (nativeAmount: string, decimalPlacesBeyondLeadingZeros: number, multiplier: string): string => {
  if (nativeAmount === '') return nativeAmount
  const displayAmount = div(nativeAmount, multiplier, DECIMAL_PRECISION)
  const precision = zerosAfterDecimal(displayAmount) + decimalPlacesBeyondLeadingZeros
  const truncatedAmount = truncateDecimals(displayAmount, precision)
  if (gt(displayAmount, truncatedAmount)) return `${roundUpToLeastSignificant(truncatedAmount)} `
  return `${truncatedAmount} `
}

// Used to convert outputs from core into other denominations (exchangeDenomination, displayDenomination)
export const convertNativeToDenomination =
  (nativeToTargetRatio: string) =>
  (nativeAmount: string): string =>
    div(nativeAmount, nativeToTargetRatio, DECIMAL_PRECISION)

// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToDisplay = convertNativeToDenomination
// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToExchange = convertNativeToDenomination

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

export const isReceivedTransaction = (edgeTransaction: EdgeTransaction): boolean => {
  return !isSentTransaction(edgeTransaction)
}

export const isSentTransaction = (edgeTransaction: TransactionListTx | EdgeTransaction): boolean => {
  return !!edgeTransaction.nativeAmount && edgeTransaction.nativeAmount.charAt(0) === '-'
}

export type PrecisionAdjustParams = {
  exchangeSecondaryToPrimaryRatio: string,
  secondaryExchangeMultiplier: string,
  primaryExchangeMultiplier: string
}

export function precisionAdjust(params: PrecisionAdjustParams): number {
  const exchangeSecondaryToPrimaryRatio = parseFloat(params.exchangeSecondaryToPrimaryRatio)
  const order = Math.floor(Math.log(exchangeSecondaryToPrimaryRatio) / Math.LN10 + 0.000000001) // because float math sucks like that
  const exchangeRateOrderOfMagnitude = Math.pow(10, order)

  // Get the exchange rate in tenth of pennies
  const exchangeRateString = mul(exchangeRateOrderOfMagnitude.toString(), mul(params.secondaryExchangeMultiplier, '10'))

  const precisionAdjust = div(exchangeRateString, params.primaryExchangeMultiplier, DECIMAL_PRECISION)

  if (lt(precisionAdjust, '1')) {
    const fPrecisionAdject = parseFloat(precisionAdjust)
    let order = 2 + Math.floor(Math.log(fPrecisionAdject) / Math.LN10 - 0.000000001) // because float math sucks like that
    order = Math.abs(order)
    if (order > 0) {
      return order
    }
  }
  return 0
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
      if (!zeroString(nativeBalance)) {
        const exchangeDenomination = getExchangeDenomination(state, state.core.account.currencyWallets[wallet.id].currencyInfo.pluginId, currencyCode)
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
    total += parseFloat(convertCurrency(state, currency, isoFiatCurrencyCode, temporaryTotalCrypto[currency].toFixed(DECIMAL_PRECISION)))
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

export async function fetchWaterfall(servers?: string[], path: string, options?: any): Promise<any> {
  if (servers == null) return
  const funcs = servers.map(server => async () => {
    const result = await fetch(server + '/' + path, options)
    if (typeof result !== 'object') {
      const msg = `Invalid return value ${path} in ${server}`
      console.log(msg)
      throw new Error(msg)
    }
    return result
  })
  return asyncWaterfall(funcs)
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

export function checkCurrencyCodes(fullCurrencyCode: string, currencyCode: string): boolean {
  const [parent, token] = fullCurrencyCode.split('-')
  const checkToken = token ? currencyCode.toLowerCase() === token.toLowerCase() : false
  const checkParent = !token ? currencyCode.toLowerCase() === parent.toLowerCase() : false
  return checkToken || checkParent
}

const asEdgeTokenIdExtended = asObject({
  pluginId: asString,
  tokenId: asOptional(asString),
  currencyCode: asOptional(asString)
})

const asCurrencyCodesArray = asMaybe(asArray(asEither(asString, asEdgeTokenIdExtended)), [])

export function checkCurrencyCodesArray(currencyCode: string, currencyCodesArray: any[], pluginId: string): boolean {
  const cleanedArray = asCurrencyCodesArray(currencyCodesArray)
  return !!cleanedArray.find(item => {
    if (typeof item === 'string') {
      return checkCurrencyCodes(item, currencyCode)
    } else if (typeof item === 'object') {
      return item.pluginId === pluginId && item.currencyCode === currencyCode.toUpperCase()
    }
    return undefined
  })
}

export type FilterDetailsType = { name: string, currencyCode: string, currencyName: string, pluginId: string }

export function checkFilterWallet(
  details: FilterDetailsType,
  filterText: string,
  allowedCurrencyCodes?: string[] | EdgeTokenIdExtended[],
  excludeCurrencyCodes?: string[]
): boolean {
  const currencyCode = details.currencyCode.toLowerCase()

  if (allowedCurrencyCodes && allowedCurrencyCodes.length > 0 && !checkCurrencyCodesArray(currencyCode, allowedCurrencyCodes, details.pluginId)) {
    return false
  }

  if (excludeCurrencyCodes && excludeCurrencyCodes.length > 0 && checkCurrencyCodesArray(currencyCode, excludeCurrencyCodes, details.pluginId)) {
    return false
  }

  if (filterText === '') {
    return true
  }

  const walletName = normalizeForSearch(details.name)
  const currencyName = normalizeForSearch(details.currencyName)
  const filterString = normalizeForSearch(filterText)
  return walletName.includes(filterString) || currencyCode.includes(filterString) || currencyName.includes(filterString)
}

export function maxPrimaryCurrencyConversionDecimals(primaryPrecision: number, precisionAdjustValue: number): number {
  const newPrimaryPrecision = primaryPrecision - precisionAdjustValue
  return newPrimaryPrecision >= 0 ? newPrimaryPrecision : 0
}

export const feeStyle = {
  danger: 'dangerText',
  warning: 'warningText'
}

export const convertTransactionFeeToDisplayFee = (
  wallet: EdgeCurrencyWallet,
  exchangeRates: GuiExchangeRates,
  transaction: EdgeTransaction | null,
  feeDisplayDenomination: EdgeDenomination,
  feeDefaultDenomination: EdgeDenomination
): { fiatSymbol?: string, fiatAmount: string, fiatStyle?: string, cryptoSymbol?: string, cryptoAmount: string, nativeCryptoAmount: string } => {
  const { fiatCurrencyCode, isoFiatCurrencyCode } = getWalletFiat(wallet)
  const secondaryDisplayDenomination = getDenomFromIsoCode(fiatCurrencyCode)

  let feeNativeAmount
  if (transaction?.parentNetworkFee != null) {
    feeNativeAmount = transaction?.parentNetworkFee
  } else if (transaction?.networkFee != null) feeNativeAmount = transaction?.networkFee

  if (feeNativeAmount != null && gt(feeNativeAmount, '0')) {
    const cryptoFeeSymbol = feeDisplayDenomination && feeDisplayDenomination.symbol ? feeDisplayDenomination.symbol : ''
    const displayMultiplier = feeDisplayDenomination ? feeDisplayDenomination.multiplier : ''
    const exchangeMultiplier = feeDefaultDenomination ? feeDefaultDenomination.multiplier : ''
    const cryptoFeeExchangeDenomAmount = feeNativeAmount ? convertNativeToDisplay(exchangeMultiplier)(feeNativeAmount) : ''
    const exchangeToDisplayMultiplierRatio = div(exchangeMultiplier, displayMultiplier, DECIMAL_PRECISION)
    const cryptoAmount = mul(cryptoFeeExchangeDenomAmount, exchangeToDisplayMultiplierRatio)
    const { currencyCode } = wallet.currencyInfo
    const cryptoFeeExchangeAmount = convertNativeToExchange(exchangeMultiplier)(feeNativeAmount)
    const fiatFeeAmount = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, isoFiatCurrencyCode, cryptoFeeExchangeAmount)
    const feeAmountInUSD = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, 'iso:USD', cryptoFeeExchangeAmount)
    const fiatAmount = {
      amount: toFixed(fiatFeeAmount, FIAT_PRECISION, FIAT_PRECISION),
      style:
        parseFloat(feeAmountInUSD) > FEE_ALERT_THRESHOLD ? feeStyle.danger : parseFloat(feeAmountInUSD) > FEE_COLOR_THRESHOLD ? feeStyle.warning : undefined
    }

    return {
      fiatSymbol: secondaryDisplayDenomination.symbol,
      fiatAmount: fiatAmount.amount,
      fiatStyle: fiatAmount.style,
      cryptoSymbol: cryptoFeeSymbol,
      cryptoAmount: cryptoAmount,
      nativeCryptoAmount: feeNativeAmount
    }
  }

  return {
    fiatAmount: '0',
    cryptoAmount: '0',
    nativeCryptoAmount: '0'
  }
}

export function formatFiatString(props: { fiatAmount: string | number, minPrecision?: string | number, autoPrecision?: boolean, noGrouping?: boolean }) {
  const { fiatAmount, minPrecision = 2, autoPrecision = false, noGrouping = true } = props

  const fiatAmtCleanedDelim = fiatAmount.toString().replace(',', '.')
  let precision: number = parseInt(minPrecision)
  let tempFiatAmount = parseFloat(fiatAmtCleanedDelim)
  if (autoPrecision) {
    while (tempFiatAmount <= 0.1 && tempFiatAmount > 0) {
      tempFiatAmount *= 10
      precision++
    }
  }

  return displayFiatAmount(parseFloat(fiatAmtCleanedDelim), precision, noGrouping)
}

export function unixToLocaleDateTime(unixDate: number): { date: string, time: string, dateTime: string } {
  const date = new Date(unixDate * 1000)
  return {
    date: toLocaleDate(date),
    time: toLocaleTime(date),
    dateTime: toLocaleDateTime(date)
  }
}

export function tokenIdsToCurrencyCodes(currencyConfig: EdgeCurrencyConfig, tokenIds: string[]): string[] {
  const { builtinTokens = {}, customTokens = {} } = currencyConfig

  const out: string[] = []
  for (const tokenId of tokenIds) {
    const token = customTokens[tokenId] ?? builtinTokens[tokenId]
    if (token != null) out.push(token.currencyCode)
  }
  return out
}

export const pickRandom = <T>(array?: T[]): T | null => {
  if (array == null || array.length === 0) return null
  return array[Math.floor(Math.random() * array.length)]
}
