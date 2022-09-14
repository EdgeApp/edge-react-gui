// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { BalanceBox } from '../../components/themed/WiredBalanceBox.js'

describe('BalanceBox', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
      showBalance: true,
      fiatAmount: 11,
      defaultIsoFiat: 'string',
      exchangeRates: 'GuiExchangeRates',
      toggleAccountBalanceVisibility: () => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<BalanceBox {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
