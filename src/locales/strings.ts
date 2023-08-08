import { getLocales } from 'react-native-localize'

import en from './en_US'
import de from './strings/de.json'
import es from './strings/es.json'
import esMX from './strings/esMX.json' // Requires Crowdin %two_letters_code% override
import fr from './strings/fr.json'
import it from './strings/it.json'
import ja from './strings/ja.json'
import ko from './strings/ko.json'
import pt from './strings/pt.json'
import ru from './strings/ru.json'
import vi from './strings/vi.json'
import zh from './strings/zh.json'

const allLocales = { en, de, ru, es, esMX, it, pt, ja, fr, ko, vi, zh }

export const lstrings = { ...en }

// Set the language at boot:
const [firstLocale] = getLocales()
const { languageTag = 'en-US' } = firstLocale ?? {}
if (languageTag !== 'en-US') selectLocale(languageTag)

function mergeStrings(primary: { [key: string]: string }, secondary: { [key: string]: string }) {
  for (const str of Object.keys(secondary)) {
    if (secondary[str] !== '') {
      primary[str] = secondary[str]
    }
  }
}

// Locale formats can be in the form 'en', 'en-US', 'en_US', or 'enUS'
export function selectLocale(locale: string): boolean {
  // Break up local into language and region
  const normalizedLocale = locale.replace('-', '').replace('-', '').replace('_', '')

  // Find an exact match
  const exactMatch = allLocales[normalizedLocale as keyof typeof allLocales]
  if (exactMatch != null) {
    mergeStrings(lstrings, exactMatch)
    return true
  }

  const lang = normalizedLocale.slice(0, 2)

  // Find pure language match first (ie. find 'es' when 'esMX' is chosen)
  const shortMatch = allLocales[lang as keyof typeof allLocales]
  if (shortMatch != null) {
    mergeStrings(lstrings, shortMatch)
    return true
  }

  return false
}
