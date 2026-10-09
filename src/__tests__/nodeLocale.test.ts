import { afterEach, describe, expect, test } from '@jest/globals'

import { applyLocale, getAppliedLocale } from '../locales/bootLocale'
import { locale as intlLocale } from '../locales/intl'
import {
  detectNodeLocale,
  normalizePosixLocale,
  numberSeparators,
  parseLocaleFlag
} from '../locales/nodeLocale'
import {
  lstrings,
  resolveLocaleTable,
  resolveLocaleTableOrEnglish,
  selectLocale
} from '../locales/strings'

describe('normalizePosixLocale', () => {
  test('strips encoding and modifier', () => {
    expect(normalizePosixLocale('es_MX.UTF-8@euro')).toBe('es-MX')
  })
  test('C and POSIX become en-US', () => {
    expect(normalizePosixLocale('C')).toBe('en-US')
    expect(normalizePosixLocale('POSIX')).toBe('en-US')
    expect(normalizePosixLocale('')).toBe('en-US')
  })
  // The spellings an environment actually sets. `C.UTF-8` is the Debian-family
  // container and CI default, and it used to normalise to the tag `C`.
  test('a suffixed C locale becomes en-US too', () => {
    expect(normalizePosixLocale('C.UTF-8')).toBe('en-US')
    expect(normalizePosixLocale('C.utf8')).toBe('en-US')
    expect(normalizePosixLocale('POSIX.UTF-8')).toBe('en-US')
    expect(normalizePosixLocale('C@euro')).toBe('en-US')
  })
  test('keeps hyphenated tags', () => {
    expect(normalizePosixLocale('de-DE')).toBe('de-DE')
  })
})

describe('parseLocaleFlag', () => {
  test('reads --locale value', () => {
    expect(parseLocaleFlag(['--locale', 'fr'])).toBe('fr')
  })
  test('reads --locale=', () => {
    expect(parseLocaleFlag(['--locale=ja'])).toBe('ja')
  })
})

describe('detectNodeLocale', () => {
  test('argv wins over env', () => {
    const source = detectNodeLocale({
      argv: ['--locale', 'de-DE'],
      env: { LANG: 'fr_FR.UTF-8', EDGE_CLI_LOCALE: 'es' }
    })
    expect(source.languageTag).toBe('de-DE')
  })
  test('config wins over EDGE_CLI_LOCALE', () => {
    const source = detectNodeLocale({
      argv: [],
      env: { EDGE_CLI_LOCALE: 'ja' },
      configLocale: 'it'
    })
    expect(source.languageTag).toBe('it')
  })
  test('LANG es_MX.UTF-8', () => {
    const source = detectNodeLocale({
      argv: [],
      env: { LANG: 'es_MX.UTF-8' }
    })
    expect(source.languageTag).toBe('es-MX')
  })
})

describe('numberSeparators', () => {
  test('de-DE uses comma decimal', () => {
    const seps = numberSeparators('de-DE')
    expect(seps.decimalSeparator).toBe(',')
    expect(seps.groupingSeparator).toBe('.')
  })
})

describe('selectLocale', () => {
  afterEach(() => {
    // One call, because `selectLocale` re-seeds `lstrings` from English
    // before it merges. This used to need a hand-written `selectLocale('en')`
    // first: `applyLocale` could not undo the merges these cases perform,
    // which is the workaround that said the function was not idempotent.
    applyLocale({
      languageTag: 'en-US',
      decimalSeparator: '.',
      groupingSeparator: ','
    })
  })

  test('de changes a known string', () => {
    const english = lstrings.action_queue_display_unknown_message
    const matched = selectLocale('de')
    expect(matched).toBe(true)
    expect(lstrings.action_queue_display_unknown_message).not.toBe(english)
  })

  test('zh_CN falls back to zh', () => {
    expect(selectLocale('zh-CN')).toBe(true)
  })

  test('es-MX matches esMX table', () => {
    expect(selectLocale('es-MX')).toBe(true)
  })
})

describe('resolveLocaleTable', () => {
  test('two tags that select one table are the same choice', () => {
    // What the engine-locale warning compares now: `en` and `en-US` both
    // answer in English, so warning about the difference told a user about
    // nothing — once per command, for the life of that engine.
    expect(resolveLocaleTable('en')).toBe(resolveLocaleTable('en-US'))
    expect(resolveLocaleTable('de')).toBe(resolveLocaleTable('de_DE'))
    expect(resolveLocaleTable('es-MX')).toBe('esMX')
    expect(resolveLocaleTable('es-ES')).toBe('es')
  })

  test('reads a tag whatever its case, as BCP 47 requires', () => {
    // RFC 5646 §2.1.1: "the tag is to be treated as case-insensitive", and
    // `Intl` treats it that way — so a case-sensitive lookup made
    // `--locale=DE` give German number formatting with English strings, and
    // `LANG=EN_US.UTF-8` make the mismatch warning fire on every command for
    // the life of the engine. These four spellings are what a human types
    // into `--locale`, `EDGE_CLI_LOCALE`, `edge-cli.conf` or `LANG`.
    expect(resolveLocaleTable('DE')).toBe('de')
    expect(resolveLocaleTable('EN-US')).toBe('en')
    expect(resolveLocaleTable('ES-MX')).toBe('esMX')
    expect(resolveLocaleTable('es-mx')).toBe('esMX')
    expect(resolveLocaleTable('ZH')).toBe('zh')
  })

  test('is undefined for a language with no table', () => {
    expect(resolveLocaleTable('xx-YY')).toBeUndefined()
    expect(resolveLocaleTable('XX-yy')).toBeUndefined()
  })

  test('no table is the English choice, for the warning that compares them', () => {
    // Edge ships twelve tables, so most of a developer's `LANG` values
    // resolve to nothing — and `undefined !== 'en'` made the client warn
    // that `nl-NL` and a cron shell's `en-US` were different languages, on
    // every command for the life of that engine. Both answer in English.
    expect(resolveLocaleTableOrEnglish('nl-NL')).toBe(
      resolveLocaleTableOrEnglish('en-US')
    )
    expect(resolveLocaleTableOrEnglish('pl-PL')).toBe('en')
    expect(resolveLocaleTableOrEnglish('de-DE')).toBe('de')
  })
})

/**
 * `AppliedLocale` has to mean the locale that took effect.
 *
 * `matched` always did — it comes from what `selectLocale` really resolved —
 * and the two separators did not: they were copied from the caller's
 * request, while `setIntlLocale` substitutes the English marks when either
 * is empty. That is not a corner: it is the case `intl.ts` added the
 * substitution for, an OS reporting no separator, and on the GUI path
 * `initLocale` feeds `getNumberFormatSettings()` straight through. So
 * `getAppliedLocale()` answered `decimalSeparator: ''` while
 * `intl.locale.decimalSeparator` was `'.'`, and `GET /engine/status`
 * published the wrong one of the two.
 */
describe('getAppliedLocale', () => {
  afterEach(() => {
    applyLocale({
      languageTag: 'en-US',
      decimalSeparator: '.',
      groupingSeparator: ','
    })
  })

  test('reports the separators that were installed', () => {
    const applied = applyLocale({
      languageTag: 'de',
      decimalSeparator: '',
      groupingSeparator: ''
    })
    expect(applied.decimalSeparator).toBe(intlLocale.decimalSeparator)
    expect(applied.groupingSeparator).toBe(intlLocale.groupingSeparator)
    expect(applied.decimalSeparator).toBe('.')
    // The language is a separate failure from the number format, and it did
    // take effect.
    expect(applied.languageTag).toBe('de')
    expect(applied.matched).toBe(true)
    expect(getAppliedLocale()).toStrictEqual(applied)
  })

  test('reports a real separator unchanged', () => {
    const applied = applyLocale({
      languageTag: 'de',
      decimalSeparator: ',',
      groupingSeparator: '.'
    })
    expect(applied.decimalSeparator).toBe(',')
    expect(applied.groupingSeparator).toBe('.')
    expect(intlLocale.decimalSeparator).toBe(',')
  })

  test('is still idempotent for a repeated source', () => {
    // The idempotence test compares the *source*, not the installed value:
    // keyed on `applied`, a source with empty separators would never match
    // what it installed and every call would re-merge the language tables.
    const first = applyLocale({
      languageTag: 'de',
      decimalSeparator: '',
      groupingSeparator: ''
    })
    const second = applyLocale({
      languageTag: 'de',
      decimalSeparator: '',
      groupingSeparator: ''
    })
    expect(second).toBe(first)
  })
})

/**
 * A second `applyLocale` answers for its own tag, not a mixture.
 *
 * `mergeStrings` only writes the keys its own table has a value for, so a
 * sequence of tags used to leave each one's strings wherever the next had a
 * gap — `fr-FR` then `de-DE` read French in every key `de.json` is missing —
 * and `en-US` skipped `selectLocale` entirely, so English was the one
 * language a second call could not restore. The tests had to call
 * `selectLocale('en')` by hand in an `afterEach` to undo their own merges,
 * which is the workaround that said so.
 */
describe('applyLocale across tags', () => {
  const english = {
    languageTag: 'en-US',
    decimalSeparator: '.',
    groupingSeparator: ','
  }

  afterEach(() => {
    applyLocale(english)
  })

  test('switching tags does not leave the previous language behind', () => {
    const inEnglish = lstrings.fragment_transaction_expense
    applyLocale({ ...english, languageTag: 'fr-FR' })
    const inFrench = lstrings.fragment_transaction_expense
    expect(inFrench).not.toBe(inEnglish)

    applyLocale({ ...english, languageTag: 'de-DE' })
    const inGerman = lstrings.fragment_transaction_expense
    expect(inGerman).not.toBe(inFrench)
    expect(inGerman).not.toBe(inEnglish)
  })

  test('English is restored like any other tag', () => {
    const inEnglish = lstrings.fragment_transaction_expense
    applyLocale({ ...english, languageTag: 'de-DE' })
    expect(lstrings.fragment_transaction_expense).not.toBe(inEnglish)
    applyLocale(english)
    expect(lstrings.fragment_transaction_expense).toBe(inEnglish)
  })

  test('a repeat of the same source is still free', () => {
    const first = applyLocale({ ...english, languageTag: 'de-DE' })
    const second = applyLocale({ ...english, languageTag: 'de-DE' })
    expect(second).toBe(first)
  })

  test('an unshipped tag really answers in English', () => {
    // The re-seed used to sit after `selectLocale`'s `return false`, so a
    // language the build does not ship left the previous one installed while
    // `getAppliedLocale`, `GET /engine/status` and the client's warning all
    // reported English. `matched: false` has one documented meaning — "the
    // engine is answering in English" — and this is the path that broke it.
    const inEnglish = lstrings.fragment_transaction_expense
    applyLocale({ ...english, languageTag: 'de-DE' })
    expect(lstrings.fragment_transaction_expense).not.toBe(inEnglish)

    const applied = applyLocale({ ...english, languageTag: 'nl-NL' })
    expect(applied.matched).toBe(false)
    expect(lstrings.fragment_transaction_expense).toBe(inEnglish)
  })
})

describe('detectNodeLocale cost', () => {
  it('builds no Intl.NumberFormat until the separators are read', () => {
    // `bootNodeLocale` runs detection at module scope on every `edge`
    // invocation, and the client reads only `.languageTag` — the separators
    // belong to `bootEngineLocale` and `routes/status.ts`, both engine-side.
    // Constructing the first `Intl.NumberFormat` is what pays V8's ICU
    // initialisation, about 30ms of the client's ~180ms of user CPU for a
    // value nobody on that path looks at.
    const RealNumberFormat = Intl.NumberFormat
    let built = 0
    // @ts-expect-error replacing a global for the duration of this case
    Intl.NumberFormat = function (...args: unknown[]) {
      ++built
      // @ts-expect-error forwarding to the real constructor
      return new RealNumberFormat(...args)
    }
    try {
      const source = detectNodeLocale({ env: { LANG: 'de_DE.UTF-8' } })
      expect(source.languageTag).toBe('de-DE')
      expect(built).toBe(0)

      // And it still answers, once something asks.
      expect(source.decimalSeparator).toBe(',')
      expect(source.groupingSeparator).toBe('.')
      expect(built).toBeGreaterThan(0)

      // Memoized: a second read costs nothing.
      const after = built
      expect(source.decimalSeparator).toBe(',')
      expect(built).toBe(after)
    } finally {
      Intl.NumberFormat = RealNumberFormat
    }
  })
})
