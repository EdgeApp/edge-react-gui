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

let hasApplied = false
/**
 * The last source `applyLocale` was given, for the idempotence test.
 *
 * Separate from `applied`, which records what was *installed*: a source
 * whose separators are empty installs the English marks, so comparing the
 * next source against `applied` would never match and every call would
 * re-merge the language tables.
 */
let lastSource: LocaleSource | undefined
let applied: AppliedLocale = {
  languageTag: DEFAULT_LANGUAGE_TAG,
  decimalSeparator: '.',
  groupingSeparator: ',',
  matched: true
}

/**
 * Apply language tables and number format. Call once at process start.
 *
 * Idempotent, in both senses it needs to be. A repeat with the same source
 * is free — both `index.ts` and `src/app.ts` import the GUI's boot module,
 * and the module cache makes that one evaluation — and a call with a
 * *different* tag answers for that tag alone, because `selectLocale`
 * re-seeds `lstrings` from English before merging. `mergeStrings` only
 * writes the keys its own table has a value for, so without the re-seed
 * `fr-FR` then `de-DE` would leave every key `de.json` has a gap in reading
 * French, and `en-US` could never restore English at all.
 */
export function applyLocale(source: LocaleSource): AppliedLocale {
  const languageTag =
    source.languageTag === '' ? DEFAULT_LANGUAGE_TAG : source.languageTag
  if (
    hasApplied &&
    lastSource != null &&
    applied.languageTag === languageTag &&
    lastSource.decimalSeparator === source.decimalSeparator &&
    lastSource.groupingSeparator === source.groupingSeparator
  ) {
    return applied
  }
  hasApplied = true
  lastSource = { ...source, languageTag }
  // `selectLocale` for English too: its re-seed is what undoes the previous
  // tag's merge, so skipping it would make English the one language a
  // second call could not switch back to.
  const matched = selectLocale(languageTag)
  // What `setIntlLocale` installed, not what was asked for. It substitutes
  // the English marks when either separator is empty — which is the case an
  // OS reporting no separator is handled by — so storing `source`'s values
  // would make `getAppliedLocale()` answer `decimalSeparator: ''` while
  // `intl.locale` says `'.'`. All four fields record what was really done,
  // as `matched` records what `selectLocale` did.
  const installed = setIntlLocale({
    localeIdentifier: languageTag,
    decimalSeparator: source.decimalSeparator,
    groupingSeparator: source.groupingSeparator
  })
  applied = {
    languageTag,
    decimalSeparator: installed.decimalSeparator,
    groupingSeparator: installed.groupingSeparator,
    matched
  }
  return applied
}

export function getAppliedLocale(): AppliedLocale {
  return applied
}
