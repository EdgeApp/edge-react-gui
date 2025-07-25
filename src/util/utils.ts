import { add, div, eq, gt, gte, lt, mul, toFixed } from 'biggystring'
import {
  EdgeCurrencyConfig,
  EdgeCurrencyInfo,
  EdgeDenomination,
  EdgePluginMap,
  EdgeToken,
  EdgeTokenMap,
  EdgeTransaction
} from 'edge-core-js'
import { Linking, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'
import { v4 } from 'uuid'

import {
  FEE_ALERT_THRESHOLD,
  FEE_COLOR_THRESHOLD,
  FIAT_CODES_SYMBOLS,
  FIAT_PRECISION,
  getFiatSymbol
} from '../constants/WalletAndCurrencyConstants'
import {
  toLocaleDate,
  toLocaleDateTime,
  toLocaleTime,
  truncateDecimalsPeriod
} from '../locales/intl'
import { lstrings } from '../locales/strings'
import { RootState } from '../types/reduxTypes'
import { GuiExchangeRates, GuiFiatType } from '../types/types'
import { getCurrencyCode, getTokenId } from './CurrencyInfoHelpers'
import { base58 } from './encoding'

export const DECIMAL_PRECISION = 18
export const DEFAULT_TRUNCATE_PRECISION = 6

export const normalizeForSearch = (str: string, delimiter: string = '') =>
  str.replace(/\s/g, delimiter).toLowerCase()

// Taken from pixkey.ts in edge-currency-accountbased
export const isEmail = (text: string) =>
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    text.toLowerCase()
  )

// Replaces extra chars with '...' either in the middle or end of the input string
export const truncateString = (
  input: string | number,
  maxLength: number,
  isMidTrunc: boolean = false
) => {
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
export const truncateDecimals = (
  input: string,
  precision: number = DEFAULT_TRUNCATE_PRECISION,
  allowBlank: boolean = false
): string => {
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

  return precision > 0
    ? `${integers}.${decimals.slice(0, precision)}`
    : integers
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

export const zeroString = (input?: string): boolean =>
  input == null || input === '' || eq(input, '0')

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

export const sanitizeDecimalAmount = (
  amount: string,
  maxEntryDecimals: number
): string => {
  // Replace all commas into periods
  amount = amount.replace(',', '.')

  // Remove characters except numbers and decimal separator
  amount = amount.replace(/[^0-9.]/g, '')

  // Trunctuate decimals to limited decimal entries, also remove additional periods
  return truncateDecimalsPeriod(amount, maxEntryDecimals)
}

export const removeHexPrefix = (s: string) => s.replace(/^0x/, '')

export const isHex = (h: string) => /^[0-9A-F]+$/i.test(h)

export const hexToDecimal = (num: string) => {
  const numberString = num.toLowerCase().startsWith('0x') ? num : `0x${num}`
  return add(numberString, '0', 10)
}

export const roundedFee = (
  nativeAmount: string,
  decimalPlacesBeyondLeadingZeros: number,
  multiplier: string
): string => {
  if (nativeAmount === '') return nativeAmount
  const displayAmount = div(nativeAmount, multiplier, DECIMAL_PRECISION)
  const precision =
    zerosAfterDecimal(displayAmount) + decimalPlacesBeyondLeadingZeros
  const truncatedAmount = truncateDecimals(displayAmount, precision)
  if (gt(displayAmount, truncatedAmount))
    return `${roundUpToLeastSignificant(truncatedAmount)} `
  return `${truncatedAmount} `
}

export const convertCurrencyFromExchangeRates = (
  exchangeRates: GuiExchangeRates,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  amount: string
): string => {
  const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
  const rate = exchangeRates[rateKey] ?? '0'
  const convertedAmount = mul(amount, rate)
  return convertedAmount
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

export const mulToPrecision = (multiplier: string): number =>
  multiplier.match(/0/g)?.length ?? DECIMAL_PRECISION

export const getNewArrayWithItem = (array: any[], item: any) =>
  !array.includes(item) ? [...array, item] : array

const restrictedCurrencyCodes = ['BTC']

export function getDenomFromIsoCode(currencyCode: string): EdgeDenomination {
  if (restrictedCurrencyCodes.findIndex(item => item === currencyCode) !== -1) {
    return {
      name: '',
      symbol: '',
      multiplier: '0'
    }
  }
  const symbol = getFiatSymbol(currencyCode)
  const denom: EdgeDenomination = {
    name: currencyCode,
    symbol,
    multiplier: '100'
  }
  return denom
}

export const getSupportedFiats = (
  defaultCurrencyCode?: string
): GuiFiatType[] => {
  const out: GuiFiatType[] = []
  if (
    defaultCurrencyCode != null &&
    FIAT_CODES_SYMBOLS[defaultCurrencyCode] != null
  ) {
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
export const calculateSpamThreshold = (
  rate: number,
  denom: EdgeDenomination
) => {
  if (rate === 0) return '0'
  return div(div(denom.multiplier, rate.toString()), '1000')
}

export interface PrecisionAdjustParams {
  exchangeSecondaryToPrimaryRatio: number
  secondaryExchangeMultiplier: string
  primaryExchangeMultiplier: string
}

export function precisionAdjust(params: PrecisionAdjustParams): number {
  const { exchangeSecondaryToPrimaryRatio } = params
  const order = Math.floor(
    Math.log(exchangeSecondaryToPrimaryRatio) / Math.LN10 + 0.000000001
  ) // because float math sucks like that
  const exchangeRateOrderOfMagnitude = Math.pow(10, order)
  if (isNaN(exchangeRateOrderOfMagnitude)) return 0

  // Get the exchange rate in tenth of pennies
  const exchangeRateString = mul(
    exchangeRateOrderOfMagnitude.toString(),
    mul(params.secondaryExchangeMultiplier, '10')
  )

  const precisionAdjust = div(
    exchangeRateString,
    params.primaryExchangeMultiplier,
    DECIMAL_PRECISION
  )

  if (lt(precisionAdjust, '1')) {
    const fPrecisionAdject = parseFloat(precisionAdjust)
    let order =
      2 + Math.floor(Math.log(fPrecisionAdject) / Math.LN10 - 0.000000001) // because float math sucks like that
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
export const monthsBetween = (startDate: Date, endDate: Date): number => {
  let months
  months = (endDate.getFullYear() - startDate.getFullYear()) * 12
  months += endDate.getMonth() - startDate.getMonth()

  // Adjust for days in the month
  if (endDate.getDate() < startDate.getDate()) {
    months--
  }

  return months <= 0 ? 0 : months
}

export async function runWithTimeout<T>(
  promise: Promise<T>,
  ms: number,
  error: Error = new Error(`Timeout of ${ms}ms exceeded`)
): Promise<T> {
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
export const getTotalFiatAmountFromExchangeRates = (
  state: RootState,
  isoFiatCurrencyCode: string
): string => {
  const log: string[] = ['', '']
  let total = '0'
  const { exchangeRates } = state
  for (const walletId of Object.keys(state.core.account.currencyWallets)) {
    const wallet = state.core.account.currencyWallets[walletId]
    log.push(
      `LogTot: pluginId:${
        wallet.currencyInfo.pluginId
      } wallet=${wallet.id.slice(0, 5)} isoFiat=${isoFiatCurrencyCode}`
    )
    for (const tokenId of wallet.balanceMap.keys()) {
      const nativeBalance = wallet.balanceMap.get(tokenId) ?? '0'
      const currencyCode = getCurrencyCode(wallet, tokenId)
      const rate =
        exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`] ?? '0'
      log.push(
        `\nLogTot: code=${currencyCode} rate=${rate} nb=${nativeBalance}`
      )

      // Find the currency or token info:
      let info: EdgeCurrencyInfo | EdgeToken = wallet.currencyInfo
      if (currencyCode !== wallet.currencyInfo.currencyCode) {
        const tokenId = getTokenId(wallet.currencyConfig, currencyCode)
        if (tokenId == null) {
          log.push(`LogTot: No tokenId for ${currencyCode}`)
          continue
        }
        info = wallet.currencyConfig.allTokens[tokenId]
      }
      const {
        denominations: [denomination]
      } = info
      log.push(
        `LogTot: mult=${denomination.multiplier} name=${denomination.name}`
      )

      // Do the conversion:
      const exchangeBalance = div(
        nativeBalance,
        denomination.multiplier,
        DECIMAL_PRECISION
      )
      const fiatBalance = mul(rate, exchangeBalance)
      const newTotal = add(total, fiatBalance)
      log.push(
        `LogTot: nativeBalance=${nativeBalance} / multiplier=${denomination.multiplier} => exchangeBalance=${exchangeBalance}`
      )
      log.push(
        `LogTot: rate=${rate} * exchangeBalance=${exchangeBalance} => fiatBalance=${fiatBalance}`
      )
      log.push(
        `LogTot: total=${total} + fiatBalance=${fiatBalance} => newTotal=${newTotal}`
      )
      total = newTotal
    }
  }

  if (total !== prevTotal) {
    // Use for troubleshooting incorrect balance issues. Disable for now as it's pretty noisy
    // console.warn(log.join('\n'))
  }
  prevTotal = total
  return total
}

type AsyncFunction = () => Promise<any>

export async function asyncWaterfall(
  asyncFuncs: AsyncFunction[],
  timeoutMs: number = 5000
): Promise<any> {
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

export function maxPrimaryCurrencyConversionDecimals(
  primaryPrecision: number,
  precisionAdjustValue: number
): number {
  const newPrimaryPrecision = primaryPrecision - precisionAdjustValue
  return newPrimaryPrecision >= 0 ? newPrimaryPrecision : 0
}

export const feeStyle = {
  danger: 'dangerText',
  warning: 'warningText'
}

export const convertTransactionFeeToDisplayFee = (
  currencyCode: string,
  isoFiatCurrencyCode: string,
  exchangeRates: GuiExchangeRates,
  transaction: EdgeTransaction | null,
  feeDisplayDenomination: EdgeDenomination,
  feeDefaultDenomination: EdgeDenomination
): {
  fiatSymbol?: string
  fiatAmount: string
  fiatStyle?: string
  cryptoSymbol?: string
  cryptoAmount: string
  nativeCryptoAmount: string
} => {
  const secondaryDisplayDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)

  let feeNativeAmount
  if (transaction?.parentNetworkFee != null) {
    feeNativeAmount = transaction?.parentNetworkFee
  } else if (transaction?.networkFee != null)
    feeNativeAmount = transaction?.networkFee

  if (feeNativeAmount != null && gt(feeNativeAmount, '0')) {
    const cryptoFeeSymbol =
      feeDisplayDenomination && feeDisplayDenomination.symbol
        ? feeDisplayDenomination.symbol
        : ''
    const displayMultiplier = feeDisplayDenomination
      ? feeDisplayDenomination.multiplier
      : ''
    const exchangeMultiplier = feeDefaultDenomination
      ? feeDefaultDenomination.multiplier
      : ''
    const cryptoFeeExchangeDenomAmount = feeNativeAmount
      ? convertNativeToDisplay(exchangeMultiplier)(feeNativeAmount)
      : ''
    const exchangeToDisplayMultiplierRatio = div(
      exchangeMultiplier,
      displayMultiplier,
      DECIMAL_PRECISION
    )
    const cryptoAmount = mul(
      cryptoFeeExchangeDenomAmount,
      exchangeToDisplayMultiplierRatio
    )
    const cryptoFeeExchangeAmount =
      convertNativeToExchange(exchangeMultiplier)(feeNativeAmount)
    const fiatFeeAmount = convertCurrencyFromExchangeRates(
      exchangeRates,
      currencyCode,
      isoFiatCurrencyCode,
      cryptoFeeExchangeAmount
    )
    const feeAmountInUSD = convertCurrencyFromExchangeRates(
      exchangeRates,
      currencyCode,
      'iso:USD',
      cryptoFeeExchangeAmount
    )
    const fiatAmount = {
      amount: toFixed(fiatFeeAmount, FIAT_PRECISION, FIAT_PRECISION),
      style:
        parseFloat(feeAmountInUSD) > FEE_ALERT_THRESHOLD
          ? feeStyle.danger
          : parseFloat(feeAmountInUSD) > FEE_COLOR_THRESHOLD
          ? feeStyle.warning
          : undefined
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

export function unixToLocaleDateTime(unixDate: number): {
  date: string
  time: string
  dateTime: string
} {
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
  if (elements.length === 2)
    return sprintf(lstrings.util_s_and_s, elements[0], elements[1])

  const firstPart = elements.slice(0, elements.length - 2)
  const lastPart = sprintf(
    lstrings.util_s_and_s,
    elements[elements.length - 2],
    elements[elements.length - 1]
  )
  return firstPart.join(', ') + `, ${lastPart}`
}

export interface MiniCurrencyConfig {
  allTokens: EdgeTokenMap
  currencyInfo: EdgeCurrencyInfo
}
export type CurrencyConfigMap =
  | EdgePluginMap<EdgeCurrencyConfig>
  | EdgePluginMap<MiniCurrencyConfig>

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

/**
 * Waits for a collection of promises.
 * Returns all the promises that manage to resolve within the timeout.
 * If no promises mange to resolve within the timeout,
 * returns the first promise that resolves.
 * If all promises reject, rejects an array of errors.
 */
export async function fuzzyTimeout<T>(
  promises: Array<Promise<T>>,
  timeoutMs: number
): Promise<T[]> {
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
    return (num / 1000000000).toFixed(2) + ' Bn'
  } else if (absNum >= 1000000) {
    return (num / 1000000).toFixed(2) + ' M'
  } else {
    return num.toString()
  }
}

export const consify = (arg: any) => console.log(JSON.stringify(arg, null, 2))
export const datelog = (...args: any) =>
  console.log(`${new Date().toISOString().slice(11, 23)}:`, args)

export const base58ToUuid = (base58String: string): string => {
  const bytes = base58.parse(base58String)
  const uuid = v4({ random: bytes })
  return uuid
}

/**
 * Darken a color by a scale factor.
 * @param hexColor of format '#1f1f1f1f'
 * @param scaleFactor 0-1 with 0 being black, 1 is unchanged
 * @returns darkened hex color string
 */
export const darkenHexColor = (
  hexColor: string,
  scaleFactor: number
): string => {
  if (scaleFactor < 0 || scaleFactor > 1)
    throw new Error('scaleFactor must be between 0-1')
  hexColor = hexColor.replace('#', '')

  // Check for short and long hexadecimal color codes
  if (hexColor.length === 3) {
    // Expand short color code (e.g., #abc to #aabbcc)
    hexColor = hexColor
      .split('')
      .map(char => char + char)
      .join('')
  } else if (hexColor.length !== 6) {
    throw new Error('Invalid hexadecimal color code')
  }

  // Parse the hexadecimal values
  const r = parseInt(hexColor.slice(0, 2), 16)
  const g = parseInt(hexColor.slice(2, 4), 16)
  const b = parseInt(hexColor.slice(4, 6), 16)

  // Multiply each color component by the scale factor
  const scaledR = Math.round(r * scaleFactor)
  const scaledG = Math.round(g * scaleFactor)
  const scaledB = Math.round(b * scaleFactor)

  // Convert the scaled values back to hexadecimal
  const scaledHexColor = `#${scaledR.toString(16).padStart(2, '0')}${scaledG
    .toString(16)
    .padStart(2, '0')}${scaledB.toString(16).padStart(2, '0')}`

  return scaledHexColor
}

/**
 * Reads and normalizes the OS version.
 */
export function getOsVersion(): string {
  const osVersionRaw = DeviceInfo.getSystemVersion()
  return Array.from(
    { length: 3 },
    (_, i) => osVersionRaw.split('.')[i] || '0'
  ).join('.')
}

export const removeIsoPrefix = (currencyCode: string): string => {
  return currencyCode.replace('iso:', '')
}

export const getDisplayUsername = (loginId: string, username?: string) => {
  return username == null
    ? sprintf(lstrings.guest_account_id_1s, loginId.slice(loginId.length - 3))
    : username
}
