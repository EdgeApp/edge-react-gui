export type Category = 'transfer' | 'exchange' | 'expense' | 'income'

export interface EdgeCategory {
  category: Category
  subcategory: string
}

const prefixes: Record<Category, string> = {
  transfer: 'Transfer:',
  exchange: 'Exchange:',
  expense: 'Expense:',
  income: 'Income:'
}

const tests: Array<[Category, RegExp, number]> = [
  ['transfer', /^Transfer:/i, 9],
  ['exchange', /^Exchange:/i, 9],
  ['expense', /^Expense:/i, 8],
  ['income', /^Income:/i, 7]
]

/**
 * Splits a string into its category and subcategory strings.
 * The category must fit our enum type, or we will use a fallback.
 * The subcategory can be localized and freely edited.
 */
export function splitCategory(
  fullCategory: string = '',
  defaultCategory: Category = 'income'
): EdgeCategory {
  // Every prefix test requires the colon, so a bare `Expense` still has to
  // match the expense category. The original string is what the fallback
  // below reads, so this added colon cannot leak into a result.
  const probe =
    fullCategory.length > 0 && !fullCategory.includes(':')
      ? `${fullCategory}:`
      : fullCategory
  for (const [category, test, n] of tests) {
    if (test.test(probe)) {
      return {
        category,
        subcategory: probe.slice(n)
      }
    }
  }

  // We can't guarantee that data on disk is correct, but this should usually
  // never happen. The whole stored string becomes the subcategory, because
  // none of it is a category this code recognises and all of it is text a
  // user — or a dapp through `edgeProvider`, or `--metadata` — put there.
  //
  // Slicing at the first colon looked tidier and silently destroyed data:
  // `Shopping:Food` came back as `{ category: 'income', subcategory: 'Food' }`,
  // and `TransactionDetailsScene` round-trips exactly that pair through
  // `joinCategory`, so the first time a user opened and saved such a
  // transaction the `Shopping` segment was written away. The appended-colon
  // case the `probe` above exists for is already handled there, so nothing
  // here needs to strip anything.
  return { category: defaultCategory, subcategory: fullCategory }
}

/**
 * Combine the category and subcategory into a single string,
 * with the correct capitalization.
 */
export function joinCategory(split: EdgeCategory): string {
  return prefixes[split.category] + split.subcategory
}
