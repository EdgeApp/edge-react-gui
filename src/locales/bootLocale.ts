/**
 * Node-safe locale boot. Mutates `lstrings` and `intl.locale`.
 * GUI and CLI inject detection; this file must not import react-native.
 */
import { setIntlLocale } from './intl'
import { selectLocale } from './strings'

export interface LocaleSource {
  languageTag: string
  decimalSeparator: string
  groupingSeparator: string
}

export interface AppliedLocale extends LocaleSource {
  matched: boolean
}

const DEFAULT_LANGUAGE_TAG = 'en-US'

let applied: AppliedLocale = {
  languageTag: DEFAULT_LANGUAGE_TAG,
  decimalSeparator: '.',
  groupingSeparator: ',',
  matched: true
}

function isDefaultEnglish(tag: string): boolean {
  const compact = tag.replace(/[-_]/g, '').toLowerCase()
  return compact === 'enus' || compact === 'en'
}

/**
 * Apply language tables and number format. Call once at process start.
 */
export function applyLocale(source: LocaleSource): AppliedLocale {
  const languageTag =
    source.languageTag === '' ? DEFAULT_LANGUAGE_TAG : source.languageTag
  let matched = true
  if (!isDefaultEnglish(languageTag)) {
    matched = selectLocale(languageTag)
  }
  setIntlLocale({
    localeIdentifier: languageTag,
    decimalSeparator: source.decimalSeparator,
    groupingSeparator: source.groupingSeparator
  })
  applied = {
    languageTag,
    decimalSeparator: source.decimalSeparator,
    groupingSeparator: source.groupingSeparator,
    matched
  }
  return applied
}

export function getAppliedLocale(): AppliedLocale {
  return applied
}
