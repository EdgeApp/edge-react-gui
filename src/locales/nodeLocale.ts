/**
 * CLI locale detection. No react-native.
 */
import type { LocaleSource } from './bootLocale'

export interface DetectNodeLocaleOpts {
  argv?: string[]
  env?: NodeJS.ProcessEnv
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

export function parseLocaleFlag(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--locale') {
      const next = argv[i + 1]
      if (next == null || next.startsWith('-')) return undefined
      return next
    }
    if (a.startsWith('--locale=')) {
      const value = a.slice('--locale='.length)
      return value === '' ? undefined : value
    }
  }
  return undefined
}

export function parseConfigPathFlag(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-c' || a === '--config') {
      const next = argv[i + 1]
      if (next == null || next.startsWith('-')) return undefined
      return next
    }
    if (a.startsWith('--config=')) {
      const value = a.slice('--config='.length)
      return value === '' ? undefined : value
    }
  }
  return undefined
}

function nonempty(value: string | undefined): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function posixLanguageTag(env: NodeJS.ProcessEnv): string | undefined {
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
