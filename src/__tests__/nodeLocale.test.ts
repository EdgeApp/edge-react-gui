import { afterEach, describe, expect, test } from '@jest/globals'

import { applyLocale } from '../locales/bootLocale'
import {
  detectNodeLocale,
  localeTagsMatch,
  normalizePosixLocale,
  numberSeparators,
  parseLocaleFlag
} from '../locales/nodeLocale'
import { lstrings, selectLocale } from '../locales/strings'

describe('normalizePosixLocale', () => {
  test('strips encoding and modifier', () => {
    expect(normalizePosixLocale('es_MX.UTF-8@euro')).toBe('es-MX')
  })
  test('C and POSIX become en-US', () => {
    expect(normalizePosixLocale('C')).toBe('en-US')
    expect(normalizePosixLocale('POSIX')).toBe('en-US')
    expect(normalizePosixLocale('')).toBe('en-US')
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
    selectLocale('en')
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

describe('localeTagsMatch', () => {
  test('hyphen vs underscore', () => {
    expect(localeTagsMatch('en-US', 'en_US')).toBe(true)
    expect(localeTagsMatch('de', 'fr')).toBe(false)
  })
})
