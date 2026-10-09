import en from './en_US'
import { resolveLocaleTable } from './localeKeys'
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

/**
 * Every table the build ships.
 *
 * Exported only so a test can hold it against `LOCALE_KEYS`, which is the
 * list the client reads: the two live in different modules precisely so the
 * client does not import these tables, which is also what would let them
 * disagree.
 */
export const allLocales = { en, de, ru, es, esMX, it, pt, ja, fr, ko, vi, zh }

/**
 * The tag-to-table resolution, re-exported from the module that holds it.
 *
 * It lives in `localeKeys.ts` — which imports no table — because the CLI
 * client needs the answer and not the tables: importing it from here
 * dragged all eleven JSON files into `lib/edgeCli.js`, where they were over
 * half the bundle and nothing read them. Re-exported so every existing call
 * site is unchanged.
 */
export {
  type LocaleKey,
  LOCALE_KEYS,
  resolveLocaleTable,
  resolveLocaleTableOrEnglish
} from './localeKeys'

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
