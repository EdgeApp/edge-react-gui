// @flow

import { getLocales } from 'react-native-localize'

import en from './en_US'
import es from './strings/es.json'
import fr from './strings/fr.json'
import it from './strings/it.json'
import ja from './strings/ja.json'
import ko from './strings/ko.json'
import pt from './strings/pt.json'
import ru from './strings/ru.json'
import vi from './strings/vi.json'
import zh from './strings/zh.json'

const allLocales = { en, ru, es, it, pt, ja, fr, ko, vi, zh }

const strings: typeof en = { ...en }
const out = { strings }

// Set the language at boot:
const [firstLocale = { languageTag: 'en_US' }] = getLocales()
selectLocale(firstLocale.languageTag)

function mergeStrings(primary: { [key: string]: string }, secondary: { [key: string]: string }) {
  for (const str of Object.keys(secondary)) {
    if (secondary[str]) {
      primary[str] = secondary[str]
    }
  }
}

// Locale formats can be in the form 'en', 'en-US', 'en_US', or 'enUS'
export function selectLocale(locale: string = 'en'): boolean {
  // Break up local into language and region
  const normalizedLocale = locale.replace('-', '').replace('-', '').replace('_', '')

  let found = false
  const lang = normalizedLocale.slice(0, 2)

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
