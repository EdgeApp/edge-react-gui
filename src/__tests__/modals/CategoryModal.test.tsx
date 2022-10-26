import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CategoryModal } from '../../components/modals/CategoryModal'
import s from '../../locales/strings'
import { rootReducer } from '../../reducers/RootReducer'
import { defaultCategories } from '../../util/categories'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('CategoryModal', () => {
  const store = createStore(rootReducer)

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
    const actual = renderer.create(
      <Provider store={store}>
        <CategoryModal
          bridge={fakeAirshipBridge}
          categories={categories}
          subCategories={defaultCategories.slice(0, 4)}
          category="exchange"
          subCategory=""
          setNewSubcategory={(input: string, subCategories: string[]) => undefined}
        />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })

  it('should render with a subcategory', () => {
    const actual = renderer.create(
      <Provider store={store}>
        <CategoryModal
          bridge={fakeAirshipBridge}
          categories={categories}
          subCategories={defaultCategories.slice(0, 4)}
          category="income"
          subCategory="Paycheck"
          setNewSubcategory={(input: string, subCategories: string[]) => undefined}
        />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
