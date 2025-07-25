import { gt, mul, toBns, toFixed } from 'biggystring'
import { asMaybe } from 'cleaners'
import { format } from 'date-fns'
import { getLocales, getNumberFormatSettings } from 'react-native-localize'

import { asBiggystring } from '../util/cleaners'
import { locales } from './dateLocales'

export interface IntlLocaleType {
  localeIdentifier: string // Like en_US or en-US
  decimalSeparator: string
  groupingSeparator: string
}

interface IntlNumberFormatOptionsType {
  toFixed?: number
  maxDecimals?: number
  minDecimals?: number
  noGrouping?: boolean
}

export const EN_US_LOCALE: IntlLocaleType = {
  localeIdentifier: 'en_US',
  decimalSeparator: '.',
  groupingSeparator: ','
}

export const DEFAULT_LOCALE_ID = EN_US_LOCALE.localeIdentifier

const DEFAULT_DATE_FMT: string = 'PPP' // April 29th, 1453
export const SHORT_DATE_FMT: string = 'PP' // Apr 29, 1453

const NATIVE_DECIMAL_SEPARATOR = '.'
const NUMBER_GROUP_SIZE = 3
export const locale: IntlLocaleType = { ...EN_US_LOCALE }

// Set the locale at boot:
const [firstLocale = { languageTag: 'en_US' }] = getLocales()
const numberFormat = getNumberFormatSettings()
setIntlLocale({ localeIdentifier: firstLocale.languageTag, ...numberFormat })

/**
 * Formats number input according to user locale
 * Allows decimalSeparator at the end of string
 * @param input {string} - Native style (JS) number
 * @param options
 * @returns {string}
 */
export function formatNumberInput(
  input: string,
  options?: IntlNumberFormatOptionsType
): string {
  const _options: IntlNumberFormatOptionsType = {}

  if (typeof input !== 'string') {
    console.error('no string')
  }
  if (input.endsWith('.') || input.endsWith(',')) {
    return formatNumber(input.slice(0, -1)) + locale.decimalSeparator
  }
  if (input.includes(NATIVE_DECIMAL_SEPARATOR)) {
    const decimalPart = input.split(NATIVE_DECIMAL_SEPARATOR)[1]
    if (decimalPart) {
      _options.toFixed = decimalPart.length
    }
  }
  Object.assign(_options, options)
  return formatNumber(input, _options)
}

/**
 * Formats number according to user locale
 * @param number
 * @param options
 * @return {string}
 */
export function formatNumber(
  number: number | string,
  options: IntlNumberFormatOptionsType = {}
): string {
  let i
  let intPart
  let stringify = toBns(number)
  const { toFixed: toFixedVal } = options
  const { minDecimals = toFixedVal ?? 0, maxDecimals = toFixedVal ?? 99 } =
    options

  if (options.minDecimals != null || options.maxDecimals != null) {
    stringify = toFixed(stringify, minDecimals, maxDecimals)
  } else if (options.toFixed != null) {
    stringify = toFixed(stringify, options.toFixed, options.toFixed)
  }
  const [integers, decimals] = stringify.split(NATIVE_DECIMAL_SEPARATOR)
  const len = integers.length
  if (!options || !options.noGrouping) {
    i = len % NUMBER_GROUP_SIZE || NUMBER_GROUP_SIZE
    intPart = integers.substr(0, i)
    for (; i < len; i += NUMBER_GROUP_SIZE) {
      intPart +=
        locale.groupingSeparator + integers.substr(i, NUMBER_GROUP_SIZE)
    }
  } else {
    intPart = integers
  }
  stringify = decimals ? intPart + locale.decimalSeparator + decimals : intPart
  return stringify
}

/**
 * Should have same behaviour as UTILS.isValidInput
 * @param value
 * @returns {boolean}
 */
export function isValidInput(value: string): boolean {
  const { decimalSeparator, groupingSeparator } = locale
  const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g')

  if (value === decimalSeparator) return true
  if (value.endsWith('.') || value.endsWith(',')) {
    value = value.slice(0, -1) + locale.decimalSeparator
  }

  // if (value === groupingSeparator || value.slice(-1) === groupingSeparator) return false
  const standardized = value
    .replace(groupingSeparatorRegExp, '')
    .replace(decimalSeparator, '.')

  return !isNaN(+standardized)
}

/**
 * Should change UTILS.formatNumberInput
 * @param input
 */
export function prettifyNumber(input: string): string {
  input = input.replace(/^0+/, '')
  if (input.startsWith('.')) {
    input = '0' + input
  }
  if (input === '') {
    return '0'
  }
  return input
}

/**
 * Should change UTILS.truncateDecimals
 * @param input
 * @param precision
 * @param allowBlank
 * @returns {string}
 */
export function truncateDecimalsPeriod(
  input: string,
  precision?: number,
  allowBlank: boolean = false
): string {
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
  return `${integers}.${decimals.slice(0, precision)}`
}

/**
 * Should change UTILS.truncateDecimals
 * @param input
 * @param precision
 * @param allowBlank
 * @returns {string}
 */
export function truncateDecimals(
  input: string,
  precision?: number,
  allowBlank: boolean = false
): string {
  const { decimalSeparator } = locale

  if (input === '') {
    if (allowBlank) {
      input = ''
    } else {
      input = '0'
    }
  }

  if (!input.includes(decimalSeparator)) {
    return input
  }
  const [integers, decimals] = input.split(decimalSeparator)
  return `${integers}${precision !== 0 ? decimalSeparator : ''}${decimals.slice(
    0,
    precision
  )}`
}

/**
 * Converts internationalized number to Native (JS) presentation
 * @param value
 * @param options
 * @returns {string}
 */
export function formatToNativeNumber(
  value: string,
  options?: IntlNumberFormatOptionsType
): string {
  const { decimalSeparator, groupingSeparator } = locale
  if (value.endsWith('.') || value.endsWith(',')) {
    value = value.slice(0, -1) + locale.decimalSeparator
  }
  const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g')
  const standardized = value
    .replace(groupingSeparatorRegExp, '')
    .replace(decimalSeparator, '.')

  return standardized
}

/**
 * Returns date string depending on locale
 */
export function formatDate(
  date: Date,
  dateFormat: string = DEFAULT_DATE_FMT
): string {
  const { localeIdentifier } = locale

  try {
    // TODO: Determine the purpose of this replace() and mapping...
    const dateFormattingLocale =
      // @ts-expect-error
      locales[localeIdentifier.replace('_', '-')] ??
      // @ts-expect-error
      locales[localeIdentifier.split('-')?.[0]]
    return format(date, dateFormat, { locale: dateFormattingLocale })
  } catch (e: any) {
    //
  }
  return format(date, DEFAULT_DATE_FMT)
}

/**
 * Returns h:mm am/pm time string depending on locale
 */
export function formatTime(date: Date): string {
  const { localeIdentifier } = locale

  try {
    return format(date, 'p', {
      // @ts-expect-error
      locale: locales[localeIdentifier.replace('_', '-')]
    })
  } catch (e: any) {
    //
  }
  return format(date, 'h:mm bb')
}

/**
 * Returns 'h:mm am/pm, date' string depending on locale.
 */
export function formatTimeDate(date: Date, dateFormat?: string): string {
  return `${formatTime(date)}, ${formatDate(date, dateFormat)}`
}

export function setIntlLocale(l: IntlLocaleType): void {
  if (!l) throw new Error('Please select locale for internationalization')

  if (!l.decimalSeparator || !l.groupingSeparator || !l.localeIdentifier) {
    console.warn(
      'Cannot recognize user locale preferences. Default will be used.'
    )
    Object.assign(locale, EN_US_LOCALE)
  } else {
    Object.assign(locale, l)
  }
}

export function toLocaleDate(date: Date): string {
  return formatDate(date, SHORT_DATE_FMT)
}

export function toLocaleTime(date: Date): string {
  return format(date, 'h:mm aa')
}

export function toLocaleDateTime(date: Date): string {
  return formatDate(date, SHORT_DATE_FMT) + ' ' + toLocaleTime(date)
}

// Remove starting and trailing zeros and separator
export const trimEnd = (val: string): string => {
  const _ = locale.decimalSeparator
  if (!val.includes(_)) return val
  const [int, decimal] = val.split(_)

  let out = int
  for (let i = decimal.length - 1; i >= 0; i--) {
    if (decimal[i] !== '0') {
      out += _ + decimal.substring(0, i + 1)
      break
    }
  }
  return out
}

/**
 * Return a formatted percent string based on a number or string that is < 1.0
 * and greater than -1.0
 **/
export const toPercentString = (
  ratio: string | number,
  opts?: {
    intlOpts?: IntlNumberFormatOptionsType
    maxPrecision?: number
    minPrecision?: number
    plusSign?: boolean
  }
): string => {
  const {
    maxPrecision = 1,
    minPrecision = 0,
    intlOpts,
    plusSign = false
  } = opts ?? {}

  const ratioStr = asMaybe(asBiggystring)(String(ratio))
  if (ratioStr == null) return ''

  const percentString = mul('100', ratioStr)
  const signStr = plusSign && gt(percentString, '0') ? '+' : ''
  return `${signStr}${formatNumber(
    toFixed(percentString, minPrecision, maxPrecision),
    intlOpts
  )}%`
}

const normalizeLang = (l: string) =>
  l.replace('-', '').replace('_', '').toLowerCase()

/** Given a language code, ie 'en_US', 'en-US', 'en-us', 'en'. Pick the language
 * that closest matches
 */
export const pickLanguage = (
  lang: string,
  languages: string[]
): string | undefined => {
  const match = languages.find(l => normalizeLang(l) === normalizeLang(lang))
  if (match != null) return match

  const normalizedMatch = languages.find(
    l => normalizeLang(l.slice(0, 2)) === normalizeLang(lang.slice(0, 2))
  )

  return normalizedMatch
}

/**
 * Picks either a localized string or uses whatever is defined under 'en_US' (or
 * similar tag) as the fallback default string
 */
export const getLocaleOrDefaultString = (localizedStrings: {
  [localeId: string]: string
}): string | undefined => {
  const [firstLocale = { languageTag: DEFAULT_LOCALE_ID }] = getLocales()
  const { languageTag } = firstLocale
  const localizedStringKeys = Object.keys(localizedStrings)

  let localeId = pickLanguage(languageTag, localizedStringKeys)
  if (localeId == null && languageTag !== DEFAULT_LOCALE_ID) {
    // Fallback to the default locale if we aren't already on it
    localeId = pickLanguage(DEFAULT_LOCALE_ID, localizedStringKeys)
  }

  if (localeId == null) {
    console.error(
      'Could not find a string match for the default locale: ',
      DEFAULT_LOCALE_ID
    )
  } else {
    return localizedStrings[localeId]
  }
}
