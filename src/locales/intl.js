// @flow
/* global Intl */
import 'intl'
import areIntlLocalesSupported from 'intl-locales-supported'

// Polyfills for Android. Now support only these locales. en-US is fallback
import 'intl/locale-data/jsonp/en-US'
import 'intl/locale-data/jsonp/de-DE'
import 'intl/locale-data/jsonp/ru-RU'

const decimalSeparatorNative = '.'
const EN_US_LOCALE = {
  'localeIdentifier': 'en_US',
  'decimalSeparator': '.',
  'quotationBeginDelimiterKey': '“',
  'quotationEndDelimiterKey': '”',
  'groupingSeparator': ','
}
let locale = EN_US_LOCALE

declare var Intl: any;

type IntlLocaleType = any;
type IntlNumberFormatOptionsType = {
  toFixed?: number,
  localeMatcher?: 'lookup' | 'best fit',
  style?: 'decimal' | 'currency' | 'percent',
  currency?: string,
  currencyDisplay?: string,
  useGrouping?: boolean,
  minimumIntegerDigits?: number,
  minimumFractionDigits?: number,
  maximumFractionDigits?: number,
  minimumSignificantDigits?: number,
  maximumSignificantDigits?: number,
};

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
    const _options = {}
    if (options && options.toFixed) {
      _options.minimumFractionDigits = options.toFixed
      _options.maximumFractionDigits = options.toFixed
    }
    Object.assign(_options, options)
    return new Intl.NumberFormat(locale.localeIdentifier.replace('_', '-'), _options).format(number)
  },

  /**
   * Should have same behaviour as UTILS.isValidInput
   * @param value
   * @returns {boolean}
   */
  isValidInput (value: string): boolean {
    const {decimalSeparator, groupingSeparator} = locale
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
    const {decimalSeparator} = locale

    if (input === '') {
      if (allowBlank) {
        input = ''
      } else {
        input = '0'
      }
    }

    if (!input.includes(decimalSeparator)) { return input }
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
    const {decimalSeparator, groupingSeparator} = locale
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
  if (!locale) throw new Error('Please select locale for internationalization')
  const localeIdentifier = l.localeIdentifier.replace('_', '-')

  if (!areIntlLocalesSupported(localeIdentifier)) {
    locale = EN_US_LOCALE
  } else {
    locale = l
  }
  return intlHandler
}
export { intlHandler as intl }
