import { add, div, eq, gt, gte, lt, mul, toFixed } from 'biggystring'
import {
  EdgeCurrencyConfig,
  EdgeCurrencyInfo,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgePluginMap,
  EdgeToken,
  EdgeTokenMap,
  EdgeTransaction
} from 'edge-core-js'
import { Linking, Platform } from 'react-native'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'
import { v4 } from 'uuid'

import {
  FEE_ALERT_THRESHOLD,
  FEE_COLOR_THRESHOLD,
  FIAT_CODES_SYMBOLS,
  FIAT_PRECISION,
  getSymbolFromCurrency,
  SPECIAL_CURRENCY_INFO
} from '../constants/WalletAndCurrencyConstants'
import { toLocaleDate, toLocaleDateTime, toLocaleTime } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { convertCurrencyFromExchangeRates } from '../selectors/WalletSelectors'
import { RootState } from '../types/reduxTypes'
import { GuiDenomination, GuiExchangeRates, GuiFiatType } from '../types/types'
import { getWalletFiat } from '../util/CurrencyWalletHelpers'
import { getTokenId } from './CurrencyInfoHelpers'
import { base58 } from './encoding'

export const DECIMAL_PRECISION = 18
export const DEFAULT_TRUNCATE_PRECISION = 6

export const normalizeForSearch = (str: string, delimiter: string = '') => str.replace(/\s/g, delimiter).toLowerCase()

// Replaces extra chars with '...' either in the middle or end of the input string
export const truncateString = (input: string | number, maxLength: number, isMidTrunc: boolean = false) => {
  const inputStr = typeof input !== 'string' ? String(input) : input
  const strLen = inputStr.length
  if (strLen >= maxLength) {
    const delimStr = lstrings.util_truncate_delimeter
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

// Used to reject non-numeric (expect '.') values in the FlipInput
export const isValidInput = (input: string): boolean =>
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_()
  (!isNaN(+input) || input === '.') && input !== 'Infinity'

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

export const zeroString = (input?: string): boolean => input == null || input === '' || eq(input, '0')

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

export const mulToPrecision = (multiplier: string): number => multiplier.match(/0/g)?.length ?? DECIMAL_PRECISION

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

export const getSupportedFiats = (defaultCurrencyCode?: string): GuiFiatType[] => {
  const out: GuiFiatType[] = []
  if (defaultCurrencyCode != null && FIAT_CODES_SYMBOLS[defaultCurrencyCode] != null) {
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

// multiplier / exchange rate / ( 1 / unit )
// 100000000 / $16500 / (1/$0.001) = ~6 sats
export const calculateSpamThreshold = (rate: string, denom: EdgeDenomination) => {
  return div(div(denom.multiplier, rate), '1000')
}

export interface PrecisionAdjustParams {
  exchangeSecondaryToPrimaryRatio: string
  secondaryExchangeMultiplier: string
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

export async function runWithTimeout<T>(promise: Promise<T>, ms: number, error: Error = new Error(`Timeout of ${ms}ms exceeded`)): Promise<T> {
  const timeout: Promise<T> = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(error), ms)
    const onDone = () => clearTimeout(timer)
    promise.then(onDone, onDone)
  })
  return await Promise.race([promise, timeout])
}

export async function snooze(ms: number): Promise<void> {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

let prevTotal = '0'
export const getTotalFiatAmountFromExchangeRates = (state: RootState, isoFiatCurrencyCode: string): number => {
  const log: string[] = ['', '']
  let total = '0'
  const { exchangeRates } = state
  for (const walletId of Object.keys(state.core.account.currencyWallets)) {
    const wallet = state.core.account.currencyWallets[walletId]
    log.push(`LogTot: pluginId:${wallet.currencyInfo.pluginId} wallet=${wallet.id.slice(0, 5)} isoFiat=${isoFiatCurrencyCode}`)
    for (const currencyCode of Object.keys(wallet.balances)) {
      const nativeBalance = wallet.balances[currencyCode] ?? '0'
      const rate = exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`] ?? '0'
      log.push(`\nLogTot: code=${currencyCode} rate=${rate} nb=${nativeBalance}`)

      // Find the currency or token info:
      let info: EdgeCurrencyInfo | EdgeToken = wallet.currencyInfo
      if (currencyCode !== wallet.currencyInfo.currencyCode) {
        const tokenId = getTokenId(state.core.account, wallet.currencyInfo.pluginId, currencyCode)
        if (tokenId == null) {
          log.push(`LogTot: No tokenId for ${currencyCode}`)
          continue
        }
        info = wallet.currencyConfig.allTokens[tokenId]
      }
      const {
        denominations: [denomination]
      } = info
      log.push(`LogTot: mult=${denomination.multiplier} name=${denomination.name}`)

      // Do the conversion:
      const exchangeBalance = div(nativeBalance, denomination.multiplier, DECIMAL_PRECISION)
      const fiatBalance = mul(rate, exchangeBalance)
      const newTotal = add(total, fiatBalance)
      log.push(`LogTot: nativeBalance=${nativeBalance} / multiplier=${denomination.multiplier} => exchangeBalance=${exchangeBalance}`)
      log.push(`LogTot: rate=${rate} * exchangeBalance=${exchangeBalance} => fiatBalance=${fiatBalance}`)
      log.push(`LogTot: total=${total} + fiatBalance=${fiatBalance} => newTotal=${newTotal}`)
      total = newTotal
    }
  }

  if (total !== prevTotal) {
    // Use for troubleshooting incorrect balance issues. Disable for now as it's pretty noisy
    // console.log(log.join('\n'))
  }
  prevTotal = total
  return Number(total)
}

export const getYesterdayDateRoundDownHour = () => {
  const date = new Date()
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  const yesterday = date.setDate(date.getDate() - 1)
  return new Date(yesterday).toISOString()
}

type AsyncFunction = () => Promise<any>

export async function asyncWaterfall(asyncFuncs: AsyncFunction[], timeoutMs: number = 5000): Promise<any> {
  let pending = asyncFuncs.length
  const promises: Array<Promise<any>> = []
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
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          snooze(timeoutMs).then(() => {
            resolve('async_waterfall_timed_out')
          })
        })
      )
    }
    try {
      const result = await Promise.race(promises)
      if (result === 'async_waterfall_timed_out') {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        promises.pop()
        --pending
      } else {
        return result
      }
    } catch (e: any) {
      const i = e.index
      promises.splice(i, 1)
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
      await SafariView.show({ url })
      return
    } catch (e: any) {
      console.log(e)
    }
  }
  const supported = await Linking.canOpenURL(url)
  if (supported) {
    await Linking.openURL(url)
  } else {
    throw new Error(`Don't know how to open URI: ${url}`)
  }
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
): { fiatSymbol?: string; fiatAmount: string; fiatStyle?: string; cryptoSymbol?: string; cryptoAmount: string; nativeCryptoAmount: string } => {
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

export function unixToLocaleDateTime(unixDate: number): { date: string; time: string; dateTime: string } {
  const date = new Date(unixDate * 1000)
  return {
    date: toLocaleDate(date),
    time: toLocaleTime(date),
    dateTime: toLocaleDateTime(date)
  }
}

/**
 * Returns a list string representation of the string array.
 *
 * toListString(['1', '2']) === '1 and 2'
 * toListString(['1','2','3']) === '1, 2, and 3'
 */
export const toListString = (elements: string[]): string => {
  if (elements.length === 0) return ''
  if (elements.length === 1) return elements[0]
  if (elements.length === 2) return sprintf(lstrings.util_s_and_s, elements[0], elements[1])

  const firstPart = elements.slice(0, elements.length - 2)
  const lastPart = sprintf(lstrings.util_s_and_s, elements[elements.length - 2], elements[elements.length - 1])
  return firstPart.join(', ') + `, ${lastPart}`
}

/**
 * Returns the wallet plugin ID based on a chain/native asset currency code
 * Returns null if Edge does not support the specified chain.
 * Not case sensitive.
 */
export const getPluginIdFromChainCode = (chainCode: string): string | undefined => {
  const pluginId = Object.keys(SPECIAL_CURRENCY_INFO).find(key => SPECIAL_CURRENCY_INFO[key].chainCode === chainCode.toUpperCase())
  return pluginId
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

export interface MiniCurrencyConfig {
  allTokens: EdgeTokenMap
  currencyInfo: EdgeCurrencyInfo
}
export type CurrencyConfigMap = EdgePluginMap<EdgeCurrencyConfig> | EdgePluginMap<MiniCurrencyConfig>

export const shuffleArray = <T>(array: T[]): T[] => {
  let currentIndex = array.length
  let temporaryValue, randomIndex

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

export const pickRandom = <T>(array?: T[]): T | null => {
  if (array == null || array.length === 0) return null
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Waits for a collection of promises.
 * Returns all the promises that manage to resolve within the timeout.
 * If no promises mange to resolve within the timeout,
 * returns the first promise that resolves.
 * If all promises reject, rejects an array of errors.
 */
export async function fuzzyTimeout<T>(promises: Array<Promise<T>>, timeoutMs: number): Promise<T[]> {
  return await new Promise((resolve, reject) => {
    let done = false
    const results: T[] = []
    const failures: any[] = []

    // Set up the timer:
    // let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
      timer = undefined
      if (results.length > 0) {
        done = true
        resolve(results)
      }
    }, timeoutMs)

    function checkEnd(): void {
      const allDone = results.length + failures.length === promises.length
      if (allDone && timer != null) {
        clearTimeout(timer)
      }
      if (allDone || timer == null) {
        done = true
        if (results.length > 0) resolve(results)
        else reject(failures)
      }
    }
    checkEnd() // Handle empty lists

    // Attach to the promises:
    for (const promise of promises) {
      promise.then(
        result => {
          if (done) return
          results.push(result)
          checkEnd()
        },
        failure => {
          if (done) return
          failures.push(failure)
          checkEnd()
        }
      )
    }
  })
}

export const formatLargeNumberString = (num: number): string => {
  const absNum = Math.abs(num)
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1) + ' Bn'
  } else if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + ' M'
  } else {
    return num.toString()
  }
}

export const consify = (arg: any) => console.log(JSON.stringify(arg, null, 2))

export const makeUuid = () => {
  return v4({ random: Array.from({ length: 16 }, () => Math.floor(Math.random() * 16)) })
}

export const base58ToUuid = (base58String: string): string => {
  const bytes = base58.parse(base58String)
  const uuid = v4({ random: bytes })
  return uuid
}
