/**
 * GUI-only locale boot. Call once at app startup so locales/strings and
 * locales/intl stay free of react-native-localize module-load side effects.
 */
import { getLocales, getNumberFormatSettings } from 'react-native-localize'

import { applyLocale } from './bootLocale'

const [firstLocale = { languageTag: 'en-US' }] = getLocales()
const { languageTag = 'en-US' } = firstLocale
const numberFormat = getNumberFormatSettings()
applyLocale({
  languageTag,
  decimalSeparator: numberFormat.decimalSeparator,
  groupingSeparator: numberFormat.groupingSeparator
})
