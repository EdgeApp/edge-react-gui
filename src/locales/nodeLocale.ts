/**
 * CLI locale detection. No react-native.
 */
import type { LocaleSource } from './bootLocale'

/**
 * The environment variables this reads, and nothing else.
 *
 * `process.env` satisfies it, but so does `{ LANG: 'es_MX.UTF-8' }`. Typing
 * this as `NodeJS.ProcessEnv` demanded `NODE_ENV` from every caller, which no
 * locale test has any reason to set.
 */
export type LocaleEnv = Readonly<Record<string, string | undefined>>

export interface DetectNodeLocaleOpts {
  argv?: string[]
  env?: LocaleEnv
  configLocale?: string
}

/**
 * POSIX / BCP-47 tag → hyphenated language tag for Intl and selectLocale.
 * `es_MX.UTF-8@euro` → `es-MX`; `C` / `POSIX` / empty → `en-US`.
 */
export function normalizePosixLocale(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === 'C' || trimmed === 'POSIX') return 'en-US'
  const noModifier = trimmed.split('@')[0] ?? trimmed
  const noEncoding = noModifier.split('.')[0] ?? noModifier
  const hyphenated = noEncoding.replace(/_/g, '-')
  return hyphenated === '' ? 'en-US' : hyphenated
}

/**
 * The value of one flag in argv, in either spelling, or undefined.
 *
 * Deliberately lenient and deliberately separate from the real parsers in
 * `src/cli/parseArgs.ts` and `src/cli/engine/index.ts`: this runs *before*
 * either of them, from the locale boot, where a usage error has nowhere to
 * go and the only sensible answer to an unreadable flag is the default. The
 * real parser reports it a moment later.
 *
 * `parseLocaleFlag` and `parseConfigPathFlag` were byte-identical apart from
 * the names they matched.
 */
function parseEarlyFlag(
  argv: string[],
  long: string,
  short?: string
): string | undefined {
  const equals = `${long}=`
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === long || (short != null && a === short)) {
      const next = argv[i + 1]
      if (next == null || next.startsWith('-')) return undefined
      return next
    }
    if (a.startsWith(equals)) {
      const value = a.slice(equals.length)
      return value === '' ? undefined : value
    }
  }
  return undefined
}

export function parseLocaleFlag(argv: string[]): string | undefined {
  return parseEarlyFlag(argv, '--locale')
}

export function parseConfigPathFlag(argv: string[]): string | undefined {
  return parseEarlyFlag(argv, '--config', '-c')
}

function nonempty(value: string | undefined): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function posixLanguageTag(env: LocaleEnv): string | undefined {
  return nonempty(env.LC_ALL) ?? nonempty(env.LC_MESSAGES) ?? nonempty(env.LANG)
}

export function numberSeparators(languageTag: string): {
  decimalSeparator: string
  groupingSeparator: string
} {
  try {
    const parts = new Intl.NumberFormat(languageTag, {
      useGrouping: true
    }).formatToParts(1234567.89)
    const decimal = parts.find(part => part.type === 'decimal')?.value ?? '.'
    const grouping = parts.find(part => part.type === 'group')?.value ?? ','
    if (decimal === '' || grouping === '') {
      return { decimalSeparator: '.', groupingSeparator: ',' }
    }
    return { decimalSeparator: decimal, groupingSeparator: grouping }
  } catch {
    return { decimalSeparator: '.', groupingSeparator: ',' }
  }
}

/**
 * Precedence: --locale, config locale, EDGE_CLI_LOCALE, LC_ALL / LC_MESSAGES /
 * LANG, Intl, en-US. One tag drives language and number format.
 */
export function detectNodeLocale(
  opts: DetectNodeLocaleOpts = {}
): LocaleSource {
  const env = opts.env ?? process.env
  const argv = opts.argv ?? []
  const raw =
    nonempty(parseLocaleFlag(argv)) ??
    nonempty(opts.configLocale) ??
    nonempty(env.EDGE_CLI_LOCALE) ??
    posixLanguageTag(env) ??
    nonempty(Intl.DateTimeFormat().resolvedOptions().locale) ??
    'en-US'
  const languageTag = normalizePosixLocale(raw)
  return {
    languageTag,
    ...numberSeparators(languageTag)
  }
}

export function localeTagsMatch(a: string, b: string): boolean {
  return (
    a.replace(/[-_]/g, '').toLowerCase() ===
    b.replace(/[-_]/g, '').toLowerCase()
  )
}
