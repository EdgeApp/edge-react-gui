import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CategoryModal } from '../../components/modals/CategoryModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('CategoryModal', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <CategoryModal
        bridge={fakeAirshipBridge}
        categories={{
          exchange: {
            syntax: 'Hello exchange',
            key: 'exchange'
          },
          expense: {
            syntax: 'Hello expense',
            key: 'expense'
          },
          transfer: {
            syntax: 'Hello transfer',
            key: 'transfer'
          },
          income: {
            syntax: 'Hello income',
            key: 'income'
          }
        }}
        subCategories={['exchange', 'income', 'expense']}
        category="exchange"
        subCategory=""
        setNewSubcategory={(input: string, subCategories: string[]) => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
