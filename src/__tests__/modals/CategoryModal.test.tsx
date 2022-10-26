import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CategoryModal } from '../../components/modals/CategoryModal'
import { rootReducer } from '../../reducers/RootReducer'
import { defaultCategories } from '../../util/categories'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('CategoryModal', () => {
  const fakeState: any = {
    ui: {
      scenes: {
        transactionDetails: {
          subcategories: defaultCategories.slice(0, 4)
        }
      }
    }
  }
  const store = createStore(rootReducer, fakeState)

  it('should render with an empty subcategory', () => {
    const actual = renderer.create(
      <Provider store={store}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Exchange:" />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })

  it('should render with a subcategory', () => {
    const actual = renderer.create(
      <Provider store={store}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Income:Paycheck" />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
