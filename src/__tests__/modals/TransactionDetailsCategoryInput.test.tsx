import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { TransactionDetailsCategoryInput } from '../../components/modals/TransactionDetailsCategoryInput'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('TransactionDetailsCategoryInput', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

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
      setNewSubcategory: (input: string, subCategories: string[]) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<TransactionDetailsCategoryInput {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
