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

export const lstrings = { ...en } as const
export type LStrings = typeof lstrings
export type LStringsKey = keyof LStrings
export type LStringsValues = LStrings[LStringsKey]

function mergeStrings(
  primary: Record<string, string>,
  secondary: Record<string, string>
) {
  for (const str of Object.keys(secondary)) {
    if (secondary[str] !== '') {
      primary[str] = secondary[str]
    }
  }
}

/** The locale keys, indexed by their lower-cased spelling. */
const LOCALE_KEYS_BY_LOWER = new Map(
  Object.keys(allLocales).map(key => [key.toLowerCase(), key])
)

/**
 * The table a locale tag selects, or undefined when none does.
 *
 * Exported because the *table* is what decides what a user sees, and two
 * tags that select the same one are the same choice: `en` and `en-US` both
 * answer in English, `de` and `de-DE` both merge `de.json`. The
 * engine-locale mismatch warning compared tags, so it fired once per command
 * for the life of an engine about a difference with no effect — which is
 * what a container or CI shell setting a bare `LANG=en` produces.
 *
 * Locale tags arrive as 'en', 'en-US', 'en_US' or 'enUS'.
 *
 * Case-insensitively, because BCP 47 is: RFC 5646 §2.1.1 says "the tag is to
 * be treated as case-insensitive", `Intl.NumberFormat` treats it that way,
 * and the three new CLI inputs for it — `--locale`, `EDGE_CLI_LOCALE` and
 * `locale` in `edge-cli.conf` — plus `LANG` are all typed by a human. A
 * case-sensitive lookup made `--locale=DE` give German number formatting
 * with English strings, print "No translation table for locale DE" on every
 * engine start, and publish `localeMatched: false` about a language the
 * build ships; `LANG=EN_US.UTF-8` made the mismatch warning fire on every
 * command for the life of the engine, which is the false alarm the table
 * comparison was introduced to end.
 */
export function resolveLocaleTable(
  locale: string
): keyof typeof allLocales | undefined {
  // Separators out, case down: `es_MX`, `es-MX`, `esMX` and `ES-mx` are one
  // choice, and `esmx` finds the `esMX` table.
  const normalizedLocale = locale.replace(/[-_]/g, '').toLowerCase()

  // An exact match, then the pure language one (ie. find 'es' when 'esMX' is
  // chosen).
  for (const key of [normalizedLocale, normalizedLocale.slice(0, 2)]) {
    const found = LOCALE_KEYS_BY_LOWER.get(key)
    if (found != null) return found as keyof typeof allLocales
  }
  return undefined
}

/**
 * The same answer, with `undefined` given its real meaning.
 *
 * `selectLocale` seeds English for every tag it finds no table for, so two
 * unshipped tags — and an unshipped tag against `en-US` — are one choice.
 * Comparing the raw `undefined` made the client's mismatch warning fire once
 * per command about an engine that was already answering in English, which
 * is the false alarm the table comparison was introduced to end: Edge ships
 * twelve tables, so most of a developer's `LANG` values resolve to nothing.
 */
export function resolveLocaleTableOrEnglish(
  locale: string
): keyof typeof allLocales {
  return resolveLocaleTable(locale) ?? 'en'
}

/**
 * Merge a locale's table into `lstrings`, in place.
 *
 * Not idempotent across *different* tags on its own: `mergeStrings` only
 * ever writes over the keys its table has a value for, so a second tag
 * leaves the first one's strings wherever the second has a gap. `lstrings`
 * is re-seeded from English first, which makes a sequence of calls answer
 * for the last tag alone — `applyLocale` relies on it, and the tests relied
 * on calling `selectLocale('en')` by hand.
 *
 * Including the call that finds no table. The re-seed used to sit after the
 * `return false`, so a tag the build does not ship left the previous
 * language installed while `getAppliedLocale`, `GET /engine/status` and the
 * client's warning all reported English: `de-DE` then `nl-NL` answered
 * `localeMatched: false` over a German `lstrings`.
 */
export function selectLocale(locale: string): boolean {
  const key = resolveLocaleTable(locale)
  mergeStrings(lstrings as Record<string, string>, en)
  if (key == null) return false
  if (key !== 'en')
    mergeStrings(lstrings as Record<string, string>, allLocales[key])
  return true
}
