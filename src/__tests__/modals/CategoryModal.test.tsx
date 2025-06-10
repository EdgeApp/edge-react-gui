import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { defaultCategories } from '../../actions/CategoriesActions'
import { CategoryModal } from '../../components/modals/CategoryModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('CategoryModal', () => {
  const fakeAccount: any = { disklet: { getText: async () => '' } }
  const fakeState: FakeState = {
    core: {
      account: fakeAccount
    },
    ui: {
      subcategories: defaultCategories.slice(0, 4)
    }
  }

  it('should render with an empty subcategory', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Exchange:" />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render with a subcategory', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <CategoryModal bridge={fakeAirshipBridge} initialCategory="Income:Paycheck" />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
