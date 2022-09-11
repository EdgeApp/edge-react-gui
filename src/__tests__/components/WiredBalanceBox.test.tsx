/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { BalanceBox } from '../../components/themed/WiredBalanceBox'

describe('BalanceBox', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      showBalance: true,
      fiatAmount: 11,
      defaultIsoFiat: 'string',
      exchangeRates: 'GuiExchangeRates',
      toggleAccountBalanceVisibility: () => undefined,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<BalanceBox {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
