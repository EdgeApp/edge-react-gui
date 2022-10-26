import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CategoryModal } from '../../components/modals/CategoryModal'
import s from '../../locales/strings'
import { defaultCategories } from '../../util/categories'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('CategoryModal', () => {
  const categories = {
    exchange: {
      syntax: s.strings.fragment_transaction_exchange,
      key: 'exchange'
    },
    expense: {
      syntax: s.strings.fragment_transaction_expense,
      key: 'expense'
    },
    transfer: {
      syntax: s.strings.fragment_transaction_transfer,
      key: 'transfer'
    },
    income: {
      syntax: s.strings.fragment_transaction_income,
      key: 'income'
    }
  }

  it('should render with an empty subcategory', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <CategoryModal
        bridge={fakeAirshipBridge}
        categories={categories}
        subCategories={defaultCategories.slice(0, 4)}
        category="exchange"
        subCategory=""
        setNewSubcategory={(input: string, subCategories: string[]) => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })

  it('should render with a subcategory', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <CategoryModal
        bridge={fakeAirshipBridge}
        categories={categories}
        subCategories={defaultCategories.slice(0, 4)}
        category="income"
        subCategory="Paycheck"
        setNewSubcategory={(input: string, subCategories: string[]) => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
