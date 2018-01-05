import 'intl'

const EN_US_LOCALE = {
  "localeIdentifier":"en_US",
  "decimalSeparator":".",
  "quotationBeginDelimiterKey":"“",
  "quotationEndDelimiterKey":"”",
  "currencySymbol":"$",
  "currencyCode":"USD",
  "groupingSeparator":","
}
let locale = EN_US_LOCALE;

const intlHandler = {
  /**
   * Formats number according to user locale
   * @param number  - Native style (JS) number
   * @param options
   * @returns {string}
   */
  formatNumberInput(number, options) {
    if (typeof number === 'string') {
      if (number.slice(-1) === '.') {
        return number.replace('.', locale.decimalSeparator)
      }
    }
    return new Intl.NumberFormat(locale.localeIdentifier.replace('_', '-'), options).format(number)
  },

  /**
   * Should have same behaviour as UTILS.isValidInput
   * @param value
   * @returns {boolean}
   */
  isValidInput(value) {
    const {decimalSeparator, groupingSeparator} = locale
    const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g' )

    if (value === decimalSeparator) return true
    if (value === groupingSeparator || value.slice(-1) === groupingSeparator) return false
    let standartized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

    return !isNaN(+standartized)
  },

  /**
   * Should change UTILS.formatNumberInput
   * @param input
   */
  prettifyNumber(input) {
    let out = input.replace(/^0+/,'')
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
  truncateDecimals(input, precision, allowBlank = false) {
    const {decimalSeparator, groupingSeparator} = locale

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
   * @returns {boolean}
   */
  formatToNativeNumber(value, options) {
    const {decimalSeparator, groupingSeparator} = locale
    const groupingSeparatorRegExp = new RegExp('\\' + groupingSeparator, 'g' )

    if (value === decimalSeparator) return true
    let standartized = value.replace(groupingSeparatorRegExp, '').replace(decimalSeparator, '.')

    return standartized
  },

  formatDate(date, options) {
    throw new Error('Not implemented')
  },
}

export const setIntlLocale = (l) => {
  if (!locale) throw new Error('Please select locale for internationalization')
  locale = l
  return intlHandler
}

export default intlHandler
