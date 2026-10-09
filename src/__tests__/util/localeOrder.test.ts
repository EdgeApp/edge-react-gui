import { afterEach, describe, expect, it, jest } from '@jest/globals'

// Imported at the top of the file, which is the hazard itself: these three
// modules evaluate before any locale is applied, exactly as they do in the
// app when a side-effect import happens to come first.
import {
  categoryName,
  displayCategories,
  formatCategory
} from '../../actions/CategoriesActions'
import { applyLocale } from '../../locales/bootLocale'
import { lstrings } from '../../locales/strings'
import { getMemoLabel, getMemoTitle } from '../../util/memoUtils'
import { getPaymentTypeDisplayName } from '../../util/paymentTypeUtils'
import { txActionLabel } from '../../util/txDisplay/txActionLabels'

jest.mock('../../components/services/AirshipInstance', () => ({
  showError: jest.fn()
}))

const english = {
  languageTag: 'en-US',
  decimalSeparator: '.',
  groupingSeparator: ','
}

/**
 * A translated string must not depend on which module loaded first.
 *
 * It used to be correct by construction: `strings.ts` ran `selectLocale` as
 * part of its own module evaluation, so importing `lstrings` forced the
 * language to be applied first. The language is now applied by a separate
 * module — `initLocale` in the app, `bootNodeLocale` in the CLI — that these
 * modules do not import, so a module-scope capture freezes whatever
 * `lstrings` held at import time, and the failure is silent and partial:
 * the memo labels, the payment types and the transaction categories render
 * in English while the rest of the app is translated.
 *
 * These three sit on the CLI's import graph or were rewritten by the change
 * that moved the boot, and an ESLint rule now refuses a new module-scope
 * `lstrings.` read under `src/cli`, `src/util` and `src/locales`.
 */
describe('a module that reads lstrings', () => {
  afterEach(() => {
    applyLocale(english)
  })

  it('answers in the applied language, not the one at import time', () => {
    const before = {
      memo: getMemoLabel('comment'),
      title: getMemoTitle('comment'),
      payment: getPaymentTypeDisplayName('credit'),
      category: formatCategory({ category: 'expense', subcategory: '' })
    }
    expect(applyLocale({ ...english, languageTag: 'it' }).matched).toBe(true)
    expect(getMemoLabel('comment')).not.toBe(before.memo)
    expect(getMemoTitle('comment')).not.toBe(before.title)
    expect(getPaymentTypeDisplayName('credit')).not.toBe(before.payment)
    expect(formatCategory({ category: 'expense', subcategory: '' })).not.toBe(
      before.category
    )
  })

  it('answers the four category names in the applied language', () => {
    const before = displayCategories()
    expect(applyLocale({ ...english, languageTag: 'de' }).matched).toBe(true)
    const after = displayCategories()
    for (const key of ['transfer', 'exchange', 'expense', 'income'] as const) {
      expect(after[key]).not.toBe(before[key])
    }
  })

  it('keeps a subcategory the user wrote, in any language', () => {
    applyLocale({ ...english, languageTag: 'de' })
    const formatted = formatCategory({
      category: 'expense',
      subcategory: 'Bohnen'
    })
    expect(formatted.endsWith(':Bohnen')).toBe(true)
  })
})

/**
 * The label table is static keys read late, which is both properties at once.
 *
 * A module-scope table of *strings* froze them at import time; rebuilding the
 * whole table per call fixed that and cost 151ns against 7ns on a path that
 * runs once per transaction. A table of key names is one indexed read and
 * still resolves after the boot.
 */
describe('txActionLabel', () => {
  afterEach(() => {
    applyLocale(english)
  })

  it('answers in the applied language', () => {
    const before = txActionLabel('claim')
    expect(applyLocale({ ...english, languageTag: 'it' }).matched).toBe(true)
    expect(txActionLabel('claim')).not.toBe(before)
  })

  it('reads one key per call, not a whole table', () => {
    // Counted, not compared. The assertion here used to be
    // `txActionLabel('claim') === txActionLabel('claim')`, under a comment
    // claiming it caught a rebuilt literal — `toBe` is `Object.is`, which
    // compares string *contents*, so a twenty-key literal rebuilt per call
    // passes it exactly as a static table does. Reverting to the 151ns
    // shape this branch replaced left the suite green, on a path that runs
    // once per visible row while a list scrolls and once per transaction
    // inside the export scene's synchronous map over a whole history.
    expect(countLstringReads(() => txActionLabel('claim'))).toBe(1)
  })
})

/**
 * How many `lstrings` values a call reads.
 *
 * `lstrings` is the plain object `applyLocale` mutates in place, so a
 * counting getter over the keys a table would touch is enough: a function
 * that indexes one key reads 1, and one that rebuilds its table reads one
 * per entry.
 */
function countLstringReads(fn: () => unknown): number {
  const table = lstrings as unknown as Record<string, string>
  const keys = Object.keys(table)
  const values = new Map(keys.map(key => [key, table[key]]))
  let reads = 0
  for (const key of keys) {
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get() {
        ++reads
        return values.get(key)
      }
    })
  }
  try {
    fn()
  } finally {
    for (const key of keys) {
      Object.defineProperty(table, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: values.get(key)
      })
    }
  }
  return reads
}

/**
 * The same property, for the category table.
 *
 * `categoryName` is reached by `formatCategory`, so by `TransactionListRow`
 * once per visible row and by `CategoryModal`'s 400-entry memo on every
 * keystroke — and it had no allocation test at all, only a comment in
 * `CategoriesActions.ts` pointing at the one above that held nothing.
 */
describe('categoryName', () => {
  afterEach(() => {
    applyLocale(english)
  })

  it('reads one key per call, not a whole table', () => {
    expect(countLstringReads(() => categoryName('expense'))).toBe(1)
  })

  it('answers in the applied language', () => {
    const before = categoryName('expense')
    expect(applyLocale({ ...english, languageTag: 'it' }).matched).toBe(true)
    expect(categoryName('expense')).not.toBe(before)
  })
})
