// @flow

import { toFixed } from 'biggystring'
import { format } from 'date-fns'
import { getLocales, getNumberFormatSettings } from 'react-native-localize'

import { locales } from './dateLocales'

export type IntlLocaleType = {
  localeIdentifier: string, // Like en_US or en-US
  decimalSeparator: string,
  groupingSeparator: string
}

type IntlNumberFormatOptionsType = {
  toFixed?: number,
  noGrouping?: boolean
}

const EN_US_LOCALE: IntlLocaleType = {
  localeIdentifier: 'en_US',
  decimalSeparator: '.',
  groupingSeparator: ','
}
const NATIVE_DECIMAL_SEPARATOR = '.'
const NUMBER_GROUP_SIZE = 3
let locale = EN_US_LOCALE

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
export function formatNumberInput(input: string, options?: IntlNumberFormatOptionsType): string {
  const _options = {}

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
export function formatNumber(number: number | string, options?: IntlNumberFormatOptionsType): string {
  let i
  let intPart
  let stringify = String(number)
  if (options && options.toFixed != null) {
    stringify = toFixed(stringify, options.toFixed, options.toFixed)
  }
  const [integers, decimals] = stringify.split(NATIVE_DECIMAL_SEPARATOR)
  const len = integers.length
  if (!options || !options.noGrouping) {
    i = len % NUMBER_GROUP_SIZE || NUMBER_GROUP_SIZE
    intPart = integers.substr(0, i)
    for (; i < len; i += NUMBER_GROUP_SIZE) {
      intPart += locale.groupingSeparator + integers.substr(i, NUMBER_GROUP_SIZE)
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
  const standardized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

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
export function truncateDecimalsPeriod(input: string, precision?: number, allowBlank?: boolean = false): string {
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
export function truncateDecimals(input: string, precision?: number, allowBlank?: boolean = false): string {
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
  return `${integers}${decimalSeparator}${decimals.slice(0, precision)}`
}

/**
 * Converts internationalized number to Native (JS) presentation
 * @param value
 * @param options
 * @returns {string}
 */
export function formatToNativeNumber(value: string, options?: IntlNumberFormatOptionsType): string {
  const { decimalSeparator, groupingSeparator } = locale
  if (value.endsWith('.') || value.endsWith(',')) {
    value = value.slice(0, -1) + locale.decimalSeparator
  }
  const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g')
  const standardized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

  return standardized
}

/**
 * Returns date string depending on locale
 */
export function formatDate(date: Date, monthShort: boolean = false): string {
  try {
    return format(date, monthShort ? 'PP' : 'PPP', { locale: locales[locale.localeIdentifier.replace('_', '-')] })
  } catch (e) {
    //
  }
  return format(date, 'MMM d, yyyy')
}

/**
 * Returns h:mm am/pm time string depending on locale
 */
export function formatTime(date: Date): string {
  try {
    return format(date, 'p', { locale: locales[locale.localeIdentifier.replace('_', '-')] })
  } catch (e) {
    //
  }
  return format(date, 'h:mm bb')
}

/**
 * Returns 'h:mm am/pm, date' string depending on locale.
 */
export function formatTimeDate(date: Date, monthShort: boolean = false): string {
  return `${formatTime(date)}, ${formatDate(date, monthShort)}`
}

export function setIntlLocale(l: IntlLocaleType): void {
  if (!l) throw new Error('Please select locale for internationalization')

  if (!l.decimalSeparator || !l.groupingSeparator || !l.localeIdentifier) {
    console.warn('Cannot recognize user locale preferences. Default will be used.')
    locale = EN_US_LOCALE
  } else {
    locale = l
  }
}

export function toLocaleDate(date: Date): string {
  return format(date, 'MMM d, yyyy')
}

export function toLocaleTime(date: Date): string {
  return format(date, 'h:mm aa')
}

export function toLocaleDateTime(date: Date): string {
  return toLocaleDate(date) + ' ' + toLocaleTime(date)
}
