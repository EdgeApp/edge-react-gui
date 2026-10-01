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
    // Discarding the whole locale made `getLocaleOrDefaultString` resolve
    // info-server strings in English on such a device, where only number
    // formatting used to fall back.
    setIntlLocale({
      localeIdentifier: 'de_DE',
      decimalSeparator: '',
      groupingSeparator: ''
    })
    expect(getLocaleOrDefaultString(localized)).toBe('Deutsch')
    // And the number format really is the English one.
    expect(truncateDecimals('1.23456', 2)).toBe('1.23')
  })

  it('falls back entirely when the language itself is unusable', () => {
    setIntlLocale({
      localeIdentifier: '',
      decimalSeparator: ',',
      groupingSeparator: '.'
    })
    expect(getLocaleOrDefaultString(localized)).toBe('English')
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
