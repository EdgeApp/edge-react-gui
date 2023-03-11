import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CategoryModal } from '../../components/modals/CategoryModal'
import { defaultCategories } from '../../util/categories'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('CategoryModal', () => {
  const fakeState: FakeState = {
    ui: {
      scenes: {
        transactionDetails: {
          subcategories: defaultCategories.slice(0, 4)
        }
      }
    }
  }

  it('should render with an empty subcategory', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Exchange:" />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render with a subcategory', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Income:Paycheck" />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
