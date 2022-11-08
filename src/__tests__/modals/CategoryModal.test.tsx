import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
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
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Exchange:" />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render with a subcategory', () => {
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Income:Paycheck" />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
