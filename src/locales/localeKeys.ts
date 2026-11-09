/**
 * Which translation table a locale tag selects, without the tables.
 *
 * Table-free on purpose. The CLI client renders no localized string — `git
 * grep lstrings src/cli` outside `engine/` is empty — and `bootNodeLocale`
 * says so, while `locales/strings` statically imports `en_US.ts` and eleven
 * JSON tables and keeps them live through `allLocales`. Importing the
 * resolution from there would put every table into the client bundle,
 * `lib/edgeCli.js`, which never looks at them.
 *
 * The client needs the key list, not the tables, so the list lives here and
 * `strings.ts` imports it rather than deriving it from `allLocales`. A test
 * pins the two together.
 */

/**
 * Every table the build ships, English first.
 *
 * The same order and spelling as `allLocales` in `strings.ts`; `esMX`
 * carries Crowdin's `%two_letters_code%` override.
 */
export const LOCALE_KEYS = [
  'en',
  'de',
  'ru',
  'es',
  'esMX',
  'it',
  'pt',
  'ja',
  'fr',
  'ko',
  'vi',
  'zh'
] as const

export type LocaleKey = (typeof LOCALE_KEYS)[number]

/** The locale keys, indexed by their lower-cased spelling. */
const LOCALE_KEYS_BY_LOWER = new Map<string, LocaleKey>(
  LOCALE_KEYS.map(key => [key.toLowerCase(), key])
)

/**
 * The table a locale tag selects, or undefined when none does.
 *
 * Exported because the *table* is what decides what a user sees, and two
 * tags that select the same one are the same choice: `en` and `en-US` both
 * answer in English, `de` and `de-DE` both merge `de.json`. The
 * engine-locale mismatch warning compares tables, so a difference with no
 * effect, such as a container or CI shell setting a bare `LANG=en`, does
 * not set it off once per command for the life of an engine.
 *
 * Locale tags arrive as 'en', 'en-US', 'en_US' or 'enUS'.
 *
 * Case-insensitively, because BCP 47 is: RFC 5646 §2.1.1 says "the tag is to
 * be treated as case-insensitive", `Intl.NumberFormat` treats it that way,
 * and the three CLI inputs for it — `--locale`, `EDGE_CLI_LOCALE` and
 * `locale` in `edge-cli.conf` — plus `LANG` are all typed by a human. A
 * case-sensitive lookup would make `--locale=DE` give German number
 * formatting with English strings, print "No translation table for locale
 * DE" on every engine start, and publish `localeMatched: false` about a
 * language the build ships.
 */
export function resolveLocaleTable(locale: string): LocaleKey | undefined {
  // Separators out, case down: `es_MX`, `es-MX`, `esMX` and `ES-mx` are one
  // choice, and `esmx` finds the `esMX` table.
  const normalizedLocale = locale.replace(/[-_]/g, '').toLowerCase()

  // An exact match, then the pure language one (ie. find 'es' when 'esMX' is
  // chosen).
  for (const key of [normalizedLocale, normalizedLocale.slice(0, 2)]) {
    const found = LOCALE_KEYS_BY_LOWER.get(key)
    if (found != null) return found
  }
  return undefined
}

/**
 * The same answer, with `undefined` given its real meaning.
 *
 * `selectLocale` seeds English for every tag it finds no table for, so two
 * unshipped tags — and an unshipped tag against `en-US` — are one choice.
 * Comparing the raw `undefined` would make the client's mismatch warning
 * fire once per command about an engine that is already answering in
 * English: Edge ships twelve tables, so most of a developer's `LANG` values
 * resolve to nothing.
 */
export function resolveLocaleTableOrEnglish(locale: string): LocaleKey {
  return resolveLocaleTable(locale) ?? 'en'
}
