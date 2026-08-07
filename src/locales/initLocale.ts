/**
 * GUI-only locale boot. Call once at app startup so locales/strings and
 * locales/intl stay free of react-native-localize module-load side effects.
 */
import { getLocales, getNumberFormatSettings } from 'react-native-localize'

import { setIntlLocale } from './intl'
import { selectLocale } from './strings'

const [firstLocale = { languageTag: 'en-US' }] = getLocales()
const { languageTag = 'en-US' } = firstLocale
if (languageTag !== 'en-US') selectLocale(languageTag)

const numberFormat = getNumberFormatSettings()
setIntlLocale({
  localeIdentifier: firstLocale.languageTag ?? 'en_US',
  ...numberFormat
})
