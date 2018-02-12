// @flow
import { toFixed } from 'biggystring'

const decimalSeparatorNative = '.'
const EN_US_LOCALE = {
  localeIdentifier: 'en_US',
  decimalSeparator: '.',
  quotationBeginDelimiterKey: '“',
  quotationEndDelimiterKey: '”',
  groupingSeparator: ','
}
let locale = EN_US_LOCALE

type IntlLocaleType = any
type IntlNumberFormatOptionsType = {
  toFixed?: number
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

    if (input.slice(-1) === '.') {
      return input.replace('.', locale.decimalSeparator)
    }
    if (input.includes(decimalSeparatorNative)) {
      const decimalPart = input.split(decimalSeparatorNative)[1]
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
    let stringify = String(number)
    if (options && options.toFixed) {
      stringify = toFixed(stringify, options.toFixed, options.toFixed)
    }
    return stringify.replace('.', locale.decimalSeparator)
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
    if (value === groupingSeparator || value.slice(-1) === groupingSeparator) return false
    const standartized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

    return !isNaN(+standartized)
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
    const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g')
    const standartized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

    return standartized
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
