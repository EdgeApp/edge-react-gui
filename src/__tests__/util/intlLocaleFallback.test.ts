import { describe, expect, it } from '@jest/globals'

import {
  getLocaleOrDefaultString,
  setIntlLocale,
  truncateDecimals
} from '../../locales/intl'

const localized = { de: 'Deutsch', en: 'English' }

describe('setIntlLocale', () => {
  it('keeps the language when only the number format is unusable', () => {
    // An OS that reports an empty separator says nothing about the language.
    // Discarding the whole locale would make `getLocaleOrDefaultString`
    // resolve info-server strings in English on such a device, where only
    // number formatting should fall back.
    setIntlLocale({
      localeIdentifier: 'de_DE',
      decimalSeparator: '',
      groupingSeparator: ''
    })
    expect(getLocaleOrDefaultString(localized)).toBe('Deutsch')
    // And the number format really is the English one.
    expect(truncateDecimals('1.23456', 2)).toBe('1.23')
  })

  it('keeps the number format when only the language is unusable', () => {
    // The other half of the same rule: an unusable language says nothing
    // about the separators the OS reported perfectly well, and assigning the
    // whole English locale would throw a working comma-decimal pair away.
    setIntlLocale({
      localeIdentifier: '',
      decimalSeparator: ',',
      groupingSeparator: '.'
    })
    expect(getLocaleOrDefaultString(localized)).toBe('English')
    expect(truncateDecimals('1,23456', 2)).toBe('1,23')
  })

  it('repairs a locale that is empty in all three fields', () => {
    // The likeliest shape, since one failed read of the OS locale usually
    // fails all of them. Installing the empty separators would make
    // `formatNumber(1234.56)` answer `123456` and `isValidInput` throw
    // `SyntaxError: Invalid regular expression`.
    const installed = setIntlLocale({
      localeIdentifier: '',
      decimalSeparator: '',
      groupingSeparator: ''
    })
    expect(installed.decimalSeparator).toBe('.')
    expect(installed.groupingSeparator).toBe(',')
    expect(installed.localeIdentifier).toBe('en_US')
    expect(getLocaleOrDefaultString(localized)).toBe('English')
    expect(truncateDecimals('1.23456', 2)).toBe('1.23')
  })

  it('takes a complete locale as given', () => {
    setIntlLocale({
      localeIdentifier: 'de_DE',
      decimalSeparator: ',',
      groupingSeparator: '.'
    })
    expect(getLocaleOrDefaultString(localized)).toBe('Deutsch')
  })
})
