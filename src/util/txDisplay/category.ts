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
  if (fullCategory.length > 0 && !fullCategory.includes(':')) {
    fullCategory += ':'
  }
  for (const [category, test, n] of tests) {
    if (test.test(fullCategory)) {
      return {
        category,
        subcategory: fullCategory.slice(n)
      }
    }
  }

  // We can't guarantee that data on disk is correct,
  // but this should usually never happen:
  return {
    category: defaultCategory,
    subcategory: fullCategory.replace(/^[^:]:/, '')
  }
}

/**
 * Combine the category and subcategory into a single string,
 * with the correct capitalization.
 */
export function joinCategory(split: EdgeCategory): string {
  return prefixes[split.category] + split.subcategory
}
