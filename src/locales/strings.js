// @flow

import DeviceInfo from 'react-native-device-info'

import en from './en_US'
import es from './strings/es.json'
import it from './strings/it.json'
import ja from './strings/ja.json'
import pt from './strings/pt.json'
import ru from './strings/ru.json'

const allLocales = { en, ru, es, it, pt, ja }

const strings: { [stringCode: string]: string } = {}
const out = { strings }

selectLocale(DeviceInfo.getDeviceLocale())

function mergeStrings (primary: Object, secondary: Object) {
  for (const str in secondary) {
    if (secondary.hasOwnProperty(str)) {
      if (secondary[str]) {
        primary[str] = secondary[str]
      }
    }
  }
}

// Locale formats can be in the form 'en', 'en-US', 'en_US', or 'enUS'
export function selectLocale (locale: string = 'en'): boolean {
  // Break up local into language and region
  const normalizedLocale = locale
    .replace('-', '')
    .replace('-', '')
    .replace('_', '')

  let found = false
  const lang = normalizedLocale.slice(0, 2)

  // Set default of US English
  mergeStrings(out.strings, en)

  if (locale === 'en') return true

  // Find pure language match first (ie. find 'es' when 'esMX' is chosen)
  if (allLocales[lang] !== undefined) {
    found = true
    mergeStrings(out.strings, allLocales[lang])
  }

  // Find an exact match
  if (allLocales[normalizedLocale] !== undefined) {
    found = true
    mergeStrings(out.strings, allLocales[normalizedLocale])
  }

  return found
}

export default out
