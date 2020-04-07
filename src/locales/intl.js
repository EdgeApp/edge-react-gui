// @flow

import { toFixed } from 'biggystring'

const EN_US_LOCALE = {
  localeIdentifier: 'en_US',
  decimalSeparator: '.',
  quotationBeginDelimiterKey: '“',
  quotationEndDelimiterKey: '”',
  groupingSeparator: ','
}
const NATIVE_DECIMAL_SEPARATOR = '.'
const NUMBER_GROUP_SIZE = 3
let locale = EN_US_LOCALE

type IntlLocaleType = any
type IntlNumberFormatOptionsType = {
  toFixed?: number,
  noGrouping?: boolean
}

const intlHandler = {
  /**
   * Formats number input according to user locale
   * Allows decimalSeparator at the end of string
   * @param input {string} - Native style (JS) number
   * @param options
   * @returns {string}
   */
  formatNumberInput (input: string, options?: IntlNumberFormatOptionsType): string {
    const _options = {}

    if (input.endsWith('.') || input.endsWith(',')) {
      return intlHandler.formatNumber(input.slice(0, -1)) + locale.decimalSeparator
    }
    if (input.includes(NATIVE_DECIMAL_SEPARATOR)) {
      const decimalPart = input.split(NATIVE_DECIMAL_SEPARATOR)[1]
      if (decimalPart) {
        _options.toFixed = decimalPart.length
      }
    }
    Object.assign(_options, options)
    return intlHandler.formatNumber(input, _options)
  },

  /**
   * Formats number according to user locale
   * @param number
   * @param options
   * @return {string}
   */
  formatNumber (number: number | string, options?: IntlNumberFormatOptionsType): string {
    let i
    let intPart
    let stringify = String(number)
    if (options && options.toFixed) {
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
  },

  /**
   * Should have same behaviour as UTILS.isValidInput
   * @param value
   * @returns {boolean}
   */
  isValidInput (value: string): boolean {
    const { decimalSeparator, groupingSeparator } = locale
    const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g')

    if (value === decimalSeparator) return true
    if (value.endsWith('.') || value.endsWith(',')) {
      value = value.slice(0, -1) + locale.decimalSeparator
    }

    // if (value === groupingSeparator || value.slice(-1) === groupingSeparator) return false
    const standardized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

    return !isNaN(+standardized)
  },

  /**
   * Should change UTILS.formatNumberInput
   * @param input
   */
  prettifyNumber (input: string): string {
    let out = input.replace(/^0+/, '')
    if (out.startsWith(locale.decimalSeparator)) {
      out = '0' + out
    }
    return out
  },

  /**
   * Should change UTILS.truncateDecimals
   * @param input
   * @param precision
   * @param allowBlank
   * @returns {string}
   */
  truncateDecimals (input: string, precision?: number, allowBlank?: boolean = false): string {
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
  },

  /**
   * Converts internationalized number to Native (JS) presentation
   * @param value
   * @param options
   * @returns {string}
   */
  formatToNativeNumber (value: string, options?: IntlNumberFormatOptionsType): string {
    const { decimalSeparator, groupingSeparator } = locale
    if (value.endsWith('.') || value.endsWith(',')) {
      value = value.slice(0, -1) + locale.decimalSeparator
    }
    const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g')
    const standardized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

    return standardized
  },

  /**
   * Returns date string depending on locale
   * @param expiration
   * @param monthShort
   * @returns {string}
   */
  formatExpDate (expiration: Date | string, monthShort?: boolean = false): string {
    const expirationDate = new Date(expiration)

    return new Intl.DateTimeFormat(locale.localeIdentifier.replace('_', '-'), {
      dateStyle: monthShort ? 'medium' : 'long'
    }).format(expirationDate)
  },

  /**
   * Returns time string depending on locale
   * @param date
   * @returns {string}
   */
  formatTime (date: Date): string {
    return new Intl.DateTimeFormat(locale.localeIdentifier.replace('_', '-'), {
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(date))
  },

  // $FlowFixMe: add after implementation
  formatDate (date, options) {
    throw new Error('Not implemented')
  }
}

export const setIntlLocale = (l: IntlLocaleType) => {
  if (!l) throw new Error('Please select locale for internationalization')

  if (!l.decimalSeparator || !l.groupingSeparator || !l.localeIdentifier) {
    console.warn('Cannot recognize user locale preferences. Default will be used.')
    locale = EN_US_LOCALE
  } else {
    locale = l
  }
  return intlHandler
}
export { intlHandler as intl }
