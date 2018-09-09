// @flow

import DeviceInfo from 'react-native-device-info'

import en from './en_US'

const allLocales = { en }

// Set default of US English
const out = { strings: en }
selectLocale(DeviceInfo.getDeviceLocale())

// Locale formats can be in the form 'en', 'en-US', 'en_US', or 'enUS'
export function selectLocale (locale: string = 'en'): boolean {
  // Break up local into language and region
  const normalizedLocale = locale
    .replace('-', '')
    .replace('-', '')
    .replace('_', '')
  let choice = null

  // Find exact match
  if (allLocales[normalizedLocale] !== undefined) {
    choice = allLocales[normalizedLocale]
  } else {
    // Match a match to a language with no dialect
    const language = normalizedLocale.substr(0, 2)

    choice = findLocale(language, false)

    if (!choice) {
      choice = findLocale(language, true)
    }
  }

  if (choice) {
    out.strings = Object.assign(en, choice)
  }

  return !!choice
}

// If region === false, then only match if locale has no region
// Otherwise match the first matching language
function findLocale (language: string, region: boolean) {
  console.log('Device: findLocale')
  for (const locale in allLocales) {
    if (allLocales.hasOwnProperty(locale)) {
      const localeLang = locale.substr(0, 2)
      const localeRegion = locale.substr(2)
      if (localeLang === language) {
        if (region === true) {
          return allLocales[locale]
        } else {
          if (!localeRegion) {
            return allLocales[locale]
          }
        }
      }
    }
  }
  return null
}

export default out
