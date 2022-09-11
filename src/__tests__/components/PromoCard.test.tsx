/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { PromoCardComponent } from '../../components/cards/PromoCard'
import { getTheme } from '../../components/services/ThemeContext'

describe('PromoCard', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      accountMessages: ['MessageTweak'],
      accountReferral: {
        installerId: 'string',
        currencyCodes: ['BTC'],
        promotions: [],
        ignoreAccountSwap: true,
        hiddenAccountMessages: ['messageId']
      },

      // @ts-expect-error
      hideMessageTweak: (messageId, source) => undefined,
      // @ts-expect-error
      linkReferralWithCurrencies: uri => undefined,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<PromoCardComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
