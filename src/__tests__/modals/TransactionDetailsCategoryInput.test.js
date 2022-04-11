/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { TransactionDetailsCategoryInput } from '../../components/modals/TransactionDetailsCategoryInput'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('TransactionDetailsCategoryInput', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      categories: {
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
      },
      subCategories: ['exchange', 'income', 'expense'],
      category: 'exchange',
      subCategory: '',
      // eslint-disable-next-line no-empty-pattern
      setNewSubcategory: (string, []) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<TransactionDetailsCategoryInput {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
